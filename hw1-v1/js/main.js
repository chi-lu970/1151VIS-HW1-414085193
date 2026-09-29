// 共用設定：三個視圖都會用到的高程分層門檻與色階，確保視覺一致。
const ELEVATION_THRESHOLDS = [0, 100, 500, 1000, 1500, 2000, 2500, 3000, 3500];

// 傳統分層設色地形圖配色：低地綠 → 丘陵黃棕 → 高山白
const HYPSOMETRIC_COLORS = [
  "#a9d0a0", // 0-100m
  "#c6dd8f", // 100-500m
  "#e3d989", // 500-1000m
  "#e9c178", // 1000-1500m
  "#dba667", // 1500-2000m
  "#c68657", // 2000-2500m
  "#a8694a", // 2500-3000m
  "#8a5240", // 3000-3500m
  "#f2efe9"  // 3500m+
];

const hypsometricColor = d3.scaleThreshold()
  .domain(ELEVATION_THRESHOLDS.slice(1)) // scaleThreshold 的 domain 是分界點，不含最小值
  .range(HYPSOMETRIC_COLORS);

// 各模組共用的資料載入 Promise，避免重複 fetch
const demGridPromise = d3.json("data/taiwan-dem-grid.json");
const elevationBandsPromise = d3.json("data/elevation-bands.json");

// 共用的「網格座標 → 像素座標」投影設定，讓 View 1、View 2 的比例與尺寸完全一致。
// 網格每一格在經度/緯度上跨度相同，但緯度方向的實際公里數較經度方向長，
// 用 cos(平均緯度) 修正經度方向的視覺壓縮比例，避免地圖被拉寬變形。
function createGridProjection(grid, cellPx) {
  const { width, height, bbox } = grid;
  const latAvg = (bbox[1] + bbox[3]) / 2;
  const cosLat = Math.cos((latAvg * Math.PI) / 180);

  const rawWidth = width * cellPx;
  const rawHeight = height * cellPx;

  const projection = d3.geoTransform({
    point(x, y) {
      this.stream.point(x * cellPx, y * cellPx);
    },
  });

  return {
    path: d3.geoPath(projection),
    cosLat,
    rawWidth,
    rawHeight,
    displayWidth: rawWidth * cosLat,
    displayHeight: rawHeight,
  };
}

// 把地理座標 (lon, lat) 轉成與 createGridProjection 的 path 相同座標系下的 [x, y]（尚未套用 cosLat 縮放，
// 因為該縮放是套用在整個 <g> 上，個別標記點只要落在同一個「群組內像素座標」即可）。
function lonLatToGridPixel(grid, cellPx, lon, lat) {
  const { width, height, bbox } = grid;
  const lonSpan = bbox[2] - bbox[0];
  const latSpan = bbox[3] - bbox[1];
  const col = ((lon - bbox[0]) / lonSpan) * width;
  const row = ((bbox[3] - lat) / latSpan) * height;
  return [col * cellPx, row * cellPx];
}

// 用雙線性內插取得任意經緯度的高程值（View 4 剖面圖沿線取樣用）。
// nodata（海洋／離島）格點回傳 null，讓呼叫端自行決定要顯示 0 還是中斷線段。
function sampleElevation(grid, lon, lat) {
  const { width, height, bbox, nodata, values } = grid;
  const lonSpan = bbox[2] - bbox[0];
  const latSpan = bbox[3] - bbox[1];
  const colF = ((lon - bbox[0]) / lonSpan) * width - 0.5;
  const rowF = ((bbox[3] - lat) / latSpan) * height - 0.5;

  const c0 = Math.floor(colF);
  const r0 = Math.floor(rowF);
  const tx = colF - c0;
  const ty = rowF - r0;

  const at = (r, c) => {
    const rr = Math.min(Math.max(r, 0), height - 1);
    const cc = Math.min(Math.max(c, 0), width - 1);
    const v = values[rr * width + cc];
    return v === nodata ? null : v;
  };

  const v00 = at(r0, c0);
  const v10 = at(r0, c0 + 1);
  const v01 = at(r0 + 1, c0);
  const v11 = at(r0 + 1, c0 + 1);

  if (v00 === null || v10 === null || v01 === null || v11 === null) return null;

  const top = v00 * (1 - tx) + v10 * tx;
  const bottom = v01 * (1 - tx) + v11 * tx;
  return top * (1 - ty) + bottom * ty;
}
