// View 1：泡泡圖（所得 vs. 壽命 vs. 人口）
// 樣式取材自 Observable / D3 Gallery 經典的 "Bubble chart" / Gapminder scatter 範例：
// x 用 log scale、半徑用 sqrt scale、色彩用類別色、滑過顯示 tooltip。

dataPromise.then((data) => {
  const width = 760;
  const height = 520;
  const margin = { top: 20, right: 20, bottom: 46, left: 56 };

  const svg = d3
    .select("#chart-bubble")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .style("max-width", `${width}px`);

  const x = d3
    .scaleLog()
    .domain(d3.extent(data, (d) => d.gdpPercap))
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.lifeExp)).nice()
    .range([height - margin.bottom, margin.top]);

  const r = d3
    .scaleSqrt()
    .domain([0, d3.max(data, (d) => d.pop)])
    .range([2, 38]);

  // 格線（Observable gallery 常見的淡色橫向格線，幫助讀出 y 軸數值）
  svg
    .append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(y.ticks(6))
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5, "~s"))
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6))
    .call((g) => g.select(".domain").remove());

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width - margin.right)
    .attr("y", height - margin.bottom + 36)
    .attr("text-anchor", "end")
    .text("人均 GDP（美元，log 刻度）→");

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", -margin.top)
    .attr("y", 16)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text("預期壽命（歲）→");

  const tooltip = d3.select("#chart-bubble").append("div").attr("class", "tooltip").style("opacity", 0);

  // 依人口數由大到小畫，讓大泡泡在下層、小泡泡不被壓住看不見
  const sorted = [...data].sort((a, b) => d3.descending(a.pop, b.pop));

  svg
    .append("g")
    .selectAll("circle")
    .data(sorted)
    .join("circle")
    .attr("cx", (d) => x(d.gdpPercap))
    .attr("cy", (d) => y(d.lifeExp))
    .attr("r", (d) => r(d.pop))
    .attr("fill", (d) => continentColor(d.continent))
    .attr("fill-opacity", 0.75)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.6)
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", `${event.offsetX + 14}px`)
        .style("top", `${event.offsetY + 8}px`)
        .html(
          `<strong>${d.country}</strong><br/>人均 GDP：$${d3.format(",.0f")(d.gdpPercap)}<br/>` +
            `預期壽命：${d.lifeExp.toFixed(1)} 歲<br/>人口：${formatPop(d.pop)}`
        );
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // 標出人口前三大國，呼應「泡泡大小＝人口」的編碼
  const topThree = sorted.slice(0, 3);
  svg
    .append("g")
    .selectAll("text")
    .data(topThree)
    .join("text")
    .attr("class", "bubble-label")
    .attr("x", (d) => x(d.gdpPercap))
    .attr("y", (d) => y(d.lifeExp) + 4)
    .attr("text-anchor", "middle")
    .text((d) => d.country);

  // 圖例
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const legendItems = legend
    .selectAll("g")
    .data(CONTINENTS)
    .join("g")
    .attr("transform", (d, i) => `translate(${i * 92}, 0)`);

  legendItems
    .append("circle")
    .attr("r", 5)
    .attr("fill", (d) => continentColor(d));

  legendItems
    .append("text")
    .attr("x", 10)
    .attr("y", 4)
    .text((d) => d);
});
