<script setup>
// View 1：分層設色地形圖
// d3.contours() 依高程門檻由低到高產生填色多邊形，後畫的（較高海拔）疊在先畫的上面；
// 海洋／離島格為 nodata（< 0），天然被排除在所有 contour(>=0) 之外。
import { computed } from "vue";
import { contours, geoPath, geoTransform } from "d3";
import { useJson } from "../composables/useJson";
import { ELEVATION_THRESHOLDS, HYPSOMETRIC_COLORS, BAND_LABELS } from "../constants";

const { data: grid, loading, error } = useJson("data/taiwan-dem-grid.json");

const cellPx = 2.2;
const legendWidth = 170;
const margin = { top: 28, right: 20, bottom: 10, left: 10 };

// 緯度方向實際公里數較經度方向長，用 cos(平均緯度) 修正經度方向，避免地圖被拉寬。
const layout = computed(() => {
  if (!grid.value) return null;
  const { width, height, bbox } = grid.value;
  const cosLat = Math.cos((((bbox[1] + bbox[3]) / 2) * Math.PI) / 180);
  const displayWidth = width * cellPx * cosLat;
  const displayHeight = height * cellPx;
  return {
    cosLat,
    displayWidth,
    svgWidth: margin.left + displayWidth + legendWidth + margin.right,
    svgHeight: margin.top + displayHeight + margin.bottom,
  };
});

// 等值線只依資料計算一次
const bandPaths = computed(() => {
  if (!grid.value) return [];
  const { width, height, values } = grid.value;
  const path = geoPath(
    geoTransform({
      point(x, y) {
        this.stream.point(x * cellPx, y * cellPx);
      },
    })
  );
  return contours()
    .size([width, height])
    .thresholds(ELEVATION_THRESHOLDS)(values)
    .map((b, i) => ({ d: path(b), fill: HYPSOMETRIC_COLORS[i], index: i }));
});

const outlinePath = computed(() => bandPaths.value[0]?.d ?? "");
</script>

<template>
  <div id="hypsometric-map">
    <p v-if="loading" class="status">資料載入中…</p>
    <p v-else-if="error" class="status error">載入失敗：{{ error.message }}</p>
    <svg
      v-else
      :viewBox="`0 0 ${layout.svgWidth} ${layout.svgHeight}`"
      width="100%"
      :style="{ maxWidth: layout.svgWidth + 'px' }"
    >
      <g :transform="`translate(${margin.left},${margin.top}) scale(${layout.cosLat},1)`">
        <g class="hypsometric-bands">
          <path
            v-for="b in bandPaths"
            :key="b.index"
            :d="b.d"
            :fill="b.fill"
          />
        </g>
        <path class="map-outline" :d="outlinePath" />
      </g>

      <g
        class="legend"
        :transform="`translate(${margin.left + layout.displayWidth + 24}, ${margin.top + 10})`"
      >
        <text x="0" y="-12" font-weight="600">海拔高度</text>
        <g
          v-for="(color, i) in HYPSOMETRIC_COLORS"
          :key="i"
          class="legend-row"
          :transform="`translate(0, ${i * 22})`"
        >
          <rect width="16" height="16" :fill="color" stroke="#00000022" />
          <text x="24" y="12">{{ BAND_LABELS[i] }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>
