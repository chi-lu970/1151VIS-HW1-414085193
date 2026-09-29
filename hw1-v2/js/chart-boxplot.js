// View 3：各洲預期壽命分布盒鬚圖
// 樣式取材自 D3 Gallery 的 "Boxplot"（盒鬚圖 + 疊加原始資料點做 jitter），
// 用來看「同樣是一個大陸，國與國之間的預期壽命差異有多大」。

dataPromise.then((data) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 700;
  const height = 420;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-boxplot")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .style("max-width", `${width}px`);

  const x = d3
    .scaleBand()
    .domain(CONTINENTS)
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const y = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.lifeExp) - 3, d3.max(data, (d) => d.lifeExp) + 3])
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}歲`))
    .call((g) => g.select(".domain").remove());

  const stats = CONTINENTS.map((continent) => {
    const values = data.filter((d) => d.continent === continent).map((d) => d.lifeExp).sort(d3.ascending);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    return { continent, q1, median, q3, min: values[0], max: values[values.length - 1], values };
  });

  const box = svg.append("g");

  // 鬚（min–max 範圍）
  box
    .selectAll("line.whisker")
    .data(stats)
    .join("line")
    .attr("class", "whisker")
    .attr("x1", (d) => x(d.continent) + x.bandwidth() / 2)
    .attr("x2", (d) => x(d.continent) + x.bandwidth() / 2)
    .attr("y1", (d) => y(d.min))
    .attr("y2", (d) => y(d.max));

  // 盒（Q1–Q3）
  box
    .selectAll("rect.box")
    .data(stats)
    .join("rect")
    .attr("class", "box")
    .attr("x", (d) => x(d.continent))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d.q3))
    .attr("height", (d) => y(d.q1) - y(d.q3))
    .attr("fill", (d) => continentColor(d.continent))
    .attr("fill-opacity", 0.25)
    .attr("stroke", (d) => continentColor(d.continent));

  // 中位數線
  box
    .selectAll("line.median")
    .data(stats)
    .join("line")
    .attr("class", "median")
    .attr("x1", (d) => x(d.continent))
    .attr("x2", (d) => x(d.continent) + x.bandwidth())
    .attr("y1", (d) => y(d.median))
    .attr("y2", (d) => y(d.median))
    .attr("stroke", (d) => continentColor(d.continent))
    .attr("stroke-width", 2);

  // 原始國家資料點（jitter），讓讀者看到盒鬚圖背後真正的每一個國家
  box
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.continent) + x.bandwidth() / 2 + (Math.random() - 0.5) * x.bandwidth() * 0.6)
    .attr("cy", (d) => y(d.lifeExp))
    .attr("r", 2.4)
    .attr("fill", (d) => continentColor(d.continent))
    .attr("fill-opacity", 0.45);
});
