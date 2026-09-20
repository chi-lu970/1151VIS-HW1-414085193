// View 4（選配）：剖面圖 Elevation Profile
// 技術：沿固定緯度（通過玉山的東西向剖線）在 DEM 網格上用雙線性內插取樣，
//       畫出「距離 vs. 海拔」的剖面，提供俯視地圖以外「人的尺度」視角。
// 海洋／離島的取樣點（nodata）視為海平面（0m），讓剖面自然呈現「海岸線 → 爬升 → 海岸線」的完整橫切輪廓。

const PROFILE_LAT = 23.47; // 通過玉山的緯度，見 map-contour.js 的 NAMED_PEAKS
const PROFILE_LON_RANGE = [119.85, 121.95]; // 略超出陸地範圍，兩端自然收斂到海平面
const PROFILE_SAMPLES = 400;

demGridPromise.then((grid) => {
  const cosLat = Math.cos((PROFILE_LAT * Math.PI) / 180);
  const kmPerDegLon = 111.32 * cosLat;

  const points = d3.range(PROFILE_SAMPLES + 1).map((i) => {
    const t = i / PROFILE_SAMPLES;
    const lon = PROFILE_LON_RANGE[0] + t * (PROFILE_LON_RANGE[1] - PROFILE_LON_RANGE[0]);
    const raw = sampleElevation(grid, lon, PROFILE_LAT);
    const elevation = raw === null ? 0 : Math.max(raw, 0);
    const distanceKm = (lon - PROFILE_LON_RANGE[0]) * kmPerDegLon;
    return { lon, distanceKm, elevation };
  });

  const maxPoint = points.reduce((a, b) => (b.elevation > a.elevation ? b : a));

  const margin = { top: 24, right: 30, bottom: 40, left: 55 };
  const width = 760;
  const height = 220;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select("#elevation-profile")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .style("max-width", `${width}px`);

  const x = d3
    .scaleLinear()
    .domain([0, points[points.length - 1].distanceKm])
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain([0, maxPoint.elevation * 1.15])
    .range([innerHeight, 0]);

  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // 垂直漸層：沿用 View 1 的分層設色順序，讓剖面圖跟俯視地圖用同一套色彩語言
  const gradientId = "profile-elevation-gradient";
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0")
    .attr("x2", "0")
    .attr("y1", "0")
    .attr("y2", "1");

  const yDomainMax = y.domain()[1];
  ELEVATION_THRESHOLDS.forEach((threshold, i) => {
    gradient
      .append("stop")
      .attr("offset", `${Math.min((threshold / yDomainMax) * 100, 100)}%`)
      .attr("stop-color", HYPSOMETRIC_COLORS[i]);
  });
  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", HYPSOMETRIC_COLORS[HYPSOMETRIC_COLORS.length - 1]);

  const area = d3
    .area()
    .x((d) => x(d.distanceKm))
    .y0(y(0))
    .y1((d) => y(d.elevation));

  const line = d3
    .line()
    .x((d) => x(d.distanceKm))
    .y((d) => y(d.elevation));

  // y 軸（海拔）
  chart
    .append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}m`))
    .call((g) => g.select(".domain").remove());

  // x 軸（距離）
  chart
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}km`))
    .call((g) => g.select(".domain").remove());

  chart.append("path").datum(points).attr("class", "profile-area").attr("d", area).attr("fill", `url(#${gradientId})`);

  chart.append("path").datum(points).attr("class", "profile-line").attr("d", line).attr("fill", "none");

  // 最高點標註
  chart
    .append("circle")
    .attr("cx", x(maxPoint.distanceKm))
    .attr("cy", y(maxPoint.elevation))
    .attr("r", 3)
    .attr("fill", "#c1440e")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  chart
    .append("text")
    .attr("x", x(maxPoint.distanceKm))
    .attr("y", y(maxPoint.elevation) - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("font-weight", 600)
    .attr("paint-order", "stroke")
    .attr("stroke", "#faf7f2")
    .attr("stroke-width", 3)
    .attr("fill", "#3a2418")
    .text(`剖線最高點 約 ${Math.round(maxPoint.elevation)}m（玉山一帶）`);

  // 西／東岸標籤
  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", height - 6)
    .attr("font-size", 10)
    .attr("fill", "#786f60")
    .text("西岸");

  svg
    .append("text")
    .attr("x", width - margin.right)
    .attr("y", height - 6)
    .attr("text-anchor", "end")
    .attr("font-size", 10)
    .attr("fill", "#786f60")
    .text("東岸");
});
