<template>
  <div class="godown-container"><StockOverview v-model:material-id="materialId" /></div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import StockOverview from "./components/StockOverview.vue";
const materialId = ref<number | null>(null);
</script>

<style scoped>
.godown-container { padding: 20px; background: var(--el-bg-color-page); min-height: 100%; overflow: auto; }
@media(max-width:600px){.godown-container{padding:12px}}
</style>
