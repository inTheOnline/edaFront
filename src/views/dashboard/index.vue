<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24" color="#409EFF">
            <DataBoard />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalData }}</div>
          <div class="stat-label">数据总量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24" color="#67C23A">
            <TrendCharts />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.analysisCount }}</div>
          <div class="stat-label">分析项目</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24" color="#E6A23C">
            <User />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24" color="#F56C6C">
            <Monitor />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.systemStatus }}%</div>
          <div class="stat-label">系统状态</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>数据趋势分析</h3>
          <el-button-group>
            <el-button size="small" :type="chartPeriod === '7d' ? 'primary' : ''" @click="changePeriod('7d')"> 7天 </el-button>
            <el-button size="small" :type="chartPeriod === '30d' ? 'primary' : ''" @click="changePeriod('30d')"> 30天 </el-button>
            <el-button size="small" :type="chartPeriod === '90d' ? 'primary' : ''" @click="changePeriod('90d')"> 90天 </el-button>
          </el-button-group>
        </div>
        <div class="chart-container">
          <div ref="trendChartRef" class="chart"></div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>数据分布</h3>
        </div>
        <div class="chart-container">
          <div ref="pieChartRef" class="chart"></div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h3>快速操作</h3>
      <div class="action-grid">
        <div class="action-card" @click="goToDataImport">
          <el-icon size="32" color="#409EFF">
            <Upload />
          </el-icon>
          <span>导入数据</span>
        </div>
        <div class="action-card" @click="goToAnalysis">
          <el-icon size="32" color="#67C23A">
            <TrendCharts />
          </el-icon>
          <span>开始分析</span>
        </div>
        <div class="action-card" @click="goToReport">
          <el-icon size="32" color="#E6A23C">
            <Document />
          </el-icon>
          <span>生成报告</span>
        </div>
        <div class="action-card" @click="goToSettings">
          <el-icon size="32" color="#F56C6C">
            <Setting />
          </el-icon>
          <span>系统设置</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import * as echarts from "echarts";

const router = useRouter();

// 统计数据
const stats = ref({
  totalData: "1,234,567",
  analysisCount: 156,
  activeUsers: 89,
  systemStatus: 99.9,
});

// 图表期间
const chartPeriod = ref("7d");

// 图表引用
const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();

// 初始化图表
const initCharts = () => {
  if (trendChartRef.value) {
    const trendChart = echarts.init(trendChartRef.value);
    const trendOption = {
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "数据量",
          type: "line",
          smooth: true,
          data: [120, 132, 101, 134, 90, 230, 210],
          itemStyle: {
            color: "#409EFF",
          },
        },
      ],
    };
    trendChart.setOption(trendOption);
  }

  if (pieChartRef.value) {
    const pieChart = echarts.init(pieChartRef.value);
    const pieOption = {
      tooltip: {
        trigger: "item",
      },
      legend: {
        orient: "vertical",
        left: "left",
      },
      series: [
        {
          name: "数据分布",
          type: "pie",
          radius: "50%",
          data: [
            { value: 1048, name: "结构化数据" },
            { value: 735, name: "半结构化数据" },
            { value: 580, name: "非结构化数据" },
            { value: 484, name: "其他" },
          ],
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
    pieChart.setOption(pieOption);
  }
};

// 改变图表期间
const changePeriod = (period: string) => {
  chartPeriod.value = period;
  // 这里可以根据不同期间加载不同数据
};

// 路由跳转
const goToDataImport = () => {
  router.push("/data/import");
};

const goToAnalysis = () => {
  router.push("/analysis/visualization");
};

const goToReport = () => {
  router.push("/analysis/report");
};

const goToSettings = () => {
  router.push("/system/settings");
};

onMounted(() => {
  nextTick(() => {
    initCharts();
  });
});
</script>

<style scoped lang="scss">
.dashboard {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  background: #f5f7fa;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-2px);
  }
  .stat-icon {
    margin-right: 16px;
  }
  .stat-content {
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  .chart-header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
  .chart-container {
    padding: 20px;
    height: 300px;
    .chart {
      width: 100%;
      height: 100%;
    }
  }
}
.quick-actions {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  h3 {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #303133;
  }
  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }
  .action-card {
    padding: 20px;
    text-align: center;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      border-color: #409eff;
      background: #f0f9ff;
    }

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    span {
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
