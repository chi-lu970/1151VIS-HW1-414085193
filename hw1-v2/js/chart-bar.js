// View 2：人口排名長條圖
// 樣式取材自 D3 Gallery 的 "Bar chart"（水平長條 + 直接標數值），
// 顏色沿用 View 1 的洲別色階，讓兩張圖可以互相對照。

dataPromise.then((data) => {
  const top15 = [...data].sort((a, b) => d3.descending(a.pop, b.pop)).slice(0, 15);

  const margin = { top: 10, right: 70, bottom: 30, left: 110 };
  const barHeight = 26;
  const width = 700;
  const height = margin.top + margin.bottom + top15.length * barHeight;
  const innerWidth = width - margin.left - margin.right;

  const svg = d3
    .select("#chart-bar")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .style("max-width", `${width}px`);

  const y = d3
    .scaleBand()
    .domain(top15.map((d) => d.country))
    .range([margin.top, height - margin.bottom])
    .padding(0.22);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(top15, (d) => d.pop)])
    .range([0, innerWidth]);

  const chart = svg.append("g").attr("transform", `translate(${margin.left},0)`);

  chart
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5, "~s"))
    .call((g) => g.select(".domain").remove());

  chart
    .append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => g.select(".domain").remove());

  chart
    .selectAll("rect")
    .data(top15)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d) => y(d.country))
    .attr("width", (d) => x(d.pop))
    .attr("height", y.bandwidth())
    .attr("fill", (d) => continentColor(d.continent));

  chart
    .selectAll("text.value")
    .data(top15)
    .join("text")
    .attr("class", "value")
    .attr("x", (d) => x(d.pop) + 6)
    .attr("y", (d) => y(d.country) + y.bandwidth() / 2 + 4)
    .text((d) => d3.format(".2s")(d.pop).replace("G", "B"));
});
