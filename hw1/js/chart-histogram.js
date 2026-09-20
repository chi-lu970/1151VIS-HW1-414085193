// View 3：面積—高程分佈直方圖
// 技術：水平長條圖，呈現本島土地面積在各高程區間的佔比，長條顏色沿用與 View 1 相同的
//       分層設色，讓三張圖之間有一致的視覺語言。

elevationBandsPromise.then((data) => {
  const { bands, total_island_area_km2 } = data;

  const bandLabels = bands.map((b) =>
    b.max_m === null ? `${b.min_m}m 以上` : `${b.min_m}–${b.max_m}m`
  );

  const margin = { top: 10, right: 60, bottom: 40, left: 90 };
  const barHeight = 30;
  const width = 640;
  const height = margin.top + margin.bottom + bands.length * barHeight;
  const innerWidth = width - margin.left - margin.right;

  const svg = d3
    .select("#elevation-histogram")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .style("max-width", `${width}px`);

  const y = d3
    .scaleBand()
    .domain(bandLabels)
    .range([margin.top, height - margin.bottom])
    .padding(0.25);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(bands, (d) => d.pct_of_island) * 1.1])
    .range([0, innerWidth]);

  const chart = svg.append("g").attr("transform", `translate(${margin.left},0)`);

  // x 軸（百分比）
  chart
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}%`))
    .call((g) => g.select(".domain").remove());

  // y 軸（高程區間標籤）
  chart
    .append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => g.select(".domain").remove());

  // 長條
  chart
    .selectAll("rect.bar")
    .data(bands)
    .join("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", (d, i) => y(bandLabels[i]))
    .attr("width", (d) => x(d.pct_of_island))
    .attr("height", y.bandwidth())
    .attr("fill", (d, i) => HYPSOMETRIC_COLORS[i])
    .attr("stroke", "#00000022");

  // 數值標籤
  chart
    .selectAll("text.value")
    .data(bands)
    .join("text")
    .attr("class", "value")
    .attr("x", (d) => x(d.pct_of_island) + 6)
    .attr("y", (d, i) => y(bandLabels[i]) + y.bandwidth() / 2 + 4)
    .attr("font-size", 11)
    .text((d) => `${d.pct_of_island.toFixed(1)}%`);

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", height - 4)
    .attr("font-size", 10)
    .attr("fill", "#786f60")
    .text(`本島總面積約 ${Math.round(total_island_area_km2).toLocaleString()} km²（估算值）`);
});
