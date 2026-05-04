<!--
 * @Author: cwh
 * @Date: 2025-04-16 20:29:29
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-04-16 21:12:01
 * @FilePath: \Geeker-Admin\src\views\components\Chart\pieChart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div ref="chartContainer" class="echarts-pie"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import { useDebounceFn } from "@vueuse/core";
import * as echarts from "echarts";

// 定义响应式容器引用和图表实例
const chartContainer = ref(null);
const chartInstance = ref(null); // ECharts 实例

const props = defineProps({
  options: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return;

  // 防止重复初始化
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }

  chartInstance.value = echarts.init(chartContainer.value);
  chartInstance.value.setOption(props.options, { notMerge: true });
};

// 防抖更新图表（避免高频 setOption）
const updateChart = useDebounceFn((newOptions) => {
  if (chartInstance.value) {
    // 使用 notMerge: true 避免配置项累积，完全替换
    chartInstance.value.setOption(newOptions, { notMerge: true, lazyUpdate: true });
  }
}, 100);

// 组件挂载后初始化
onMounted(async () => {
  await nextTick(); // 确保 DOM 布局完成

  if (chartContainer.value) {
    initChart();
    window.addEventListener("resize", handleResize);
  }
});

// 组件卸载前销毁图表实例
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
  }
  window.removeEventListener("resize", handleResize);
});

// 监听配置项变化（浅监听，不深度比较）
watch(
  () => props.options,
  (newOptions) => {
    if (chartInstance.value && newOptions) {
      updateChart(newOptions);
    } else if (!chartInstance.value && newOptions) {
      // 实例未创建时直接初始化
      initChart();
    }
  },
  { deep: false }, // ❌ 移除 deep: true，避免深度比较卡顿
);

// 监听窗口大小变化，调整图表尺寸（防抖）
const handleResize = useDebounceFn(() => {
  chartInstance.value?.resize({ animation: { duration: 300 } });
}, 200);
</script>

<style scoped>
.echarts-pie {
  width: 50%;
  height: 400px;
}
</style>
