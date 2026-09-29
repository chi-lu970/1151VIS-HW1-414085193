// 共用設定：資料載入與跨圖共用的比例尺，讓三張圖的色彩語言一致。
// 資料來源：Gapminder Foundation 2007 年橫斷面資料（經 plotly/datasets 整理提供的公開鏡像）。

const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

// 配色沿用 Observable/D3 Gallery 常見的 Tableau10 類別色，非本作業自訂色階。
const continentColor = d3.scaleOrdinal().domain(CONTINENTS).range(d3.schemeTableau10);

const dataPromise = d3.csv("data/gapminder-2007.csv", d3.autoType);

function formatPop(n) {
  return d3.format(",.0f")(n);
}
