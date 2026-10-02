# HW1：台灣本島地形高度分佈

資料分析與視覺化課程作業一。用 **Vue 3**（Composition API + `<script setup>`）搭配 D3.js v7（負責比例尺與路徑計算，SVG 由 Vue 模板渲染）做的視覺化，從空間分布與統計分布兩個互補角度呈現台灣本島（不含澎湖、金門、馬祖）的地形高度。

完整設計決策與實作紀錄見 [`PLAN.md`](PLAN.md)。

## 預覽

```
cd hw1-v1
npm install
npm run dev      # 開發模式 http://localhost:5173/
npm run build    # 產出 dist/（相對路徑，可直接部署到靜態空間）
```

## 專案結構

```
src/
  main.js, App.vue            # 入口
  constants.js                # 高程門檻、色階、圖例文字（兩圖共用）
  composables/useJson.js      # 資料載入（loading / error 狀態、請求快取）
  components/
    GuidePanel.vue
    HypsometricMap.vue        # View 1
    ElevationHistogram.vue    # View 2
public/data/                  # 前處理產出的 JSON
scripts/                      # Python 前處理（輸出到 public/data/）
```

## 內容

- **View 1 分層設色地形圖**：`d3.contours()` 疊出綠→黃→棕→橘的填色帶，呈現整體地形空間分布
- **View 2 面積—高程分佈直方圖**：各高程區間佔本島總面積的百分比，顏色與 View 1 對應

## 資料來源

Copernicus GLO-30 DEM（30m 解析度），AWS Open Data Registry `s3://copernicus-dem-30m`（免金鑰）。本島邊界由 DEM 高程資料自身推導（陸地遮罩 + 連通元件分析取最大陸塊），未使用外部邊界檔。前處理腳本見 `scripts/`，產出資料見 `public/data/`。
