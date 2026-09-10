<template>
  <div class="stock-charts">
    <section class="chart-panel" :aria-busy="loading">
      <header><h3>每日出入库趋势</h3><span>入库与出库 · 件</span></header>
      <div v-if="loading" class="chart-state">正在加载…</div>
      <div v-else-if="!trend.length" class="chart-state">所选期间暂无有效流水</div>
      <div v-show="!loading && trend.length" ref="trendElement" class="chart" role="img" aria-label="每日入库和出库数量趋势图" />
    </section>
    <section class="chart-panel" :aria-busy="loading">
      <header><h3>{{ selected ? '产品库存构成' : '库存数量前10种物料' }}</h3><span>截至期末 · 件</span></header>
      <div v-if="loading" class="chart-state">正在加载…</div>
      <div v-else-if="!bars.length" class="chart-state">暂无库存数据</div>
      <div v-show="!loading && bars.length" ref="distributionElement" class="chart" role="img" aria-label="物料期末库存数量条形图" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import { StockOverviewData, qualityName } from "@/api/modules/stock";

const props = defineProps<StockOverviewData & { loading: boolean; selected: boolean; dates: string[] | null }>();
const trendElement = ref<HTMLElement>(), distributionElement = ref<HTMLElement>();
let trendChart: echarts.ECharts | undefined, distributionChart: echarts.ECharts | undefined;
let observer: ResizeObserver | undefined;
const bars = computed(() => props.selected
  ? props.summary.map(row => ({ label: qualityName(row.qualityStatus), quantity: Number(row.closingQuantity) }))
  : props.distribution.map(row => ({ label: `${row.itemName} (${row.itemCode})`, quantity: Number(row.quantity) })));
const resize = () => { trendChart?.resize(); distributionChart?.resize(); };
async function render() {
  await nextTick();
  if (props.loading) return;
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue('--el-color-primary').trim() || '#409eff';
  const warning = style.getPropertyValue('--el-color-warning').trim() || '#e6a23c';
  const text = style.getPropertyValue('--el-text-color-secondary').trim() || '#909399';
  const border = style.getPropertyValue('--el-border-color-lighter').trim() || '#ebeef5';
  if (trendElement.value && props.trend.length) {
    trendChart ||= echarts.init(trendElement.value);
    const days = new Map(props.trend.map(row => [row.bizDate, row]));
    let date = dayjs(props.dates?.[0] || props.trend[0].bizDate);
    const end = dayjs(props.dates?.[1] || props.trend[props.trend.length - 1].bizDate);
    const labels: string[] = [], inbound: number[] = [], outbound: number[] = [];
    while (!date.isAfter(end, 'day')) {
      const key = date.format('YYYY-MM-DD');
      labels.push(key); inbound.push(Number(days.get(key)?.inQuantity || 0)); outbound.push(Number(days.get(key)?.outQuantity || 0));
      date = date.add(1, 'day');
    }
    trendChart.setOption({ animation: false, color: [primary, warning], tooltip: { trigger: 'axis', renderMode: 'richText' },
      legend: { top: 8, textStyle: { color: text } }, grid: { top: 55, left: 20, right: 20, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { color: text, formatter: (value: string) => value.slice(5) } },
      yAxis: { type: 'value', axisLabel: { color: text }, splitLine: { lineStyle: { color: border } } },
      dataZoom: labels.length > 90 ? [{ type: 'slider', height: 16, bottom: 2 }] : [],
      series: [{ name: '入库', type: 'line', showSymbol: labels.length < 32, data: inbound },
        { name: '出库', type: 'line', showSymbol: labels.length < 32, data: outbound }] }, true);
  }
  if (distributionElement.value && bars.value.length) {
    distributionChart ||= echarts.init(distributionElement.value);
    distributionChart.setOption({ animation: false, tooltip: { trigger: 'axis', renderMode: 'richText', axisPointer: { type: 'shadow' } },
      grid: { left: 12, right: 55, top: 20, bottom: 25, containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: text }, splitLine: { lineStyle: { color: border } } },
      yAxis: { type: 'category', inverse: true, data: bars.value.map(row => row.label), axisLabel: { color: text, width: 130, overflow: 'truncate' }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{ type: 'bar', barMaxWidth: 24, data: bars.value.map(row => row.quantity), itemStyle: { color: primary, borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: text } }] }, true);
  }
  resize();
}
watch(() => [props.trend, props.distribution, props.summary, props.loading, props.selected], render);
onMounted(() => {
  observer = new ResizeObserver(resize);
  if (trendElement.value) observer.observe(trendElement.value);
  if (distributionElement.value) observer.observe(distributionElement.value);
  render();
});
onBeforeUnmount(() => { observer?.disconnect(); trendChart?.dispose(); distributionChart?.dispose(); });
</script>

<style scoped>
.stock-charts{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-top:24px}
.chart-panel{min-width:0;background:var(--el-bg-color);border:1px solid var(--el-border-color-lighter);border-radius:12px;overflow:hidden}
header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:22px 24px 0}h3{margin:0;font-size:16px;font-weight:600}header span{font-size:12px;color:var(--el-text-color-secondary)}
.chart,.chart-state{height:380px}.chart-state{display:flex;align-items:center;justify-content:center;color:var(--el-text-color-secondary);font-size:14px}
@media(max-width:1000px){.stock-charts{grid-template-columns:1fr}}
</style>
