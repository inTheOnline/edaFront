<template>
  <div class="godown-container">
    <!-- 顶部筛选栏 -->
    <div class="filter-section">
      <el-card shadow="hover">
        <div class="filter-row">
          <div class="filter-item">
            <span class="filter-label">产品筛选：</span>
            <el-select
              v-model="selectedMaterId"
              placeholder="请选择产品（支持搜索料号/名称）"
              style="width: 300px"
              clearable
              filterable
              :filter-method="filterMater"
              @change="handleMaterChange"
            >
              <el-option v-for="item in filteredMaterList" :key="item.value" :label="item.label" :value="item.value">
                <span class="mater-option">
                  <span class="mater-num">{{ item.num || item.materNum }}</span>
                  <span class="mater-name">{{ item.label }}</span>
                </span>
              </el-option>
            </el-select>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <template #header>
          <div class="stat-header">
            <el-icon color="#409EFF" :size="24"><Goods /></el-icon>
            <span>入库数量</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.inCount }}</div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <template #header>
          <div class="stat-header">
            <el-icon color="#67C23A" :size="24"><DArrowRight /></el-icon>
            <span>出库数量</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.outCount }}</div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <template #header>
          <div class="stat-header">
            <el-icon color="#E6A23C" :size="24"><Box /></el-icon>
            <span>库存总量</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.totalStock }}</div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <template #header>
          <div class="stat-header">
            <el-icon color="#F56C6C" :size="24"><Document /></el-icon>
            <span>物料种类</span>
          </div>
        </template>
        <div class="stat-value">{{ stats.materTypes }}</div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="chart-header">
            <span>仓库出入库趋势</span>
            <el-radio-group v-model="chartPeriod" size="small">
              <el-radio-button label="7d">7天</el-radio-button>
              <el-radio-button label="30d">30天</el-radio-button>
              <el-radio-button label="90d">90天</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="trendChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="chart-header">
            <span>物料库存分布</span>
          </div>
        </template>
        <div ref="pieChartRef" class="chart"></div>
      </el-card>
    </div>

    <!-- 原有批量添加区域 -->
    <div class="batch-section">
      <el-button type="primary" @click="openDialog">打开批量添加</el-button>
      <BatchAddDialog
        ref="dialogRef"
        title="批量添加委外记录"
        :columns="tableColumns"
        :submit-api="submitBatchApi"
        :item-selector-config="itemSelectorConfig"
        :item-selector-list="filteredLocalList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import { Goods, DArrowRight, Box, Document } from "@element-plus/icons-vue";
import BatchAddDialog from "@/components/My/BatchAddDialog/index.vue";
import { getOrderItem } from "@/api/modules/order";
import { addBatchApi } from "@/api/modules/orderOut";
import { useAuthStore } from "@/stores/modules/auth";
import { useDictStore } from "@/stores/modules/dict";
import { getFlow } from "@/api/modules/godown/flow";

const authStore = useAuthStore();
const dictStore = useDictStore();
const defineCustId = authStore.defaultInfoGet.custId;

const dialogRef = ref();

// 产品筛选相关
const selectedMaterId = ref<number | null>(null);
const allMaterList = computed(() => dictStore.dictMap["mater"] || []);
const filteredMaterList = ref(allMaterList.value);

// 筛选产品列表（支持搜索）
const filterMater = (query: string) => {
  if (!query) {
    filteredMaterList.value = allMaterList.value;
  } else {
    const lowerQuery = query.toLowerCase();
    filteredMaterList.value = allMaterList.value.filter(
      (item) =>
        (item.num && item.num.toLowerCase().includes(lowerQuery)) ||
        (item.label && item.label.toLowerCase().includes(lowerQuery)),
    );
  }
};

// 产品变更处理
const handleMaterChange = (materId: number | null) => {
  // 重新获取数据
  fetchStatsData();
  initTrendChart();
};

// 统计数据
const stats = reactive({
  inCount: 0,
  outCount: 0,
  totalStock: 0,
  materTypes: 0,
});

// 图表期间
const chartPeriod = ref("7d");
const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

// 🔥 原始测试列表
const testLocalList = ref([
  {
    id: 1,
    orderId: 1,
    custId: 3,
    exampleOne: "哇哈哈哈",
    example: "测试数据1",
    orderNum: "DD202604001",
    materNum: "WL001",
    materName: "原材料A",
    notAlreadyNumber: 100,
  },
  {
    id: 2,
    orderId: 2,
    custId: 3,
    exampleOne: "测试数据2",
    example: "测试数据2",
    orderNum: "DD202604002",
    materNum: "WL002",
    materName: "半成品B",
    notAlreadyNumber: 50,
  },
  {
    id: 3,
    orderId: 3,
    custId: 1001,
    exampleOne: "测试数据3",
    example: "测试数据3",
    orderNum: "DD202604003",
    materNum: "WL003",
    materName: "成品C",
    notAlreadyNumber: 30,
  },
]);

const filteredLocalList = computed(() => {
  if (!defineCustId) return testLocalList.value;
  return testLocalList.value.filter((item) => item.custId === defineCustId);
});

// 表头配置
const tableColumns = [
  { prop: "orderId" },
  {
    prop: "date",
    label: "委外日期",
    type: "date",
    position: "top",
    required: true,
  },
  {
    prop: "sendCode",
    label: "委外单号",
    type: "input",
    position: "top",
    required: true,
  },
  {
    label: "委外信息",
    type: "mode",
    position: "table",
    default: "withOrder",
    minWidth: "460px",
    required: true,
    modes: [
      {
        value: "withOrder",
        label: "有委外单",
        fields: [
          { prop: "orderNum", placeholder: "委外单号" },
          { prop: "materName", placeholder: "物料信息" },
        ],
      },
      {
        value: "withoutOrder",
        label: "无委外单",
        fields: [{ prop: "materSelect", placeholder: "请选择产品" }],
      },
    ],
  },
  {
    prop: "number",
    label: "送货数量",
    type: "number",
    position: "table",
    minWidth: "120px",
    required: true,
    default: 1,
  },
  { prop: "example", label: "例子", type: "input", position: "table", minWidth: "120px", required: true },
  { prop: "exampleOne", label: "例子1", type: "input", position: "table", minWidth: "120px", required: true, default: "默认值" },
  { prop: "remark", label: "备注", type: "input", position: "table", minWidth: "180px", required: true },
];

const itemSelectorConfig = {
  title: "选择订单条目",
  searchPlaceholder: "产品名称/编号/订单号",
  rowKey: "id",
  selectEnableField: "notAlreadyNumber",
  columns: [
    { prop: "orderId", label: "订单号", width: 200, isShow: false },
    { prop: "exampleOne", label: "例子1", width: 200 },
    { prop: "example", label: "例子", width: 200 },
    { prop: "orderNum", label: "订单号", width: 200 },
    { prop: "materNum", label: "产品编号", width: 160 },
    { prop: "materName", label: "产品名称", minWidth: 220 },
    { prop: "notAlreadyNumber", label: "可开单数量", width: 140 },
  ],
};

// 方法
const openDialog = () => {
  dialogRef.value.open({
    materList: [
      { value: 1, label: "物料001" },
      { value: 2, label: "物料002" },
    ],
    refresh: () => console.log("刷新列表"),
  });
};

const submitBatchApi = (formData) => {
  return addBatchApi(formData.records);
};

// 获取统计数据（支持按产品筛选）
const fetchStatsData = async () => {
  try {
    const params: any = { pageNum: 1, pageSize: 1 };
    if (selectedMaterId.value) {
      params.materId = selectedMaterId.value;
    }
    const res = await getFlow(params);
    if (res.records && res.records.length > 0) {
      const record = res.records[0];
      stats.inCount = record.inCount || 0;
      stats.outCount = record.outCount || 0;
      stats.totalStock = record.totalStock || 0;
      stats.materTypes = record.materTypes || 0;
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
  }
};

// 模拟不同周期的趋势数据（支持产品筛选）
const getTrendDataByPeriod = (period: string) => {
  const baseDataMap: Record<string, { xAxis: string[]; inData: number[]; outData: number[] }> = {
    "7d": {
      xAxis: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      inData: [120, 132, 101, 134, 90, 230, 210],
      outData: [220, 182, 191, 234, 290, 330, 310],
    },
    "30d": {
      xAxis: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
      inData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200) + 50),
      outData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 300) + 100),
    },
    "90d": {
      xAxis: Array.from({ length: 12 }, (_, i) => `${i + 1}周`),
      inData: [820, 932, 901, 934, 1290, 1330, 1320, 1500, 1600, 1550, 1700, 1800],
      outData: [1220, 1432, 1401, 1534, 1990, 2030, 2020, 2200, 2300, 2250, 2400, 2500],
    },
  };

  const base = baseDataMap[period] || baseDataMap["7d"];

  // 如果选择了特定产品，模拟数据按产品缩放
  if (selectedMaterId.value) {
    const multiplier = (selectedMaterId.value % 5) * 0.2 + 0.5; // 0.5~1.3倍
    return {
      xAxis: base.xAxis,
      inData: base.inData.map((v) => Math.floor(v * multiplier)),
      outData: base.outData.map((v) => Math.floor(v * multiplier)),
    };
  }

  return base;
};

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return;

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }

  const { xAxis: xData, inData, outData } = getTrendDataByPeriod(chartPeriod.value);

  const option = {
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: xData },
    yAxis: { type: "value" },
    series: [
      {
        name: "入库",
        type: "line",
        smooth: true,
        data: inData,
        itemStyle: { color: "#409EFF" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(64, 158, 255, 0.3)" },
            { offset: 1, color: "rgba(64, 158, 255, 0.05)" },
          ]),
        },
      },
      {
        name: "出库",
        type: "line",
        smooth: true,
        data: outData,
        itemStyle: { color: "#67C23A" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(103, 194, 58, 0.3)" },
            { offset: 1, color: "rgba(103, 194, 58, 0.05)" },
          ]),
        },
      },
    ],
  };

  trendChart.setOption(option);
};

// 初始化饼图（支持产品筛选）
const initPieChart = () => {
  if (!pieChartRef.value) return;

  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value);
  }

  // 根据是否选择产品，调整饼图数据
  let pieData = [
    { value: 1048, name: "原材料" },
    { value: 735, name: "半成品" },
    { value: 580, name: "成品" },
    { value: 484, name: "其他" },
  ];

  if (selectedMaterId.value) {
    // 选中产品时，只显示该产品的占比（模拟）
    const materName = allMaterList.value.find((m) => m.value === selectedMaterId.value)?.label || "选中产品";
    pieData = [{ value: 100, name: materName }];
  }

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "库存分布",
        type: "pie",
        radius: "60%",
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  pieChart.setOption(option);
};

// 窗口大小变化时重绘图表
const handleResize = () => {
  trendChart?.resize();
  pieChart?.resize();
};

// 监听周期变化
watch(chartPeriod, () => {
  // 根据周期重新加载数据
  initTrendChart();
});

onMounted(async () => {
  await dictStore.loadDicts(["mater"]);
  filteredMaterList.value = allMaterList.value;
  await fetchStatsData();
  await nextTick();
  initTrendChart();
  initPieChart();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  trendChart?.dispose();
  pieChart?.dispose();
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.godown-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

// 筛选区域样式
.filter-section {
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    padding: 8px 0;

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .filter-label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
      }
    }
  }
}

// 统计卡片样式
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
    background: #fafafa;
  }

  .stat-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    font-size: 15px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #303133;
    font-variant-numeric: tabular-nums;
  }
}

// 图表区域样式
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  :deep(.el-card__body) {
    padding: 0;
  }

  .chart-header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
  }

  .chart {
    height: 400px;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
  }
}

// 批量添加区域
.batch-section {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

// 物料下拉选项样式
:deep(.mater-option) {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .mater-num {
    font-size: 12px;
    color: #909399;
  }

  .mater-name {
    font-size: 14px;
    color: #303133;
  }
}
</style>
