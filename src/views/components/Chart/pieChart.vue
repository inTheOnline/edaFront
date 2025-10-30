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
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as echarts from 'echarts';

// 定义响应式容器引用和图表实例
const chartContainer = ref(null);
const chartInstance = ref(null);//ECharts 实例
defineProps(['options'])
// 定义 props 接收外部传入的配置项
const props = defineProps({
  options: {
    type: Object,
    required: true,
  },
});
// 初始化图表
const initChart = () => {
  if (chartInstance.value) return;
  // 使用 ref 获取 DOM 元素并初始化 ECharts 实例
  chartInstance.value = echarts.init(chartContainer.value);
  // 设置传入的配置项
  chartInstance.value.setOption(props.options);
};

// 组件挂载时初始化图表并监听窗口大小变化
onMounted(() => {
  console.log("dwadaw"+props.options);

  initChart();
  window.addEventListener('resize', handleResize);
});

// 组件卸载前销毁图表实例
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
    window.removeEventListener('resize', handleResize);
  }
});

// 监听配置项变化，动态更新图表
watch(
  () => props.options,
  (newOptions) => {
    if (chartInstance.value) {
      chartInstance.value.setOption(newOptions);
    }
  },
  { deep: true }
);

// 监听窗口大小变化，调整图表尺寸
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
};
</script>

<style scoped>
.echarts-pie {
  width: 50%;
  height: 400px;
}
</style>