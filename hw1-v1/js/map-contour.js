// View 2：等高線圖（Contour Line Map）
// 技術：d3.contour 純線稿（不填色），每 500m 一條等高線，並標註幾座知名高峰位置，
//       呈現台灣中央山脈、雪山山脈等山系的稜線結構。

// 幾座代表性高峰（經緯度為概略座標，供標註示意用，非精測座標）。
// dx/dy/anchor 是手動調整過的標籤偏移量，避免彼此距離很近的山峰文字互相重疊。
const NAMED_PEAKS = [
  { name: "玉山 3952m", lon: 120.957, lat: 23.47, dx: -8, dy: 3, anchor: "end" },
  { name: "雪山 3886m", lon: 121.223, lat: 24.383, dx: 0, dy: -8, anchor: "middle" },
  { name: "南湖大山 3742m", lon: 121.437, lat: 24.353, dx: 8, dy: 3, anchor: "start" },
  { name: "秀姑巒山 3825m", lon: 121.114, lat: 23.5, dx: 0, dy: 16, anchor: "middle" },
  { name: "合歡山 3417m", lon: 121.279, lat: 24.142, dx: -8, dy: 16, anchor: "end" },
];

demGridPromise.then((grid) => {
  const { width, height, values } = grid;

  const cellPx = 2.2;
  const { path, cosLat, displayWidth, displayHeight } = createGridProjection(grid, cellPx);

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const svgWidth = margin.left + displayWidth + margin.right;
  const svgHeight = margin.top + displayHeight + margin.bottom;

  const svg = d3
    .select("#contour-map")
    .append("svg")
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("width", "100%")
    .style("max-width", `${svgWidth}px`);

  const mapGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top}) scale(${cosLat},1)`);

  // 本島輪廓（0m 等高線）當作底圖參考
  const outlineGenerator = d3.contours().size([width, height]).thresholds([0]);
  mapGroup
    .append("path")
    .datum(outlineGenerator(values)[0])
    .attr("class", "map-outline")
    .attr("d", path)
    .attr("fill", "#f0ede6");

  // 每 500m 一條等高線，越高海拔線條越粗越深，強調山脈稜線層次
  const contourThresholds = [500, 1000, 1500, 2000, 2500, 3000, 3500];
  const contourGenerator = d3.contours().size([width, height]).thresholds(contourThresholds);
  const lines = contourGenerator(values);

  // 等高線改用藍灰色調，跟高峰標註的暖色系文字/圓點拉開對比，避免混在一起看不清楚
  mapGroup
    .append("g")
    .attr("class", "contour-lines")
    .selectAll("path")
    .data(lines)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", (d, i) => d3.interpolateBlues(0.35 + (i / contourThresholds.length) * 0.55))
    .attr("stroke-width", (d, i) => (contourThresholds[i] % 1000 === 0 ? 1.4 : 0.7));

  // 高峰標註（用 cosLat 反算回文字未被壓扁的位置，因為文字在同一個被 scale 的群組內會跟著變形）
  const peakGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  NAMED_PEAKS.forEach((peak) => {
    const [gx, gy] = lonLatToGridPixel(grid, cellPx, peak.lon, peak.lat);
    const x = gx * cosLat; // 手動套用跟地圖群組一樣的水平縮放，因為這個群組本身沒有 scale
    const y = gy;
    const labelX = x + peak.dx;
    const labelY = y + peak.dy;

    peakGroup
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 2.5)
      .attr("fill", "#c1440e")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8);

    // 標籤位置偏離圓點時，加一條細引線幫助對應
    if (Math.hypot(labelX - x, labelY - y) > 4) {
      peakGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", y)
        .attr("x2", labelX)
        .attr("y2", labelY)
        .attr("stroke", "#c1440e")
        .attr("stroke-width", 0.6);
    }

    // 白色描邊（halo）讓深色文字在任何背景線條上都清楚可讀
    peakGroup
      .append("text")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", peak.anchor)
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("paint-order", "stroke")
      .attr("stroke", "#faf7f2")
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("fill", "#3a2418")
      .text(peak.name);
  });
});
