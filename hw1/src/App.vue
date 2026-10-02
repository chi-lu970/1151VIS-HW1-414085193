<script setup>
import GuidePanel from "./components/GuidePanel.vue";
import HypsometricMap from "./components/HypsometricMap.vue";
import ElevationHistogram from "./components/ElevationHistogram.vue";
</script>

<template>
  <div class="spectrum-bar" aria-hidden="true"></div>

  <header>
    <p class="eyebrow">資料分析與視覺化 · 作業一</p>
    <h1>台灣本島地形高度分佈</h1>
    <p class="subtitle">兩種圖表，從空間分布與統計分布兩個角度，讀懂台灣的地形</p>
    <p class="intro">
      資料來源：Copernicus GLO-30 DEM（30m 解析度，AWS Open Data）。
      呈現範圍為台灣本島，不含澎湖、金門、馬祖等離島。
    </p>
  </header>

  <main>
    <GuidePanel />

    <section id="view-map" class="panel">
      <p class="eyebrow">View 01 · 空間分布</p>
      <h2>分層設色地形圖</h2>
      <p class="panel-desc">依海拔高度分層上色，一眼辨識平原、丘陵與高山的空間分布。</p>
      <HypsometricMap />
    </section>

    <section id="view-histogram" class="panel">
      <p class="eyebrow">View 02 · 統計分布</p>
      <h2>面積—高程分佈直方圖</h2>
      <p class="panel-desc">台灣本島土地面積在各高程區間的佔比，長條顏色與上方地形圖一致。</p>
      <ElevationHistogram />
    </section>
  </main>

  <footer>
    <p>
      資料來源：Copernicus GLO-30 DEM（AWS Open Data Registry, s3://copernicus-dem-30m）。
      本島邊界由高程資料以連通元件分析推導，非官方測繪邊界，僅供教學視覺化使用。
    </p>
  </footer>
</template>
