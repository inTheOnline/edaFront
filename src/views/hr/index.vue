<template>
  <div class="hr-container">
    <n-card title="人事主页">
      <!-- 分割线 -->
      <!-- <n-divider class="fen"/> -->
      <n-row class="count">
        <n-col :span="12">
          <n-statistic label="在职员工" :value="job[0]" >
            <template #prefix>
              <el-icon class="icon"><User /></el-icon>
            </template>
            <template #suffix>
              / {{ job[1]}}
            </template>
          </n-statistic>
        </n-col>
        <n-col :span="12">
          <n-statistic label="正在招聘岗位">
            4个
          </n-statistic>
        </n-col>
      </n-row>
    </n-card>
    <div class="chartGrid">
      <n-card class="echarts-pie"  v-if="dataLoaded">
        <PieChart :option="departOptions" />
      </n-card>
      <n-card class="echarts-pie" v-if="ageDataLoaded">
        <PieChart :option="ageOptions" />
      </n-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import PieChart from "@/components/ECharts/index.vue"
import {getDepartNumber,getAgeNumber,getNumber} from "@/api/modules/hr"
import {ref,onMounted,reactive} from "vue"
import { j } from "vite/dist/node/types.d-aGj9QkWt";
const data = ref([]);
const dataLoaded = ref(false);
const ageData = ref([]);
const ageDataLoaded = ref(false);
let job = ref([0,0]);
//挂载完成
onMounted(async () => {
  data.value = (await getDepartNumber()).data;
  ageData.value =(await getAgeNumber()).data;
  job.value = (await getNumber()).data;
  console.log(job.value);
  
  dataLoaded.value = true;
  ageDataLoaded.value = true;
  departOptions.series[0].data = data.value;
  ageOptions.series[0].data = ageData.value;
});
const departOptions =reactive({
  title: { text: '部门人员占比',left: 'center'},
  tooltip: { 
    trigger: 'item',
  },
  legend: {
    top: '8%',
    left: 'left',
    orient: 'vertical'
  },
  series: [
    {
      type: 'pie',
      radius: ["40%","80%"], // 内半径50%（空心），外半径70%
      // radius: '50%',
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 30,
          fontWeight: 'bold'
        }
      },
      // center: ['50%', '50%'],
      // roseType: 'area',
      itemStyle: {
        borderRadius: 2,
        show: false
      },
      data: []
    }
  ],
});
const ageOptions = reactive({
  title: { text: '人员年龄构成' ,left: 'center'},
  tooltip: { 
    trigger: 'item',
    formatter: '{c}人  ({d}%)' // 格式化提示框，显示单位
  },
  legend: {
    top: '8%',
    left: 'left',
    orient: 'vertical'
  },
  series: [
    {
      type: 'pie',
      radius: '80%',
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      // center: ['50%', '50%'],
      // roseType: 'area',
      itemStyle: {
        borderRadius: 2,
        show: false
      },
      data: []
    }
  ],
});
</script>
<style lang="scss">
.hr-container {
    font-size: 20px;
}
.n-card__title{
  display: flex;
  justify-content: var(--title-align);
  align-items: center;
  height: 100%;
}
.count{
  margin-top: -5px;
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
  height: 600px; /* 高度设为固定值 */
}
</style>
