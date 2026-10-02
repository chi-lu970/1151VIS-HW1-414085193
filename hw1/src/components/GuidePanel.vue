<script setup>
const steps = [
  {
    title: "分層設色地形圖",
    question: "哪裡高、哪裡低？",
    desc: "顏色由綠到棕再到橘，代表海拔由低到高。<br />可以看出中央山脈縱貫南北，平原集中在西部與東北角。",
  },
  {
    title: "面積—高程分佈直方圖",
    question: "各高度佔多少土地？",
    desc: "每條長條是一個高度區間佔全島面積的百分比，可以看出多數土地其實集中在低海拔。",
  },
];
</script>

<template>
  <section class="panel guide">
    <h2>怎麼讀這份視覺化</h2>
    <div class="guide-steps">
      <div v-for="(s, i) in steps" :key="s.title" class="guide-step">
        <span class="step-num">{{ i + 1 }}</span>
        <p class="guide-step-text">
          <strong>{{ s.title }}</strong><br />
          {{ s.question }}<br />
          <span class="guide-step-desc" v-html="s.desc"></span>
        </p>
      </div>
    </div>
  </section>
</template>
