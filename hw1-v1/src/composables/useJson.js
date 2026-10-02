import { ref, shallowRef } from "vue";

// 載入 public/data 下的 JSON，回傳 data / loading / error 三個響應式狀態。
// 同一個 URL 的 Promise 會被快取，兩個圖表共用資料時不會重複 fetch。
const cache = new Map();

export function useJson(url) {
  const data = shallowRef(null); // 網格資料很大，用 shallowRef 避免深層響應式代理
  const loading = ref(true);
  const error = ref(null);

  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(import.meta.env.BASE_URL + url).then((r) => {
        if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
        return r.json();
      })
    );
  }

  cache
    .get(url)
    .then((d) => (data.value = d))
    .catch((e) => (error.value = e))
    .finally(() => (loading.value = false));

  return { data, loading, error };
}
