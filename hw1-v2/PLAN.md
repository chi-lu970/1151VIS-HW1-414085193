# HW1-v2 規劃紀錄：全球發展指標（Gapminder 2007）

> 這份文件記錄 hw1-v2 的設計決策與技術細節，方便日後回頭查。跟 `hw1/PLAN.md` 是同樣性質的文件，
> 但 hw1-v2 主題與呈現方式都刻意簡化，所以這份也相對簡短。

## 1. 作業定位

- 跟 `hw1/` 是**完全獨立**的專案：獨立的 `index.html`、獨立的資料、獨立的 port（hw1 用 8000，
  hw1-v2 用 8001），但共用同一個 git repo（`data-viz`），不是獨立的 git repo
- 目標：換一個資料主題、換一種視覺風格，練習套用 [Observable D3 Gallery](https://observablehq.com/@d3/gallery)
  常見的圖表樣式（Bubble chart / Bar chart / Boxplot），跟 hw1 的地形視覺化做對比
- 刻意選一份**不需要額外前處理**的公開資料（hw1 需要 Python 寫 DEM 降採樣/連通元件分析，
  hw1-v2 只是一份現成的 CSV），讓重點放在「D3 怎麼畫圖」而不是「資料怎麼清理」

## 2. 資料

- **來源**：Gapminder Foundation 的經典教學資料集，透過 [plotly/datasets](https://github.com/plotly/datasets/blob/master/gapminderDataFiveYear.csv)
  整理提供的公開鏡像（每 5 年一筆，1952–2007，142 個國家/地區）
- **取用範圍**：只取 **2007 年**（資料集裡最新的一年）橫斷面資料，欄位為
  `country, year, pop, continent, lifeExp, gdpPercap`
- **前處理**：只有一行 shell 指令，用 `awk -F',' 'NR==1 || $2==2007'` 篩出 2007 年那 136 筆，
  存成 `data/gapminder-2007.csv`，直接進 repo；沒有 Python pipeline、沒有 `.venv`
- 瀏覽器端用 `d3.csv("data/gapminder-2007.csv", d3.autoType)` 讀取，`d3.autoType` 自動把
  `pop`/`lifeExp`/`gdpPercap`/`year` 轉成數字，不用手動 parse

## 3. 三張圖的設計邏輯

跟 hw1「一圖一問」的邏輯一樣，三張圖分別回答「關係」「排名」「分布」三種不同性質的問題，
共用同一套洲別配色（`continentColor`，定義在 `main.js`，`d3.scaleOrdinal` + `d3.schemeTableau10`）。

### View 1：泡泡圖（所得 × 壽命 × 人口）— `chart-bubble.js`

- 問題：一個國家的所得、國民平均壽命、人口規模之間有什麼關係？
- 這是 Observable/D3 Gallery 最經典的 Gapminder 呈現方式，x/y/半徑/顏色四個視覺通道各自
  對應一個資料欄位，是「用視覺編碼呈現多維資料」的教科書範例
- 加了滑過顯示數值的 tooltip——D3 Gallery 範例的典型互動方式，hw1 因為作業要求「靜態」沒有做，
  hw1-v2 沒有這個限制，所以採用

### View 2：長條圖（人口前 15 大國）— `chart-bar.js`

- 問題：人口最多的國家是哪些、差距多大？
- 長條圖是「比大小、比排序」最直接的圖表形式；顏色沿用 View 1 的洲別色，讀者能把同一個國家
  在兩張圖之間對起來看（例如 View 1 裡最大的兩個泡泡，就是這裡最長的兩條長條）

### View 3：盒鬚圖（各大陸預期壽命分布）— `chart-boxplot.js`

- 問題：同樣是一個大陸，國與國之間的壽命差異有多大？光看平均值看不出來的事
- 盒鬚圖是統計學呈現分布差異的標準做法（中位數＋四分位距＋全距）；額外疊加每個國家的原始
  資料點（jitter 散開避免重疊），讓讀者同時看到「統計摘要」跟「背後真正的每一筆資料」，
  這是 D3 Gallery Boxplot 範例常見的搭配做法

## 4. 用到的 D3.js 模組（逐一對應程式碼）

| 子模組 | 用到的函式 | 用在哪裡 | 做什麼 |
|---|---|---|---|
| d3-fetch / d3-dsv | `d3.csv(url, d3.autoType)` | `main.js` | 讀 CSV，自動判斷欄位型別 |
| d3-scale | `d3.scaleLog()` | `chart-bubble.js` x 軸 | 人均 GDP 跨好幾個數量級，用 log 避免資料擠在左邊 |
| d3-scale | `d3.scaleLinear()` | 三張圖的數值軸 | 一般線性數值對應 |
| d3-scale | `d3.scaleSqrt()` | `chart-bubble.js` 半徑 | 人口→泡泡半徑；用平方根是因為圓的面積跟半徑是平方關係，這樣「泡泡面積」才會跟人口成正比 |
| d3-scale | `d3.scaleBand()` | `chart-bar.js`／`chart-boxplot.js` 類別軸 | 國家名稱／大陸名稱的類別座標 |
| d3-scale | `d3.scaleOrdinal().range(d3.schemeTableau10)` | `main.js` | 大陸→顏色的類別色階，三張圖共用同一份 |
| d3-axis | `d3.axisBottom()` / `d3.axisLeft()` | 三張圖 | 畫 x/y 座標軸刻度 |
| d3-array | `d3.extent()` / `d3.max()` / `d3.min()` | 各圖比例尺 domain | 算資料範圍 |
| d3-array | `d3.descending()` | `chart-bubble.js`／`chart-bar.js` | 依人口排序 |
| d3-array | `d3.quantile()` | `chart-boxplot.js` | 算 Q1／中位數／Q3，是整份作業唯一真正做「統計運算」的地方 |
| d3-format | `d3.format(",.0f")` / `d3.format(".2s")` / `d3.format("~s")` | 三張圖的數值標籤與軸刻度 | 千分位、SI 單位縮寫（如 1.3B） |
| d3-selection | `d3.select()` / `.append()` / `.selectAll().data().join()` | 三張圖 | 標準 D3 data-join 模式，畫 circle／rect／line |

**沒有用到**：`d3-geo`、`d3.contour`（等高線/地圖投影相關）——那是 hw1 的核心技術，
hw1-v2 是純統計圖表，不涉及地理座標，所以完全沒有用到。

## 5. 視覺風格取捨

- 刻意跟 hw1 的暖色編輯感設計（襯線標題、米色背景、卡片陰影）做區隔，改用
  Observable/D3 Gallery 常見的乾淨白底、無襯線字體、細灰格線、Tableau10 類別色，
  更接近「資料工具」而非「敘事型報告」的觀感
- 沒有做 hw1 那種「怎麼讀這份視覺化」引導區塊——三張圖各自的 `panel-desc` 已經夠短、
  夠直接說明在看什麼，資料主題也比地形資料單純（不需要先建立「拆解成四個角度」的心智模型）

## 6. 檔案結構

```
hw1-v2/
  PLAN.md              # 本文件
  index.html
  css/style.css
  js/
    main.js             # 資料載入、共用色階
    chart-bubble.js      # View 1
    chart-bar.js          # View 2
    chart-boxplot.js       # View 3
  data/
    gapminder-2007.csv    # 2007 年橫斷面資料，136 個國家/地區
```

## 7. 本機預覽

```
cd hw1-v2
python3 -m http.server 8001
```
再開 http://localhost:8001/ 即可。跟 hw1-v1（8000）是兩個獨立的 server 行程，互不影響。

## 8. 從「Observable Gallery 範例」到「一般網頁」：改寫時要注意的地方

Observable D3 Gallery（https://observablehq.com/@d3/gallery）上的程式碼是寫給 **Observable Notebook**
這個 runtime 跑的，不是一般網頁能直接貼上就動的 vanilla JS。實際做的時候是「參考技巧、重寫成標準寫法」，
不是複製貼上。差異整理如下：

| Observable Notebook 寫法 | 為什麼在一般網頁裡不能用 | hw1-v2 的做法 |
|---|---|---|
| `chart = { ... }` | 這是 Observable 的具名 cell 語法，不是合法 JavaScript，貼進 `<script>` 會直接 syntax error | 用一般具名函式或 `dataPromise.then((data) => { ... })` |
| 直接引用 `width`、`data` 卻沒有宣告 | Observable Notebook 有隱藏的響應式變數（`width` 自動綁定容器寬度）跟跨 cell 共享（`data` 來自另一個 cell），一般網頁沒有這套 runtime | `width` 直接寫死一個數字（如 `const width = 760`）；`data` 用 `d3.csv(...)` 明確載入，存在 `dataPromise` 裡讓三張圖共用 |
| `d3.create("svg")` + `return svg.node()` | 回傳一個還沒接上畫面的 DOM 節點，交給 Observable 自動掛載到 cell 輸出區 | 直接用 `d3.select("#chart-bubble").append("svg")`，明確選定畫面上哪個容器 |
| `Object.assign(svg.node(), {change})`，靠另一個 `viewof` cell 呼叫 `change()` 觸發動畫 | Observable 特有的「cell 之間自動重新執行」機制，一般網頁沒有 | hw1-v2 沒有做這種跨元件連動的動態切換，三張圖都是資料載入後畫一次的靜態結果（唯一的互動是泡泡圖的 hover tooltip，用一般的 `on("mousemove", ...)` 事件監聽器手動實作，不靠 Observable runtime） |

**可以直接沿用、跟平台無關的部分**：純粹呼叫 D3 函式庫本身 API 的那幾行，例如
`d3.scaleOrdinal(d3.schemeTableau10)`、`d3.arc()`、`d3.pie()` 這類——它們只是在呼叫 library，
不依賴 Observable 的 cell/響應式機制，搬到哪個環境都能執行。hw1-v2 實際上是「看 gallery 範例
用了哪些 D3 API、抓那個技巧的邏輯，然後重寫成 `d3.select(...).append("svg")` 這種標準、
可以放進任何一般 `<script>` 檔案的寫法」。

## 9. 跟 hw1-v1 用到的 D3 模組比較

同一個 D3.js library，兩個作業因為主題不同，實際用到的子模組幾乎不重疊：

| 模組/函式 | hw1-v1（地形） | hw1-v2（Gapminder） |
|---|---|---|
| `d3.contours()` | ✅ 分層設色地形圖／等高線圖的核心 | ❌ |
| `d3.geoPath()` / `d3.geoTransform()` | ✅ 把網格座標轉成畫面座標 | ❌ |
| `d3.scaleThreshold()` | ✅ 高程門檻→分層設色 | ❌ |
| `d3.interpolateBlues()` | ✅ 等高線漸層藍色 | ❌ |
| `d3.scaleLog()` / `d3.scaleSqrt()` | ❌ | ✅ 泡泡圖 x 軸／半徑 |
| `d3.scaleOrdinal()` | ❌ | ✅ 大陸→顏色類別色階 |
| `d3.quantile()` | ❌ | ✅ 盒鬚圖統計四分位數 |
| `d3.scaleLinear()` / `d3.scaleBand()` | ✅（直方圖／剖面圖） | ✅（三張圖都有） |
| `d3.axisBottom()` / `d3.axisLeft()` | ✅ | ✅ |
| `d3.line()` / `d3.area()` | ✅ 剖面圖 | ❌ |
| `d3.max()` / `d3.range()` | ✅ | ✅（`d3.max`/`d3.extent`/`d3.min`/`d3.descending`） |
| `d3.json()` vs `d3.csv()` | ✅ `d3.json` 讀網格資料 | ✅ `d3.csv` + `d3.autoType` 讀表格資料 |
| `d3.select/.append/.join`（data-join 模式） | ✅ | ✅ 兩邊共通的基本繪圖模式 |

**重點差異**：hw1-v1 的核心是 **`d3-geo` + `d3-contour`**（地理座標轉換、等值線/填色帶），這是
處理「網格化空間資料」專用的模組；hw1-v2 完全沒用到這兩個模組，核心換成 **`d3-scale` 的
`scaleLog`/`scaleSqrt`/`scaleOrdinal`** 加上 **`d3-array` 的 `quantile`**，這是處理「表格化統計
資料」的典型組合。兩邊共同的部分只有最基礎的 `d3-selection`（data-join）、`d3-axis`、
`d3.scaleLinear`/`scaleBand`——也就是幾乎每一張 D3 圖表都會用到的「地基」。
