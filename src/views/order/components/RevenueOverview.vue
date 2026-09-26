<template>
  <section class="revenue-overview" aria-label="经营分析" :aria-busy="loading">
    <div class="revenue-toolbar">
      <div>
        <span class="page-name">订单首页</span>
        <h1>
          <el-dropdown trigger="click" @command="selectView">
            <button type="button" class="view-switch" aria-label="切换经营分析视图">
              {{ view === "revenue" ? "经营概览" : "毛利分析" }}
              <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="revenue">经营概览</el-dropdown-item>
                <el-dropdown-item command="profit">毛利分析</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </h1>
        <p>
          {{ view === "revenue" ? "含税出货金额 − 退货金额" : "仅统计胜蓝 · 按产品重量及外发报价估算" }}
          <span v-if="data?.throughDate"> · 截至 {{ data.throughDate }}</span>
        </p>
      </div>
      <div class="revenue-filters">
        <el-select v-model="year" aria-label="统计年份" class="year-select"
          ><el-option v-for="y in years" :key="y" :value="y" :label="`${y}年`"
        /></el-select>
        <el-select v-model="month" aria-label="统计月份" class="month-select"
          ><el-option v-for="m in 12" :key="m" :value="m" :label="`${m}月`"
        /></el-select>
        <el-select v-model="custId" clearable filterable placeholder="全部客户" aria-label="统计客户" class="customer-select"
          ><el-option v-for="item in customers" :key="item.value" :label="item.label" :value="item.value"
        /></el-select>
        <el-button type="primary" :icon="Refresh" :loading="loading" @click="refreshAll">刷新</el-button>
      </div>
    </div>
    <el-alert v-if="error" type="error" title="经营数据加载失败，请重试。" show-icon :closable="false"
      ><el-button link type="primary" @click="load">重新加载</el-button></el-alert
    >
    <el-skeleton v-else-if="loading && !data" :rows="9" animated />
    <template v-else-if="data">
      <OrderProfit
        v-if="view === 'profit' && data.profit"
        :profit="data.profit"
        :year="year"
        :month="month"
        :shenglan-id="shenglanId"
        @select-customer="custId = $event"
      />
      <el-alert v-else-if="view === 'profit'" type="info" title="毛利数据暂不可用，请刷新后重试。" :closable="false" show-icon />
      <template v-else>
        <el-alert v-if="data.future" type="info" title="所选月份尚未开始，营业额暂不显示。" :closable="false" show-icon />
        <el-alert
          v-if="data.monthTotal.missingPriceCount || data.yearTotal.missingPriceCount || data.pending.missingPriceCount"
          type="warning"
          :closable="false"
          show-icon
          :title="`存在未定价明细：本月 ${data.monthTotal.missingPriceCount} 条，本年 ${data.yearTotal.missingPriceCount} 条，当前待交 ${data.pending.missingPriceCount} 条。金额仅汇总已定价部分，缺价不按零元计算。`"
        />
        <div class="revenue-kpis" :class="{ 'is-loading': loading }">
          <article>
            <span
              >{{ month }}月净营业额 <small>{{ scope }}</small></span
            ><strong>{{ money(data.monthTotal.net) }}</strong>
            <div class="comparisons">
              <small
                >同期环比 <b :class="sign(data.momRate)">{{ percent(data.momRate, true) }}</b></small
              ><small
                >同期同比 <b :class="sign(data.yoyRate)">{{ percent(data.yoyRate, true) }}</b></small
              >
            </div>
          </article>
          <article>
            <span
              >{{ year }}年累计 <small>{{ scope }}</small></span
            ><strong>{{ money(data.yearTotal.net) }}</strong
            ><small>所选年度截至今日，含退货及营业额调整</small>
          </article>
          <article class="return-kpi">
            <span
              >{{ month }}月退货金额 <small>{{ scope }}</small></span
            ><strong>{{ money(data.monthTotal.returned) }}</strong
            ><small>出货金额 {{ money(data.monthTotal.shipped) }}</small>
            <small>营业额调整 {{ money(data.monthTotal.adjustment) }}</small>
          </article>
          <article>
            <span
              >当前待交估算 <small>{{ scope }}</small></span
            ><strong>{{ money(data.pending.net) }}</strong
            ><small>未交数量 × 订单价，未计入营业额</small>
          </article>
        </div>
        <div class="revenue-primary">
          <section class="revenue-panel">
            <header>
              <div>
                <h3>年度营业额趋势</h3>
                <p>{{ scope }} · 月度净额与退货金额（元）</p>
              </div>
              <el-tag effect="plain">{{ year }}年</el-tag>
            </header>
            <RevenueChart :option="trendOption" label="所选客户本年和上年每月净营业额及本年退货金额折线图" />
            <p class="chart-note">未来月份留空；当月尚未结束。历史金额会随绑定订单单价调整。</p>
            <p v-if="data.trend.some((row) => row.missingPriceCount)" class="chart-note missing">
              趋势存在未定价明细，相关月份金额仅含已定价部分，见月度数据。
            </p>
            <details class="trend-data">
              <summary>查看月度数据</summary>
              <el-table :data="data.trend" size="small" max-height="300"
                ><el-table-column label="年份" prop="year" /><el-table-column label="月份" prop="month" /><el-table-column
                  label="净营业额"
                  ><template #default="{ row }">{{ money(row.net) }}</template></el-table-column
                ><el-table-column label="退货金额"
                  ><template #default="{ row }">{{ money(row.returned) }}</template></el-table-column
                ><el-table-column label="营业额调整"
                  ><template #default="{ row }">{{ money(row.adjustment) }}</template></el-table-column
                ><el-table-column label="未定价明细" prop="missingPriceCount"
              /></el-table>
            </details>
          </section>
          <section class="revenue-panel">
            <header>
              <div>
                <h3>{{ month }}月客户占比</h3>
                <p>全部客户 · 点击客户查看其经营情况</p>
              </div>
            </header>
            <div v-if="data.customerSharesAvailable" class="customer-donut">
              <RevenueChart :option="shareOption" label="本月全公司客户净营业额占比" />
            </div>
            <p v-else class="share-note">
              {{
                data.customers.length ? "存在负净额、未定价或合计不大于零，展示金额，暂不计算占比。" : "本月暂无出货或退货记录。"
              }}
            </p>
            <div class="customer-ranking">
              <button
                v-for="(row, index) in data.customers"
                :key="row.id ?? 'unknown'"
                :disabled="row.id == null"
                @click="custId = row.id!"
                :class="{ active: row.id === custId }"
              >
                <span class="customer-name"><i :style="{ background: colors[index % colors.length] }" />{{ row.name }}</span
                ><span
                  >{{ money(row.net)
                  }}<small
                    >{{ percent(row.share) }}<em v-if="row.missingPriceCount"> · 缺价 {{ row.missingPriceCount }} 条</em></small
                  ></span
                >
              </button>
            </div>
          </section>
        </div>
        <div class="revenue-secondary">
          <section class="revenue-panel">
            <header>
              <div>
                <h3>产品营业额构成</h3>
                <p>{{ scope }} · {{ year }}年{{ month }}月 · 按净营业额排序</p>
              </div>
              <span class="subtle">{{ data.products.length }} 种产品</span>
            </header>
            <el-table :data="data.products" max-height="305" empty-text="所选范围暂无产品营业额" class="product-table"
              ><el-table-column label="产品" min-width="150"
                ><template #default="{ row }"
                  ><strong>{{ row.name }}</strong
                  ><small>{{ row.code || "—" }}</small></template
                ></el-table-column
              ><el-table-column label="净营业额（元）" min-width="125" align="right"
                ><template #default="{ row }"
                  >{{ money(row.net, false)
                  }}<small v-if="row.missingPriceCount" class="missing">缺价 {{ row.missingPriceCount }} 条</small></template
                ></el-table-column
              ><el-table-column label="占比" min-width="120" align="right"
                ><template #default="{ row }"
                  ><div class="product-share">
                    <span>{{ percent(row.share) }}</span>
                    <div v-if="row.share != null" class="share-track">
                      <i :style="{ width: `${Math.max(0, Number(row.share) * 100)}%` }" />
                    </div></div></template></el-table-column
            ></el-table>
            <p class="chart-note">有负净额、缺价或合计不大于零时不展示占比；零元成交为有效价格。</p>
          </section>
          <section class="revenue-panel">
            <header>
              <div>
                <h3>经营提示</h3>
                <p>全部客户 · 帮助判断客户结构和增长来源</p>
              </div>
            </header>
            <div class="decision-content">
              <div class="concentration">
                <span>TOP3 客户集中度</span><strong>{{ percent(data.top3Share) }}</strong>
                <p>前三位客户占全公司本月净营业额的比例。</p>
                <small>集中度越高，越需要关注主要客户的需求变化。</small>
              </div>
              <div class="contribution">
                <h4>营业额变化贡献</h4>
                <p>较上月同期 · 按变化金额绝对值排序</p>
                <ul>
                  <li v-for="row in contributors" :key="row.id ?? 'unknown'">
                    <span>{{ row.name }}</span
                    ><strong :class="sign(row.change)">{{
                      row.change == null ? "—" : `${Number(row.change) > 0 ? "+" : ""}${money(row.change, false)}`
                    }}</strong>
                  </li>
                </ul>
                <p v-if="!contributors.length" class="share-note">暂无可比较的客户数据</p>
              </div>
            </div>
          </section>
        </div>
        <p class="revenue-footnote">
          本月同比、环比均比较截至同日，历史月份比较整月。对比基期净额不大于零或存在缺价时不计算增长率。退货按发生月份扣减。
        </p>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, ref, watch } from "vue";
import { ArrowDown, Refresh } from "@element-plus/icons-vue";
import { getOrderRevenue, type OrderRevenue } from "@/api/modules/orderRevenue";
import { useDictStore } from "@/stores/modules/dict";
import RevenueChart from "./RevenueChart.vue";
import OrderProfit from "./OrderProfit.vue";
const dict = useDictStore();
const emit = defineEmits<{ refresh: [] }>();
const today = new Date();
const year = ref(today.getFullYear());
const month = ref(today.getMonth() + 1);
const view = ref<"revenue" | "profit">("revenue");
const revenueCustId = ref<number>();
const profitCustId = ref<number>();
const custId = computed({
  get: () => (view.value === "revenue" ? revenueCustId.value : profitCustId.value),
  set: (value: number | undefined) => {
    if (view.value === "revenue") revenueCustId.value = value;
    else profitCustId.value = value;
  },
});
let profitInitialized = false;
const data = ref<OrderRevenue>();
const loading = ref(false);
const error = ref(false);
const years = Array.from({ length: today.getFullYear() - 1999 }, (_, i) => today.getFullYear() - i);
const customers = computed(() => (dict.dictMap.cust || []).map((item) => ({ label: item.label, value: Number(item.value) })));
const shenglanId = computed(() => customers.value.find((item) => item.label === "胜蓝")?.value);
function selectView(next: "revenue" | "profit") {
  if (next === "profit" && !profitInitialized) {
    profitCustId.value = shenglanId.value ?? data.value?.profit?.custId ?? undefined;
    profitInitialized = profitCustId.value != null;
  }
  view.value = next;
}
watch(shenglanId, (id) => {
  if (view.value === "profit" && !profitInitialized && id != null) {
    profitCustId.value = id;
    profitInitialized = true;
  }
});
const scope = computed(() =>
  custId.value ? customers.value.find((item) => item.value === custId.value)?.label || `客户 #${custId.value}` : "全部客户",
);
const colors = ["#377dff", "#55a6f8", "#26b6b1", "#8b92e8", "#a9b6d6", "#c0c7d2"];
const formatter = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value: number | null | undefined, currency = true) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : `${currency ? "¥" : ""}${formatter.format(Number(value))}`;
const percent = (value: number | null | undefined, signed = false) =>
  value == null ? "—" : `${signed && Number(value) > 0 ? "+" : ""}${(Number(value) * 100).toFixed(1)}%`;
const sign = (value: number | null) => (value == null || Number(value) === 0 ? "" : Number(value) > 0 ? "positive" : "negative");
const currentTrend = computed(() => data.value?.trend.filter((row) => row.year === year.value) || []);
const contributors = computed(() =>
  [...(data.value?.customers || [])]
    .filter((row) => row.change != null)
    .sort((a, b) => Math.abs(Number(b.change)) - Math.abs(Number(a.change)))
    .slice(0, 5),
);
const trendOption = computed(() => ({
  color: [colors[0], "#929fb4", "#ee9c61"],
  tooltip: { trigger: "axis", valueFormatter: (value: number) => money(value) },
  legend: { top: 8, right: 0, itemWidth: 18, data: [`${year.value}年净额`, `${year.value - 1}年净额`, "退货金额"] },
  grid: { top: 55, left: 18, right: 18, bottom: 12, containLabel: true },
  xAxis: { type: "category", boundaryGap: false, data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`) },
  yAxis: {
    type: "value",
    axisLabel: {
      formatter: (value: number) => (Math.abs(value) >= 10000 ? `${Number((value / 10000).toFixed(1))}万` : String(value)),
    },
  },
  series: [
    {
      name: `${year.value}年净额`,
      type: "line",
      symbolSize: 6,
      lineStyle: { width: 3 },
      data: currentTrend.value.map((row) => row.net),
    },
    {
      name: `${year.value - 1}年净额`,
      type: "line",
      symbolSize: 4,
      lineStyle: { type: "dashed", width: 2 },
      data: data.value?.trend.filter((row) => row.year === year.value - 1).map((row) => row.net),
    },
    { name: "退货金额", type: "bar", barMaxWidth: 12, data: currentTrend.value.map((row) => row.returned) },
  ],
}));
const shareOption = computed(() => {
  const rows = (data.value?.customers || []).filter((row) => Number(row.net) > 0);
  const slices = rows.slice(0, 5).map((row) => ({ name: row.name, value: Number(row.net) }));
  if (rows.length > 5) slices.push({ name: "其他客户", value: rows.slice(5).reduce((sum, row) => sum + Number(row.net), 0) });
  return {
    color: colors,
    tooltip: { trigger: "item", valueFormatter: (value: number) => money(value) },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["58%", "84%"],
        center: ["50%", "50%"],
        label: { show: false },
        emphasis: { scale: false },
        data: slices,
      },
    ],
  };
});
let request = 0;
let disposed = false;
function refreshAll() {
  emit("refresh");
  void load();
}
async function load() {
  const id = ++request;
  loading.value = true;
  error.value = false;
  try {
    const response = await getOrderRevenue({
      year: year.value,
      month: month.value,
      ...(custId.value ? { custId: custId.value } : {}),
    });
    if (!disposed && id === request) data.value = response.data;
  } catch {
    if (!disposed && id === request) {
      error.value = true;
      data.value = undefined;
    }
  } finally {
    if (!disposed && id === request) loading.value = false;
  }
}
watch(
  [year, month, custId, view],
  () => {
    data.value = undefined;
    void load();
  },
  { immediate: true },
);
onActivated(() => {
  if (data.value) void load();
});
onBeforeUnmount(() => {
  disposed = true;
  request++;
});
defineExpose({ refresh: load });
</script>

<style scoped lang="scss">
.revenue-overview {
  display: grid;
  gap: 18px;
  min-width: 0;
}
.revenue-toolbar,
.revenue-filters,
.revenue-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.revenue-toolbar h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
}
.view-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--home-text);
  font: inherit;
  font-size: 28px;
  font-weight: 650;
  cursor: pointer;
}
.view-switch .el-icon {
  font-size: 18px;
  color: var(--home-muted);
}
.view-switch:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 4px;
}
.page-name {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--home-muted);
}
.revenue-toolbar p,
.revenue-panel p {
  margin: 7px 0 0;
  color: var(--home-muted);
  font-size: 12px;
  line-height: 1.6;
}
.revenue-filters {
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.year-select {
  width: 108px;
}
.month-select {
  width: 86px;
}
.customer-select {
  width: 170px;
}
.revenue-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  transition: opacity 0.15s;
}
.is-loading {
  opacity: 0.55;
}
.revenue-kpis article {
  min-width: 0;
  padding: 21px 22px;
  border: 1px solid var(--home-line);
  border-radius: 10px;
  background: var(--home-surface);
}
.revenue-kpis article > span {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: space-between;
  color: var(--home-muted);
  font-size: 14px;
}
.revenue-kpis article > strong {
  display: block;
  margin: 15px 0 13px;
  font-size: clamp(21px, 2vw, 30px);
  font-weight: 650;
  letter-spacing: -0.5px;
  overflow-wrap: anywhere;
}
.revenue-kpis small {
  font-size: 11px;
  color: var(--home-muted);
  line-height: 1.6;
}
.comparisons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.comparisons b {
  margin-left: 4px;
  font-weight: 500;
}
.return-kpi > strong {
  color: var(--el-color-warning-dark-2);
}
.positive {
  color: var(--el-color-success-dark-2) !important;
}
.negative {
  color: var(--el-color-danger) !important;
}
.revenue-primary {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(360px, 1fr);
  gap: 18px;
  align-items: start;
}
.revenue-secondary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.revenue-panel {
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  padding: 22px;
  background: var(--home-surface);
  border: 1px solid var(--home-line);
  border-radius: 10px;
}
.revenue-panel h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.revenue-panel > header {
  align-items: start;
  margin-bottom: 10px;
}
.subtle {
  color: var(--home-muted);
  font-size: 12px;
  white-space: nowrap;
}
.customer-donut {
  float: left;
  width: 42%;
  margin: 7px 12px 0 0;
}
.customer-donut :deep(.revenue-chart) {
  height: 218px;
}
.customer-ranking {
  max-height: 285px;
  overflow: auto;
}
.customer-ranking button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--home-line);
  background: transparent;
  text-align: right;
  font: inherit;
  font-size: 12px;
  color: var(--home-text);
  cursor: pointer;
}
.customer-ranking button:hover:not(:disabled),
.customer-ranking button.active {
  color: var(--el-color-primary);
}
.customer-ranking button:disabled {
  cursor: default;
}
.customer-ranking button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
.customer-ranking button > span {
  min-width: 0;
}
.customer-name {
  text-align: left;
  display: flex;
  align-items: center;
  gap: 7px;
}
.customer-name i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.customer-ranking small {
  display: block;
  color: var(--home-muted);
  margin-top: 4px;
}
.customer-ranking em {
  font-style: normal;
  color: var(--el-color-warning-dark-2);
}
.share-note {
  padding: 12px;
  background: var(--home-soft);
  border-radius: 6px;
}
.chart-note,
.revenue-footnote {
  font-size: 11px !important;
  color: var(--home-muted);
  line-height: 1.7;
}
.trend-data {
  margin-top: 8px;
  color: var(--home-muted);
  font-size: 11px;
}
.trend-data summary {
  cursor: pointer;
  width: fit-content;
}
.product-table {
  --el-table-header-bg-color: var(--home-soft);
  margin-top: 16px;
}
.product-table :deep(td.el-table__cell) {
  padding: 4px 0;
}
.product-table :deep(.cell) {
  line-height: 18px;
}
.product-table strong {
  font-weight: 500;
}
.product-table small {
  display: block;
  margin-top: 2px;
  color: var(--home-muted);
  font-size: 11px;
  line-height: 14px;
}
.product-table .missing {
  color: var(--el-color-warning-dark-2);
}
.product-share {
  min-width: 0;
}
.share-track {
  height: 5px;
  width: 100%;
  margin-top: 7px;
  background: var(--home-soft);
  border-radius: 3px;
  overflow: hidden;
}
.share-track i {
  display: block;
  height: 100%;
  background: #377dff;
  border-radius: inherit;
}
.decision-content {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 24px;
  margin-top: 22px;
}
.concentration {
  border-right: 1px solid var(--home-line);
  padding-right: 20px;
}
.concentration > span {
  font-size: 13px;
}
.concentration > strong {
  display: block;
  font-size: 38px;
  font-weight: 650;
  margin: 20px 0 16px;
}
.concentration small {
  display: block;
  font-size: 11px;
  color: var(--home-muted);
  margin-top: 18px;
  line-height: 1.7;
}
.contribution h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}
.contribution > p {
  font-size: 11px;
}
.contribution ul {
  padding: 0;
  margin: 10px 0 0;
  list-style: none;
}
.contribution li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--home-line);
}
.contribution strong {
  font-weight: 500;
  white-space: nowrap;
}
.revenue-footnote {
  margin: 0;
}
@media (max-width: 1200px) {
  .revenue-toolbar {
    align-items: start;
    flex-direction: column;
  }
  .revenue-filters {
    justify-content: flex-start;
  }
  .revenue-primary {
    grid-template-columns: minmax(0, 1.35fr) minmax(310px, 1fr);
  }
  .customer-donut {
    float: none;
    width: 100%;
    margin: 0;
  }
  .customer-donut :deep(.revenue-chart) {
    height: 160px;
  }
  .customer-ranking {
    max-height: 155px;
  }
  .revenue-secondary {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .revenue-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .revenue-kpis article {
    padding: 17px 15px;
  }
  .revenue-kpis article > strong {
    font-size: clamp(15px, 4.4vw, 20px);
    white-space: nowrap;
  }
  .revenue-primary {
    grid-template-columns: 1fr;
  }
  .revenue-panel {
    padding: 17px;
  }
  .customer-donut {
    float: left;
    width: 40%;
  }
  .customer-ranking {
    max-height: 235px;
  }
  .revenue-filters {
    width: 100%;
    gap: 8px;
  }
  .customer-select {
    flex: 1;
    min-width: 125px;
  }
  .revenue-filters :deep(.el-button) {
    width: 100%;
  }
  .decision-content {
    gap: 16px;
  }
  .concentration {
    padding-right: 15px;
  }
  .revenue-toolbar h1,
  .view-switch {
    font-size: 25px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .revenue-kpis {
    transition: none;
  }
}
</style>
