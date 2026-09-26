<template>
  <div class="outgoing-dashboard">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="hero-copy__eyebrow">Outgoing Workspace</p>
        <h2>外发模块总览</h2>
        <p>查看外发、已提交回执及待回执数量，按供应商和料号查询月度或每日趋势。</p>
        <el-button :loading="summaryLoading" @click="loadSummary">刷新总览</el-button>
      </div>
      <div class="hero-actions">
        <el-card v-for="card in statCards" :key="card.label" class="stat-card" shadow="hover" :class="`tone-${card.tone}`">
          <p class="stat-card__label">{{ card.label }}</p>
          <strong class="stat-card__value">{{ formatQty(card.value) }}</strong>
          <span class="stat-card__delta">{{ card.delta }}</span>
        </el-card>
      </div>
    </section>
    <el-alert v-if="summaryError" :title="summaryError" type="error" :closable="false" show-icon />

    <section class="content-grid">
      <el-card class="panel panel--trend" shadow="hover">
        <template #header>
          <div class="panel__header">
            <span>供应商料号外发 / 回执趋势</span>
          </div>
        </template>
        <el-form label-position="top" class="trend-filters" @submit.prevent="loadTrend">
          <el-form-item label="供应商">
            <el-select
              v-model="filters.supId"
              filterable
              clearable
              placeholder="请选择供应商"
              :loading="optionsLoading"
              :disabled="optionsLoading || !!optionsError"
            >
              <el-option v-for="item in suppliers" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="料号 / 品名">
            <el-select-v2
              v-model="filters.materId"
              :options="materials"
              filterable
              clearable
              placeholder="请选择料号"
              :loading="optionsLoading"
              :disabled="optionsLoading || !!optionsError"
            />
          </el-form-item>
          <el-form-item label="统计粒度">
            <el-radio-group v-model="filters.grain">
              <el-radio-button value="month" label="month">按月</el-radio-button>
              <el-radio-button value="day" label="day">按日</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="时间范围（含起止日期）" class="trend-filters__range">
            <el-date-picker
              v-model="filters.range"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
          <el-form-item class="trend-filters__actions">
            <el-button type="primary" native-type="submit" :loading="trendLoading" :disabled="!canQuery">查询</el-button>
            <el-button v-if="optionsError" @click="loadOptions">重试筛选项</el-button>
          </el-form-item>
        </el-form>
        <p class="chart-note">
          供应商与物料按所选时间双向联动，仅列出有有效外发或已提交回执的记录。按月时，首末月只统计所选日期范围。
        </p>
        <el-alert
          v-if="optionsError || trendError"
          :title="optionsError || trendError"
          type="error"
          :closable="false"
          show-icon
        />
        <div v-loading="trendLoading" class="trend-chart-wrap">
          <div
            v-show="hasTrend"
            ref="trendChartRef"
            class="chart-block"
            role="img"
            aria-label="外发数量与已提交回执数量折线图"
          ></div>
          <el-empty
            v-if="!hasTrend"
            :description="trendQueried ? '所选范围暂无外发或已提交回执' : '选择供应商、料号和日期后查询'"
          />
        </div>
        <el-collapse v-if="hasTrend">
          <el-collapse-item title="查看统计明细" name="data">
            <el-table :data="trendData" max-height="300">
              <el-table-column prop="date" label="日期" />
              <el-table-column prop="issueCount" label="外发数量" />
              <el-table-column prop="receiptCount" label="回执数量" />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <el-card class="panel panel--tools" shadow="hover">
        <template #header>
          <div class="panel__header">
            <span>工具栏</span>
          </div>
        </template>
        <div class="tool-entry">
          <div class="tool-entry__copy">
            <strong>供应商工具</strong>
            <p>供应商扣款处理、扣款模板下载及供应商报价导入。</p>
          </div>
          <el-button type="primary" @click="openTools">打开工具</el-button>
        </div>

        <div class="tool-entry tool-entry--ghost">
          <div class="tool-entry__copy">
            <strong>更多工具位</strong>
            <p>这里先留空，等你后面继续扩。</p>
          </div>
          <el-tag type="info">预留</el-tag>
        </div>
      </el-card>

      <el-card class="panel panel--rank" shadow="hover">
        <template #header>
          <div class="panel__header">
            <span>供应商待回执排行</span>
            <small>全部有效外发，按未回数量取前 8 名</small>
          </div>
        </template>
        <div v-loading="summaryLoading">
          <div v-show="supplierRanks.length" ref="rankChartRef" class="chart-block chart-block--small"></div>
          <el-empty v-if="!supplierRanks.length" :description="summaryError ? '总览加载失败，请重试' : '暂无待回执记录'" />
        </div>
      </el-card>

      <el-card class="panel panel--todo" shadow="hover">
        <template #header>
          <div class="panel__header">
            <span>待办区</span>
            <el-tag type="warning">预留</el-tag>
          </div>
        </template>
        <div class="todo-placeholder">
          <h3>待办逻辑后面再接</h3>
          <p>这里我先只给你留位置，等你确定待办来源、状态流转和提醒方式后，再把代码补完整。</p>
        </div>
      </el-card>
    </section>

    <ToolPanelDialog ref="toolDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import ToolPanelDialog from "./components/ToolPanelDialog.vue";
import { getHomeSummary, getHomeTrend, getHomeOptions, type HomeSummary, type TrendPoint, type HomeOption } from "./home";

const summary = ref<HomeSummary>();
const summaryLoading = ref(false);
const summaryError = ref("");
const trendLoading = ref(false);
const trendError = ref("");
const trendQueried = ref(false);
const trendData = ref<TrendPoint[]>([]);
const supplierRanks = computed(() => summary.value?.supplierRank || []);
const formatQty = (value?: number) => (value == null ? "—" : Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 4 }));
const statCards = computed(() => [
  { label: "本月外发数量", value: summary.value?.monthIssueQty, delta: summary.value?.month || "", tone: "blue" },
  { label: "本月回执数量", value: summary.value?.monthReceiptQty, delta: "仅已提交回执", tone: "green" },
  { label: "待回执数量", value: summary.value?.pendingQty, delta: "全部有效外发，逐条扣除已提交回执", tone: "orange" },
  { label: "活跃供应商", value: summary.value?.supplierCount, delta: "本月有有效外发记录", tone: "red" },
]);
const optionsLoading = ref(false);
const optionsError = ref("");
const suppliers = ref<HomeOption[]>([]);
const materials = ref<HomeOption[]>([]);
const filters = reactive({
  supId: undefined as string | number | undefined,
  materId: undefined as string | number | undefined,
  grain: "month" as "month" | "day",
  range: [dayjs().subtract(11, "month").startOf("month").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] as
    | string[]
    | undefined,
});
const canQuery = computed(
  () => !optionsLoading.value && !optionsError.value && !!filters.supId && !!filters.materId && filters.range?.length === 2,
);
const hasTrend = computed(() => trendData.value.some((item) => item.issueCount !== 0 || item.receiptCount !== 0));
let trendRequest = 0;
let optionsRequest = 0;
let disposed = false;

const rangeError = computed(() => {
  if (filters.range?.length !== 2) return "请先选择时间范围";
  const [start, end] = filters.range;
  if (!dayjs(start).isValid() || !dayjs(end).isValid() || start > end) return "请选择有效的起止日期";
  const span =
    filters.grain === "month"
      ? dayjs(end).startOf("month").diff(dayjs(start).startOf("month"), "month")
      : dayjs(end).diff(dayjs(start), "day");
  return span >= (filters.grain === "month" ? 120 : 366)
    ? filters.grain === "month"
      ? "按月最多查询120个月，请调整日期"
      : "按日最多查询366天，请调整日期"
    : "";
});

const loadOptions = async () => {
  const request = ++optionsRequest;
  optionsError.value = rangeError.value;
  if (rangeError.value || !filters.range) {
    suppliers.value = [];
    materials.value = [];
    optionsLoading.value = false;
    return;
  }
  optionsLoading.value = true;
  try {
    const { data } = await getHomeOptions({
      startDate: filters.range[0],
      endDate: filters.range[1],
      grain: filters.grain,
      supId: filters.supId ? Number(filters.supId) : undefined,
      materId: filters.materId ? Number(filters.materId) : undefined,
    });
    if (disposed || request !== optionsRequest) return;
    suppliers.value = data.suppliers;
    materials.value = data.materials.map((item) => ({ ...item, label: `${item.num || ""} ${item.label}`.trim() }));
    // 日期变化后清除已失效的选择，随后按剩余条件重新加载候选项。
    if (filters.supId && !data.suppliers.some((item) => String(item.value) === String(filters.supId))) filters.supId = undefined;
    if (filters.materId && !data.materials.some((item) => String(item.value) === String(filters.materId)))
      filters.materId = undefined;
  } catch {
    if (request === optionsRequest) {
      suppliers.value = [];
      materials.value = [];
      optionsError.value = "供应商或料号加载失败，请重试";
    }
  } finally {
    if (request === optionsRequest) optionsLoading.value = false;
  }
};

const loadSummary = async () => {
  if (summaryLoading.value) return;
  summaryLoading.value = true;
  summaryError.value = "";
  try {
    const { data } = await getHomeSummary();
    if (disposed) return;
    summary.value = data;
    await nextTick();
    initRankChart();
    rankChart?.resize();
  } catch {
    summary.value = undefined;
    summaryError.value = "总览加载失败，请点击刷新总览重试";
  } finally {
    summaryLoading.value = false;
  }
};

watch(filters, () => {
  // 筛选变化时丢弃旧响应，避免旧图表被误认为新条件的结果。
  trendRequest++;
  trendData.value = [];
  trendQueried.value = false;
  trendError.value = "";
  trendLoading.value = false;
  void loadOptions();
});

const loadTrend = async () => {
  if (!canQuery.value || !filters.range) return;
  const [startDate, endDate] = filters.range;
  if (rangeError.value) {
    trendError.value = rangeError.value;
    return;
  }
  const request = ++trendRequest;
  trendLoading.value = true;
  trendError.value = "";
  trendData.value = [];
  trendQueried.value = false;
  try {
    const { data } = await getHomeTrend({
      supId: Number(filters.supId),
      materId: Number(filters.materId),
      grain: filters.grain,
      startDate,
      endDate,
    });
    if (disposed || request !== trendRequest) return;
    trendData.value = data;
    trendQueried.value = true;
    await nextTick();
    if (hasTrend.value) {
      initTrendChart();
      trendChart?.resize();
    }
  } catch {
    if (request === trendRequest) trendError.value = "趋势加载失败，请重试";
  } finally {
    if (request === trendRequest) trendLoading.value = false;
  }
};

const toolDialogRef = ref<InstanceType<typeof ToolPanelDialog> | null>(null);
const trendChartRef = ref<HTMLElement>();
const rankChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let rankChart: echarts.ECharts | null = null;

const openTools = () => {
  toolDialogRef.value?.open();
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);

  trendChart.setOption({
    aria: { enabled: true },
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 30, right: 24, top: 18, bottom: 45, containLabel: true },
    xAxis: {
      type: "category",
      data: trendData.value.map((item) => item.date),
      boundaryGap: false,
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "外发数量",
        type: "line",
        smooth: false,
        data: trendData.value.map((item) => item.issueCount),
        lineStyle: { width: 3, color: "#1d4ed8" },
        itemStyle: { color: "#1d4ed8" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(29, 78, 216, 0.28)" },
            { offset: 1, color: "rgba(29, 78, 216, 0.02)" },
          ]),
        },
      },
      {
        name: "回执数量",
        type: "line",
        smooth: false,
        data: trendData.value.map((item) => item.receiptCount),
        symbol: "rect",
        lineStyle: { width: 3, color: "#0f766e", type: "dashed" },
        itemStyle: { color: "#0f766e" },
      },
    ],
  });
};

const initRankChart = () => {
  if (!rankChartRef.value) return;
  if (!rankChart) rankChart = echarts.init(rankChartRef.value);

  rankChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 12, right: 18, top: 12, bottom: 0, containLabel: true },
    xAxis: { type: "value" },
    yAxis: {
      type: "category",
      data: supplierRanks.value.map((item) => item.supName),
      inverse: true,
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: supplierRanks.value.map((item) => item.pendingQty),
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 12, 12, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: "#fb7185" },
            { offset: 1, color: "#fdba74" },
          ]),
        },
      },
    ],
  });
};

const handleResize = () => {
  trendChart?.resize();
  rankChart?.resize();
};

let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  void loadOptions();
  void loadSummary();
  resizeObserver = new ResizeObserver(handleResize);
  if (trendChartRef.value) resizeObserver.observe(trendChartRef.value);
  if (rankChartRef.value) resizeObserver.observe(rankChartRef.value);
});

onBeforeUnmount(() => {
  disposed = true;
  trendRequest++;
  optionsRequest++;
  resizeObserver?.disconnect();
  trendChart?.dispose();
  rankChart?.dispose();
});
</script>

<style scoped lang="scss">
.trend-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
  padding-top: 16px;

  :deep(.el-select),
  :deep(.el-select-v2),
  :deep(.el-date-editor) {
    width: 100%;
    min-width: 0;
  }

  &__range {
    grid-column: 1 / -1;
  }
  &__actions {
    align-self: end;
  }
}
.chart-note {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}
.trend-chart-wrap {
  min-height: 260px;
}
.panel {
  min-width: 0;
}
@media (max-width: 600px) {
  .trend-filters {
    grid-template-columns: 1fr;
  }
}

.outgoing-dashboard {
  display: grid;
  gap: 20px;
  padding: 20px;
  background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.12), transparent 26%), #f6f8fc;
  min-height: calc(100vh - 110px);
}

.hero-section {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #10233d 0%, #1f4b78 48%, #f97316 140%);
  color: #fff;
}

.hero-copy {
  display: grid;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 34px;
    letter-spacing: 1px;
  }

  p {
    max-width: 640px;
    margin: 0;
    color: rgba(255, 255, 255, 0.86);
    line-height: 1.75;
  }

  &__eyebrow {
    color: rgba(255, 255, 255, 0.65);
    text-transform: uppercase;
    letter-spacing: 0.3em;
    font-size: 12px;
  }
}

.hero-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  border: 0;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);

  :deep(.el-card__body) {
    display: grid;
    gap: 8px;
  }

  &__label {
    margin: 0;
    color: rgba(255, 255, 255, 0.72);
  }

  &__value {
    font-size: 30px;
    line-height: 1;
  }

  &__delta {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 20px;
}

.panel {
  border-radius: 20px;

  :deep(.el-card__header) {
    padding: 18px 22px;
  }

  :deep(.el-card__body) {
    padding: 0 22px 22px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    small {
      color: #909399;
    }
  }

  &--trend,
  &--rank {
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  }

  &--todo {
    background: linear-gradient(180deg, #fffaf3 0%, #ffffff 100%);
  }
}

.chart-block {
  height: 320px;
  width: 100%;

  &--small {
    height: 300px;
  }
}

.tool-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e5edf7;
  margin-bottom: 16px;

  &--ghost {
    margin-bottom: 0;
    border-style: dashed;
    background: #fff;
  }

  &__copy {
    display: grid;
    gap: 6px;

    p {
      margin: 0;
      color: #606266;
      line-height: 1.6;
    }
  }
}

.todo-placeholder {
  display: grid;
  place-items: center;
  min-height: 300px;
  border: 1px dashed #f5c97b;
  border-radius: 18px;
  background: repeating-linear-gradient(
    -45deg,
    rgba(249, 115, 22, 0.05),
    rgba(249, 115, 22, 0.05) 12px,
    rgba(255, 255, 255, 0.6) 12px,
    rgba(255, 255, 255, 0.6) 24px
  );
  text-align: center;
  padding: 24px;

  h3 {
    margin: 0 0 12px;
    font-size: 24px;
    color: #9a3412;
  }

  p {
    max-width: 420px;
    margin: 0;
    color: #7c5b2b;
    line-height: 1.7;
  }
}

@media (max-width: 1200px) {
  .hero-section,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .outgoing-dashboard {
    padding: 14px;
  }

  .hero-section {
    padding: 20px;
  }

  .hero-actions {
    grid-template-columns: 1fr;
  }

  .tool-entry {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
