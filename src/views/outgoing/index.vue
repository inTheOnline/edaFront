<template>
  <div class="outgoing-dashboard">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="hero-copy__eyebrow">Outgoing Workspace</p>
        <h2>外发模块总览</h2>
        <p>
          这里先作为你新的外发首页。上面看数据走势，右侧放工具入口，下面预留待办区，后面你补接口后我们再把 mock
          数据切掉。
        </p>
      </div>
      <div class="hero-actions">
        <el-card
          v-for="card in statCards"
          :key="card.label"
          class="stat-card"
          shadow="hover"
          :class="`tone-${card.tone}`"
        >
          <p class="stat-card__label">{{ card.label }}</p>
          <strong class="stat-card__value">{{ card.value }}</strong>
          <span class="stat-card__delta">{{ card.delta }}</span>
        </el-card>
      </div>
    </section>

    <section class="content-grid">
      <el-card class="panel panel--trend" shadow="hover">
        <template #header>
          <div class="panel__header">
            <span>近 7 天外发 / 回执趋势</span>
            <el-tag type="info">Mock</el-tag>
          </div>
        </template>
        <div ref="trendChartRef" class="chart-block"></div>
      </el-card>

      <el-card class="panel panel--tools" shadow="hover">
        <template #header>
          <div class="panel__header">
            <span>工具栏</span>
            <small>先只放 1 个工具入口</small>
          </div>
        </template>
        <div class="tool-entry">
          <div class="tool-entry__copy">
            <strong>供应商工具</strong>
            <p>把原工具页收进弹层，后续继续往这里补更多外发工具。</p>
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
            <small>按当前 mock 数据统计</small>
          </div>
        </template>
        <div ref="rankChartRef" class="chart-block chart-block--small"></div>
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

    <ToolPanelDialog ref="toolDialogRef" :activities="activities" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import ToolPanelDialog from "./components/ToolPanelDialog.vue";
import { getDashboardStats, type DashboardStat, type SupplierRank, type ToolActivity, type TrendPoint } from "./mock";

const statCards = ref<DashboardStat[]>([]);
const trendData = ref<TrendPoint[]>([]);
const supplierRanks = ref<SupplierRank[]>([]);
const activities = ref<ToolActivity[]>([]);

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
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 30, right: 24, top: 18, bottom: 45, containLabel: true },
    xAxis: {
      type: "category",
      data: trendData.value.map(item => item.date),
      boundaryGap: false
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "外发数量",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.issueCount),
        lineStyle: { width: 3, color: "#1d4ed8" },
        itemStyle: { color: "#1d4ed8" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(29, 78, 216, 0.28)" },
            { offset: 1, color: "rgba(29, 78, 216, 0.02)" }
          ])
        }
      },
      {
        name: "回执数量",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.receiptCount),
        lineStyle: { width: 3, color: "#0f766e" },
        itemStyle: { color: "#0f766e" }
      }
    ]
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
      data: supplierRanks.value.map(item => item.supName),
      axisTick: { show: false }
    },
    series: [
      {
        type: "bar",
        data: supplierRanks.value.map(item => item.pendingQty),
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 12, 12, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: "#fb7185" },
            { offset: 1, color: "#fdba74" }
          ])
        }
      }
    ]
  });
};

const handleResize = () => {
  trendChart?.resize();
  rankChart?.resize();
};

onMounted(async () => {
  const data = await getDashboardStats();
  statCards.value = data.cards;
  trendData.value = data.trend;
  supplierRanks.value = data.supplierRank;
  activities.value = data.activities;
  await nextTick();
  initTrendChart();
  initRankChart();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  trendChart?.dispose();
  rankChart?.dispose();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.outgoing-dashboard {
  display: grid;
  gap: 20px;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.12), transparent 26%),
    #f6f8fc;
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
