<template>
  <div id="echarts" ref="chartRef" :style="echartsStyle" />
</template>

<script setup lang="ts" name="ECharts">
import { ref, onMounted, onBeforeUnmount, watch, computed, markRaw, nextTick, onActivated } from "vue";
import { EChartsType, ECElementEvent } from "echarts/core";
import echarts, { ECOption } from "./config";
import { useDebounceFn } from "@vueuse/core";
import { useGlobalStore } from "@/stores/modules/global";
import { storeToRefs } from "pinia";

interface Props {
  option: ECOption;
  renderer?: "canvas" | "svg";
  resize?: boolean;
  theme?: Object | string;
  width?: number | string;
  height?: number | string;
  onClick?: (event: ECElementEvent) => any;
}

const props = withDefaults(defineProps<Props>(), {
  renderer: "canvas",
  resize: true,
});

const echartsStyle = computed(() => {
  return props.width || props.height
    ? { height: props.height + "px", width: props.width + "px" }
    : { height: "100%", width: "100%" };
});

const chartRef = ref<HTMLDivElement | HTMLCanvasElement>();
const chartInstance = ref<EChartsType>();
let isChartInitialized = false; // 防止重复初始化

// 点击事件处理
const handleClick = (event: ECElementEvent) => {
  if (props.onClick) {
    props.onClick(event);
  }
};

// 初始化图表（只创建实例，不设置 option）
const initChart = () => {
  if (!chartRef.value) return;

  // 避免重复初始化
  if (isChartInitialized) {
    return;
  }

  // 清理旧实例
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }

  chartInstance.value = markRaw(
    echarts.init(chartRef.value, props.theme, {
      renderer: props.renderer,
    }),
  );

  chartInstance.value.on("click", handleClick);
  isChartInitialized = true;
};

// 更新图表（带防抖）
const updateChart = useDebounceFn((newOption: ECOption) => {
  if (!chartRef.value) return;

  // 实例不存在则先初始化
  if (!chartInstance.value) {
    initChart();
  }

  if (chartInstance.value && newOption) {
    chartInstance.value.setOption(newOption, { notMerge: true, lazyUpdate: true });
  }
}, 50);

// Resize 逻辑
const resize = () => {
  if (chartInstance.value && props.resize) {
    chartInstance.value.resize({ animation: { duration: 300 } });
  }
};
const debouncedResize = useDebounceFn(resize, 300, { maxWait: 800 });

// 组件挂载
onMounted(async () => {
  await nextTick();

  if (chartRef.value) {
    // 如果有初始 option，直接更新（会触发 initChart + setOption）
    if (props.option) {
      updateChart(props.option);
    } else {
      // 否则只初始化实例
      initChart();
    }
  }

  window.addEventListener("resize", debouncedResize);
});

// 监听 option 变化
watch(
  () => props.option,
  (newOption) => {
    if (newOption) {
      updateChart(newOption);
    }
  },
  { deep: false },
);

onActivated(() => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
});

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = undefined; // 使用 undefined 而非 null
  }
  window.removeEventListener("resize", debouncedResize);
});

defineExpose({
  getInstance: () => chartInstance.value,
  resize, // 直接暴露原始函数
  update: updateChart,
});
</script>
