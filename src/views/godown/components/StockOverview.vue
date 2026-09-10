<template>
  <section class="stock-overview" aria-label="仓库收发概览" :aria-busy="loading">
    <header class="overview-heading">
      <div><h2>仓库收发概览</h2><p>{{ periodLabel }} · 按有效流水统计</p></div>
      <el-button :icon="Refresh" :loading="loading" @click="loadSummary()">刷新数据</el-button>
    </header>
    <div class="overview-filters">
      <label>仓库<el-select v-model="warehouseCode" aria-label="仓库" @change="loadSummary()">
        <el-option v-for="warehouse in warehouses" :key="warehouse.code" :label="warehouse.name" :value="warehouse.code" />
      </el-select></label>
      <label class="material-filter">产品<el-select :model-value="materialId ?? undefined" aria-label="产品" clearable filterable
        placeholder="全部产品" :filter-method="filterMaterials" @change="changeMaterial">
        <el-option v-for="item in materialOptions" :key="item.value" :value="Number(item.value)" :label="`${item.num || ''} ${item.label}`" />
      </el-select></label>
      <label class="date-filter">日期<el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD"
        start-placeholder="开始日期" end-placeholder="结束日期" range-separator="至" @change="loadSummary()" /></label>
    </div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div class="quality-switch">
      <el-segmented v-model="quality" :options="qualityOptions" @change="loadSummary()" aria-label="库存类别" />
      <span>{{ currentWarehouse?.name || '仓库' }} · {{ selectedMaterialName }}</span>
    </div>
    <div class="metric-grid">
      <article v-for="metric in metrics" :key="metric.key" class="metric-card" :class="metric.tone">
        <div class="metric-heading"><span>{{ metric.label }}</span><el-icon :size="21"><component :is="metric.icon" /></el-icon></div>
        <div class="metric-value">{{ display(total[metric.key]) }}<span v-if="!loading && !error" class="metric-unit">件</span></div>
        <div class="metric-breakdown">
          <span v-for="row in visibleSummary" :key="row.qualityStatus">{{ qualityName(row.qualityStatus) }}<strong>{{ display(row[metric.key]) }}</strong></span>
          <span v-if="!visibleSummary.length">{{ loading ? '正在加载…' : error ? '数据暂不可用' : '暂无有效流水' }}</span>
        </div>
      </article>
    </div>
    <footer class="overview-footer">
      <div><span>期初库存</span><strong>{{ display(total.openingQuantity) }}</strong></div>
      <span class="equation-sign">＋</span>
      <div><span>期间净变动</span><strong>{{ netDisplay }}</strong></div>
      <span class="equation-sign">＝</span>
      <div><span>期末库存</span><strong>{{ display(total.closingQuantity) }}</strong></div>
      <p>未限制日期时，期末库存与仓库统计一致。</p>
    </footer>
    <StockCharts v-if="!error" :summary="visibleSummary" :trend="trend" :distribution="distribution"
      :loading="loading" :selected="!!materialId" :dates="dates" />
  </section>
</template>

<script setup lang="ts">
import StockCharts from "./StockCharts.vue";
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import { Download, Upload, Box, Refresh } from "@element-plus/icons-vue";
import { getStockOverview, StockOverviewData, getWarehouses, qualityName, StockFlowSummary, StockWarehouse } from "@/api/modules/stock";
import { useDictStore } from "@/stores/modules/dict";

const props = defineProps<{ materialId: number | null }>();
const emit = defineEmits<{ 'update:materialId': [value: number | null] }>();
const dictStore = useDictStore();
const warehouses = ref<StockWarehouse[]>([]), warehouseCode = ref("");
const dates = ref<string[]>([dayjs().startOf("month").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")]), quality = ref("");
const summary = ref<StockFlowSummary[]>([]), loading = ref(false), error = ref("");
const trend = ref<StockOverviewData["trend"]>([]), distribution = ref<StockOverviewData["distribution"]>([]);
const materialQuery = ref("");
let requestId = 0;
const currentWarehouse = computed(() => warehouses.value.find(item => item.code === warehouseCode.value));
const materialOptions = computed(() => ((dictStore.dictMap.mater || []) as { value: string | number; label: string; num?: string }[])
  .filter(item => `${item.num || ''} ${item.label}`.toLowerCase().includes(materialQuery.value.toLowerCase())));
const selectedMaterialName = computed(() => dictStore.dictMap.mater?.find(item => Number(item.value) === props.materialId)?.label || "全部产品");
const periodLabel = computed(() => dates.value?.length === 2 ? `${dates.value[0]} 至 ${dates.value[1]}` : "全部日期");
const qualityOptions = computed(() => currentWarehouse.value?.summaryMode === "DUAL"
  ? [{ label: "全部库存", value: "" }, { label: "未检", value: "READY" }, { label: "已检", value: "QUALIFIED" }]
  : [{ label: "全部库存", value: "" }]);
const visibleSummary = computed(() => summary.value.filter(row => !quality.value || row.qualityStatus === quality.value));
const total = computed(() => {
  const result = { openingQuantity: 0, inQuantity: 0, outQuantity: 0, netQuantity: 0, closingQuantity: 0 };
  for (const row of visibleSummary.value) {
    for (const key of Object.keys(result) as (keyof typeof result)[]) result[key] = Math.round((result[key] + Number(row[key])) * 10000) / 10000;
  }
  return result;
});
const metrics = [
  { key: "inQuantity", label: "入库合计", icon: Download, tone: "inbound" },
  { key: "outQuantity", label: "出库合计", icon: Upload, tone: "outbound" },
  { key: "closingQuantity", label: "期末库存", icon: Box, tone: "balance" }
] as const;
const display = (value: number) => loading.value || error.value ? "—" : Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 4 });
const netDisplay = computed(() => !loading.value && !error.value && total.value.netQuantity > 0 ? `+${display(total.value.netQuantity)}` : display(total.value.netQuantity));
const filterMaterials = (query: string) => { materialQuery.value = query; };
const changeMaterial = (value: number | undefined) => { const id = value ? Number(value) : null; emit('update:materialId', id); loadSummary(id); };
async function loadSummary(materialId: number | null = props.materialId) {
  if (!warehouseCode.value) return;
  const current = ++requestId;
  loading.value = true; error.value = ""; summary.value = [];
  if (currentWarehouse.value?.summaryMode !== "DUAL") quality.value = "";
  try {
    const result = await getStockOverview({ pageNum: 1, pageSize: 1, warehouseCode: warehouseCode.value,
      ...(materialId ? { sourceItemId: materialId } : {}), ...(quality.value ? { qualityStatus: quality.value } : {}), ...(dates.value?.length === 2 ? { bizDate: dates.value } : {}) });
    if (current === requestId) {
      summary.value = result.data.summary || []; trend.value = result.data.trend || []; distribution.value = result.data.distribution || [];
    }
  } catch {
    if (current === requestId) error.value = "库存数据加载失败，请点击刷新重试。";
  } finally { if (current === requestId) loading.value = false; }
}
onMounted(async () => {
  loading.value = true;
  try {
    const [result] = await Promise.all([getWarehouses("PRODUCT"), dictStore.loadDicts(["mater"])]);
    warehouses.value = result.data; warehouseCode.value = result.data[0]?.code || "";
    await loadSummary();
  } catch { error.value = "仓库信息加载失败，请刷新页面重试。"; }
  finally { loading.value = false; }
});
</script>

<style scoped lang="scss">
.stock-overview{margin-bottom:24px;color:var(--el-text-color-primary)}
.overview-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
h2{margin:0;font-size:22px;font-weight:650;letter-spacing:.02em}
.overview-heading p{margin:7px 0 0;font-size:13px;color:var(--el-text-color-secondary)}
.overview-filters{display:flex;flex-wrap:wrap;gap:20px;padding:18px 22px;background:var(--el-bg-color);border:1px solid var(--el-border-color-lighter);border-radius:10px}
.overview-filters label{display:flex;align-items:center;gap:10px;font-size:13px;white-space:nowrap}
.overview-filters .el-select{width:150px}.material-filter .el-select{width:300px}.date-filter{flex:1;min-width:290px}.date-filter :deep(.el-date-editor){width:100%;min-width:0}
.quality-switch{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:20px 0 14px}
.quality-switch>span{color:var(--el-text-color-secondary);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.metric-card{--accent:var(--el-color-success);--tint:var(--el-color-success-light-9);padding:24px;background:var(--el-bg-color);border:1px solid var(--el-border-color-lighter);border-radius:12px;box-shadow:0 4px 18px #18263b05}
.outbound{--accent:var(--el-color-warning);--tint:var(--el-color-warning-light-9)}
.balance{--accent:var(--el-color-primary);--tint:var(--el-color-primary-light-9);border-color:var(--el-color-primary-light-7)}
.metric-heading{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:550}.metric-heading .el-icon{padding:10px;background:var(--tint);color:var(--accent);border-radius:10px;box-sizing:content-box}
.metric-value{margin:18px 0 22px;font-size:clamp(28px,3vw,42px);line-height:1.2;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-.03em;overflow-wrap:anywhere}
.balance .metric-value{color:var(--el-color-primary)}.metric-unit{font-size:13px;font-weight:400;letter-spacing:0;margin-left:8px;color:var(--el-text-color-secondary)}
.metric-breakdown{display:flex;flex-wrap:wrap;gap:10px 22px;padding-top:15px;border-top:1px solid var(--el-border-color-extra-light);font-size:12px;color:var(--el-text-color-secondary);min-height:18px}.metric-breakdown strong{font-size:14px;color:var(--el-text-color-regular);font-weight:550;margin-left:9px;font-variant-numeric:tabular-nums}
.overview-footer{display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin-top:14px;padding:17px 22px;background:var(--el-bg-color);border:1px solid var(--el-border-color-lighter);border-radius:10px}
.overview-footer div{display:flex;gap:12px;align-items:baseline}.overview-footer span{font-size:12px;color:var(--el-text-color-secondary)}.overview-footer strong{font-size:17px;font-weight:550;font-variant-numeric:tabular-nums}.overview-footer p{margin:0 0 0 auto;color:var(--el-text-color-secondary);font-size:12px}
@media(max-width:900px){.metric-grid{gap:12px}.metric-card{padding:18px}.overview-footer p{width:100%;margin:0}.material-filter{flex:1}.material-filter .el-select{width:100%}}
@media(max-width:600px){.metric-grid{grid-template-columns:1fr}.metric-value{font-size:34px;margin:8px 0 16px}.overview-filters{padding:16px;gap:14px}.overview-filters label{width:100%;min-width:0}.overview-filters .el-select{flex:1;width:auto}.overview-heading h2{font-size:19px}.quality-switch{align-items:flex-start;flex-direction:column}.overview-footer{gap:10px;padding:14px}.overview-footer div{gap:6px}}
</style>
