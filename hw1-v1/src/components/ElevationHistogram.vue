<script setup>
// View 2：面積—高程分佈直方圖（水平長條圖）
// 長條顏色沿用與 View 1 相同的分層設色。
import { computed } from "vue";
import { max, scaleBand, scaleLinear } from "d3";
import { useJson } from "../composables/useJson";
import { HYPSOMETRIC_COLORS, BAND_LABELS } from "../constants";

const { data, loading, error } = useJson("data/elevation-bands.json");

const margin = { top: 10, right: 60, bottom: 40, left: 90 };
const barHeight = 30;
const width = 640;
const innerWidth = width - margin.left - margin.right;

const bands = computed(() => data.value?.bands ?? []);
const height = computed(() => margin.top + margin.bottom + bands.value.length * barHeight);

const y = computed(() =>
  scaleBand()
    .domain(bands.value.map((_, i) => i))
    .range([margin.top, height.value - margin.bottom])
    .padding(0.25)
);

const x = computed(() =>
  scaleLinear()
    .domain([0, (max(bands.value, (d) => d.pct_of_island) ?? 1) * 1.1])
    .range([0, innerWidth])
);

const xTicks = computed(() => x.value.ticks(5));
</script>

<template>
  <div id="elevation-histogram">
    <p v-if="loading" class="status">資料載入中…</p>
    <p v-else-if="error" class="status error">載入失敗：{{ error.message }}</p>
    <svg v-else :viewBox="`0 0 ${width} ${height}`" width="100%" :style="{ maxWidth: width + 'px' }">
      <g :transform="`translate(${margin.left},0)`">
        <!-- x 軸（百分比） -->
        <g class="axis" :transform="`translate(0,${height - margin.bottom})`" text-anchor="middle">
          <g v-for="t in xTicks" :key="t" :transform="`translate(${x(t)},0)`">
            <line y2="6" stroke="currentColor" />
            <text y="9" dy="0.71em" fill="currentColor">{{ t }}%</text>
          </g>
        </g>

        <!-- 長條、y 軸標籤、數值標籤 -->
        <g
          v-for="(b, i) in bands"
          :key="i"
          class="bar-row"
        >
          <text class="y-label" x="-9" :y="y(i) + y.bandwidth() / 2" dy="0.32em" text-anchor="end">
            {{ b.max_m === null ? `${b.min_m}m 以上` : `${b.min_m}–${b.max_m}m` }}
          </text>
          <rect
            class="bar"
            x="0"
            :y="y(i)"
            :width="x(b.pct_of_island)"
            :height="y.bandwidth()"
            :fill="HYPSOMETRIC_COLORS[i]"
            stroke="#00000022"
          />
          <text class="value" :x="x(b.pct_of_island) + 6" :y="y(i) + y.bandwidth() / 2 + 4" font-size="11">
            {{ b.pct_of_island.toFixed(1) }}%
          </text>
        </g>
      </g>

      <text :x="margin.left" :y="height - 4" font-size="10" fill="#786f60">
        本島總面積約 {{ Math.round(data.total_island_area_km2).toLocaleString() }} km²（估算值）
      </text>
    </svg>
  </div>
</template>
