"""
下載覆蓋台灣本島的 Copernicus GLO-30 DEM（30m 解析度）圖磚。

資料來源：AWS Open Data Registry, s3://copernicus-dem-30m（公開、免金鑰）
https://registry.opendata.aws/copernicus-dem/

圖磚命名規則（1x1 度網格）：
  Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM
其中 10 代表 GLO-30（30m）解析度版本。此規則已於本機以 HTTP HEAD 實測確認可用。

輸出：hw1/data/raw/*.tif（原始 GeoTIFF，不進 git，體積較大）
"""

from __future__ import annotations

import sys
from pathlib import Path

import requests

BASE_URL = "https://copernicus-dem-30m.s3.amazonaws.com"

# 涵蓋台灣本島（不含離島）的 1 度圖磚範圍。
# 緯度 21-25 涵蓋鵝鑾鼻(~21.9N) 到富貴角(~25.3N)；
# 經度 120-122 涵蓋西部海岸(~120.03E) 到宜蘭外海(~122.0E)。
LAT_TILES = range(21, 26)  # N21..N25
LON_TILES = range(120, 123)  # E120..E122

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"


def tile_name(lat: int, lon: int) -> str:
    return f"Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM"


def tile_url(lat: int, lon: int) -> str:
    name = tile_name(lat, lon)
    return f"{BASE_URL}/{name}/{name}.tif"


def download_tile(lat: int, lon: int, dest_dir: Path) -> bool:
    url = tile_url(lat, lon)
    dest = dest_dir / f"{tile_name(lat, lon)}.tif"
    if dest.exists():
        print(f"skip (already downloaded): {dest.name}")
        return True

    resp = requests.get(url, stream=True, timeout=60)
    if resp.status_code == 404:
        print(f"no tile (likely open ocean, expected): N{lat:02d} E{lon:03d}")
        return False
    resp.raise_for_status()

    dest_dir.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".tif.part")
    with open(tmp, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1 << 20):
            f.write(chunk)
    tmp.rename(dest)
    print(f"downloaded: {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")
    return True


def main() -> None:
    ok = 0
    for lat in LAT_TILES:
        for lon in LON_TILES:
            if download_tile(lat, lon, RAW_DIR):
                ok += 1
    print(f"\n完成，共取得 {ok} 張圖磚，存放於 {RAW_DIR}")
    if ok == 0:
        print("錯誤：一張圖磚都沒下載到，請檢查網路連線或圖磚命名規則是否仍然有效。", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
