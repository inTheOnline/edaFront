<template>
  <div>
    <!-- <n-button>naive-ui</n-button> -->
    <n-card title="采购统计">
      <!-- 分割线 -->
      <n-divider class="fen"/>
      <n-row>
        <n-col :span="12">
          <n-statistic label="本月采购" :value="99">
            <template #prefix>
              <el-icon class="icon"><ShoppingBag /></el-icon>
            </template>
            <template #suffix>
              / 100
            </template>
          </n-statistic>
        </n-col>
        <n-col :span="12">
          <n-statistic label="累计采购">
            1,234,123
          </n-statistic>
        </n-col>
      </n-row>
    </n-card>
    <div class="chartGrid">
      <n-card class="echarts-pie">
        <PieChart :option="moneyOptions" />
      </n-card>
      <n-card class="echarts-pie">
        <PieChart :option="departmentOptions" />
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { NButton } from 'naive-ui'
import PieChart from "@/components/ECharts/index.vue"
//改成后台数据
//配置项
const moneyOptions ={
  title: { text: '类别占比' },
  tooltip: { 
    trigger: 'item',
    formatter: '{b}: {c}元({d}%)' // 格式化提示框，显示单位
  },
  series: [
    {
      type: 'pie',
      radius: [30, 200], // 内半径50%（空心），外半径70%
      // center: ['50%', '50%'],
      roseType: 'area',
      itemStyle: {
        borderRadius: 8
      },
      data: [
        { value: 40, name: '办公用品' },
        { value: 38, name: '电子用品' },
        { value: 32, name: '机台设备' },
        { value: 30, name: '消耗品' },
        { value: 28, name: '表单' },
        { value: 26, name: '固定资产维修费' },
        { value: 22, name: '厂房租金' },
        { value: 18, name: '其他' }
      ]
    },
  ],
};
const departmentOptions ={
  title: { text: '部门占比' },
  tooltip: { 
    trigger: 'item',
    formatter: '{b}: {c}元({d}%)' // 格式化提示框，显示单位
  },
  series: [
    {
      type: 'pie',
      radius: [30, 200], // 内半径50%（空心），外半径70%
      // center: ['50%', '50%'],
      roseType: 'area',
      itemStyle: {
        borderRadius: 8
      },
      data: [
        { value: 10, name: '生产部' },
        { value: 32, name: '工程部' },
        { value: 32, name: '模具部' },
        { value: 30, name: '包装部' },
        { value: 28, name: '品质部' },
        { value: 26, name: '仓储物流部' },
        { value: 22, name: '办公室' },
        { value: 18, name: '部门通用' }
      ]
    },
  ],
};
</script>

<style scoped>
.fen{
  margin-top: -10px;
}
.icon{
  transform: translateY(3px);
}
.chartGrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 两列等宽 */
  gap: 16px; /* 可选：设置间距 */
}
.echarts-pie {
  border-radius:3px;
  width: 100%; /* 宽度设为 100% */
  height: 500px; /* 高度设为固定值 */
}
</style>
