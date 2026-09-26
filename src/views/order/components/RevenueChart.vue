<template><div ref="element" class="revenue-chart" role="img" :aria-label="label" /></template>

<script setup lang="ts">
import { onActivated, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([LineChart, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);
const props = defineProps<{ option: EChartsCoreOption; label: string }>();
const element = ref<HTMLDivElement>();
let chart: echarts.EChartsType | undefined;
let resize: ResizeObserver | undefined;
let theme: MutationObserver | undefined;
function render() {
  if (!element.value || !chart) return;
  const style = getComputedStyle(element.value);
  const color = style.getPropertyValue("--el-text-color-regular").trim() || "#606266";
  const line = style.getPropertyValue("--el-border-color-lighter").trim() || "#e5e7eb";
  const background = style.getPropertyValue("--el-bg-color").trim() || "#fff";
  const axes = (axis: any) =>
    axis && {
      ...axis,
      axisLabel: { color, ...axis.axisLabel },
      axisLine: { lineStyle: { color: line } },
      splitLine: { lineStyle: { color: line } },
    };
  chart.setOption(
    {
      ...props.option,
      animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      textStyle: { fontFamily: "inherit", color },
      legend: { ...(props.option.legend as object), textStyle: { color } },
      tooltip: { ...(props.option.tooltip as object), backgroundColor: background, borderColor: line, textStyle: { color } },
      xAxis: axes(props.option.xAxis),
      yAxis: axes(props.option.yAxis),
    },
    { notMerge: true },
  );
}
onMounted(() => {
  if (!element.value) return;
  chart = echarts.init(element.value);
  resize = new ResizeObserver(() => chart?.resize());
  resize.observe(element.value);
  theme = new MutationObserver(render);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  render();
});
watch(() => props.option, render);
onActivated(() => chart?.resize());
onBeforeUnmount(() => {
  resize?.disconnect();
  theme?.disconnect();
  chart?.dispose();
});
</script>

<style scoped>
.revenue-chart {
  width: 100%;
  min-width: 0;
  height: 245px;
}
</style>
