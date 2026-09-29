// View 1：分層設色地形圖（Hypsometric Tint Map）
// 技術：d3.contours() 依高程門檻由低到高逐層畫填色多邊形，後畫的（較高海拔）自然疊在先畫的上面，
//       形成分層設色效果；海洋／離島格為 nodata（< 0），天然被排除在所有 contour(>=0) 之外，
//       不需另外裁切海岸線。

demGridPromise.then((grid) => {
  const { width, height, bbox, values } = grid;

  const cellPx = 2.2; // 每個網格格子的原始像素大小
  const { path, cosLat, displayWidth, displayHeight } = createGridProjection(grid, cellPx);

  const legendWidth = 170;
  const margin = { top: 28, right: 20, bottom: 10, left: 10 };
  const svgWidth = margin.left + displayWidth + legendWidth + margin.right;
  const svgHeight = margin.top + displayHeight + margin.bottom;

  const svg = d3
    .select("#hypsometric-map")
    .append("svg")
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("width", "100%")
    .style("max-width", `${svgWidth}px`);

  const mapGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top}) scale(${cosLat},1)`);

  const contourGenerator = d3
    .contours()
    .size([width, height])
    .thresholds(ELEVATION_THRESHOLDS);

  const bands = contourGenerator(values);

  mapGroup
    .append("g")
    .attr("class", "hypsometric-bands")
    .selectAll("path")
    .data(bands)
    .join("path")
    .attr("d", path)
    .attr("fill", (d, i) => HYPSOMETRIC_COLORS[i])
    .attr("stroke", "none");

  // 本島外框：用最低門檻(0)的等值線畫一圈邊界，強化海岸線輪廓
  mapGroup
    .append("path")
    .datum(bands[0])
    .attr("class", "map-outline")
    .attr("d", path);

  // --- 圖例 ---
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + displayWidth + 24}, ${margin.top + 10})`);

  const legendLabels = [
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

  const swatch = 16;
  const rowGap = 22;

  const rows = legend
    .selectAll("g")
    .data(HYPSOMETRIC_COLORS)
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * rowGap})`);

  rows
    .append("rect")
    .attr("width", swatch)
    .attr("height", swatch)
    .attr("fill", (d) => d)
    .attr("stroke", "#00000022");

  rows
    .append("text")
    .attr("x", swatch + 8)
    .attr("y", swatch - 4)
    .text((d, i) => legendLabels[i]);

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -12)
    .attr("font-weight", "600")
    .text("海拔高度");
});
