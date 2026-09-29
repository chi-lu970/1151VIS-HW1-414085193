"""
將 fetch_dem.py 下載的 DEM 圖磚整合、裁切出台灣本島、降採樣，
輸出三份 D3.js 可直接讀取的 JSON 資料檔。

處理流程：
1. 讀取並拼接（mosaic）所有 DEM 圖磚
2. 裁切到台灣涵蓋範圍的 bounding box
3. 以平均池化降採樣到「統計解析度」網格，計算陸地遮罩：
   - 用高度 > 0 篩出陸地像元
   - 用連通元件分析（connected component）取「面積最大」的陸地區塊 = 本島
     （藉此自動排除澎湖、金門、馬祖等離島，不需額外邊界檔）
4. 用本島遮罩內的像元，統計「各高程區間佔本島面積百分比」
   → elevation-bands.json
5. 再把統計解析度網格進一步降採樣到「顯示解析度」網格（給 d3.contour 用），
   海洋／離島像元填入 sentinel 值 -9999
   → taiwan-dem-grid.json
6. 順便輸出關鍵摘要（面積、最高點等）
   → summary.json
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.warp import calculate_default_transform, reproject, Resampling
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "data"

# 台灣本島涵蓋範圍（WGS84 經緯度），略寬於實際海岸線以保留完整輪廓
BBOX = dict(lon_min=120.0, lon_max=122.05, lat_min=21.7, lat_max=25.4)

STATS_SHAPE = (1300, 1000)   # (rows, cols) 統計解析度網格，約 170m/px，用於面積統計
GRID_SHAPE = (260, 200)      # (rows, cols) 顯示解析度網格，給 d3.contour 使用

ELEVATION_BANDS_M = [0, 100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 10000]
NODATA_SENTINEL = -9999


def mosaic_tiles() -> tuple[np.ndarray, rasterio.Affine, str]:
    tif_paths = sorted(RAW_DIR.glob("*.tif"))
    if not tif_paths:
        raise SystemExit(f"找不到任何 DEM 圖磚，請先執行 fetch_dem.py（預期路徑：{RAW_DIR}）")

    datasets = [rasterio.open(p) for p in tif_paths]
    mosaic, transform = merge(datasets)
    crs = datasets[0].crs
    for ds in datasets:
        ds.close()
    return mosaic[0], transform, crs


def crop_to_bbox(array: np.ndarray, transform: rasterio.Affine):
    from rasterio.windows import from_bounds, transform as window_transform

    window = from_bounds(
        BBOX["lon_min"], BBOX["lat_min"], BBOX["lon_max"], BBOX["lat_max"], transform
    )
    window = window.round_offsets().round_lengths()
    row_off, col_off = int(window.row_off), int(window.col_off)
    height, width = int(window.height), int(window.width)
    cropped = array[row_off : row_off + height, col_off : col_off + width]
    cropped_transform = window_transform(window, transform)
    return cropped, cropped_transform


def block_average_downsample(array: np.ndarray, out_shape: tuple[int, int]) -> np.ndarray:
    """用區塊平均把 array 降採樣到 out_shape（不整除時先裁到可整除的大小）。"""
    out_rows, out_cols = out_shape
    in_rows, in_cols = array.shape
    row_factor = in_rows // out_rows
    col_factor = in_cols // out_cols
    if row_factor < 1 or col_factor < 1:
        raise ValueError("目標解析度比來源還高，無法用區塊平均降採樣")

    trimmed = array[: out_rows * row_factor, : out_cols * col_factor]
    reshaped = trimmed.reshape(out_rows, row_factor, out_cols, col_factor)
    return reshaped.mean(axis=(1, 3))


def main() -> None:
    print("讀取並拼接 DEM 圖磚...")
    mosaic, transform, crs = mosaic_tiles()
    print(f"mosaic shape={mosaic.shape}, crs={crs}")

    print("裁切到台灣本島 bounding box...")
    cropped, cropped_transform = crop_to_bbox(mosaic, transform)
    print(f"cropped shape={cropped.shape}")

    print(f"降採樣到統計解析度 {STATS_SHAPE}...")
    stats_elev = block_average_downsample(cropped.astype(np.float64), STATS_SHAPE)

    # 陸地遮罩：高度 > 0 視為陸地，取面積最大的連通區塊 = 本島
    land_mask_all = stats_elev > 0
    labeled, n_features = ndimage.label(land_mask_all, structure=np.ones((3, 3)))
    if n_features == 0:
        raise SystemExit("找不到任何陸地像元，請確認 DEM 圖磚是否涵蓋台灣範圍")
    sizes = ndimage.sum(land_mask_all, labeled, range(1, n_features + 1))
    main_island_label = int(np.argmax(sizes)) + 1
    main_island_mask = labeled == main_island_label
    print(
        f"偵測到 {n_features} 個陸地區塊，本島（最大區塊）像元數="
        f"{int(sizes[main_island_label - 1])}"
    )

    # --- 面積-高程分佈統計（用統計解析度，本島遮罩內像元）---
    lat_min, lat_max = BBOX["lat_min"], BBOX["lat_max"]
    row_lats = np.linspace(lat_max, lat_min, STATS_SHAPE[0], endpoint=False)
    deg_lon = (BBOX["lon_max"] - BBOX["lon_min"]) / STATS_SHAPE[1]
    deg_lat = (BBOX["lat_max"] - BBOX["lat_min"]) / STATS_SHAPE[0]
    km_per_deg = 111.32
    pixel_area_km2_per_row = (deg_lon * km_per_deg * np.cos(np.radians(row_lats))) * (
        deg_lat * km_per_deg
    )
    pixel_area_grid = np.repeat(pixel_area_km2_per_row[:, None], STATS_SHAPE[1], axis=1)

    island_elev = stats_elev[main_island_mask]
    island_area = pixel_area_grid[main_island_mask]
    total_area_km2 = float(island_area.sum())

    bands = []
    for lo, hi in zip(ELEVATION_BANDS_M[:-1], ELEVATION_BANDS_M[1:]):
        in_band = (island_elev >= lo) & (island_elev < hi)
        band_area = float(island_area[in_band].sum())
        bands.append(
            {
                "min_m": lo,
                "max_m": None if hi == ELEVATION_BANDS_M[-1] else hi,
                "area_km2": round(band_area, 1),
                "pct_of_island": round(100 * band_area / total_area_km2, 2)
                if total_area_km2
                else 0,
            }
        )

    elevation_bands = {
        "unit": "meters / km2 / percent",
        "total_island_area_km2": round(total_area_km2, 1),
        "bands": bands,
    }

    # --- 顯示解析度網格（給 d3.contour）---
    print(f"降採樣到顯示解析度 {GRID_SHAPE}...")
    display_elev = block_average_downsample(stats_elev, GRID_SHAPE)
    display_mask = block_average_downsample(
        main_island_mask.astype(np.float64), GRID_SHAPE
    ) > 0.3  # 區塊內超過 30% 是本島陸地，才視為陸地格

    display_values = np.where(display_mask, display_elev, NODATA_SENTINEL)

    dem_grid = {
        "width": GRID_SHAPE[1],
        "height": GRID_SHAPE[0],
        "bbox": [BBOX["lon_min"], BBOX["lat_min"], BBOX["lon_max"], BBOX["lat_max"]],
        "nodata": NODATA_SENTINEL,
        "unit": "meters",
        "note": "row 0 = 最北緣 (lat_max)，往下緯度遞減；每格代表本島陸地平均海拔，海洋/離島為 nodata",
        "values": [round(float(v), 1) for v in display_values.flatten()],
    }

    summary = {
        "source": "Copernicus GLO-30 DEM (AWS Open Data, s3://copernicus-dem-30m)",
        "bbox": BBOX,
        "total_island_area_km2": round(total_area_km2, 1),
        "max_elevation_m": round(float(island_elev.max()), 1),
        "mean_elevation_m": round(float(island_elev.mean()), 1),
        "stats_grid_shape": list(STATS_SHAPE),
        "display_grid_shape": list(GRID_SHAPE),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "taiwan-dem-grid.json").write_text(
        json.dumps(dem_grid, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "elevation-bands.json").write_text(
        json.dumps(elevation_bands, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (OUT_DIR / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print("\n完成，輸出：")
    print(f"  {OUT_DIR / 'taiwan-dem-grid.json'}")
    print(f"  {OUT_DIR / 'elevation-bands.json'}")
    print(f"  {OUT_DIR / 'summary.json'}")
    print(f"\n本島面積約 {summary['total_island_area_km2']:.0f} km2，"
          f"最高點約 {summary['max_elevation_m']:.0f} m，"
          f"平均海拔約 {summary['mean_elevation_m']:.0f} m")


if __name__ == "__main__":
    main()
