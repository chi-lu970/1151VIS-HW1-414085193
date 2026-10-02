// 共用設定：兩個視圖都會用到的高程分層門檻與色階，確保視覺一致。
import { scaleThreshold } from "d3";

export const ELEVATION_THRESHOLDS = [0, 100, 500, 1000, 1500, 2000, 2500, 3000, 3500];

// 傳統分層設色地形圖配色：低地綠 → 丘陵黃棕 → 高山白
export const HYPSOMETRIC_COLORS = [
  "#a9d0a0", // 0-100m
  "#c6dd8f", // 100-500m
  "#e3d989", // 500-1000m
  "#e9c178", // 1000-1500m
  "#dba667", // 1500-2000m
  "#c68657", // 2000-2500m
  "#a8694a", // 2500-3000m
  "#8a5240", // 3000-3500m
  "#ff7a00", // 3500m+
];

export const BAND_LABELS = [
  "0–100 m",
  "100–500 m",
  "500–1000 m",
  "1000–1500 m",
  "1500–2000 m",
  "2000–2500 m",
  "2500–3000 m",
  "3000–3500 m",
  "3500 m+",
];

export const hypsometricColor = scaleThreshold()
  .domain(ELEVATION_THRESHOLDS.slice(1))
  .range(HYPSOMETRIC_COLORS);
