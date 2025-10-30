<template>
  <div class="order-container">
    <div class="cards">
      <!-- 第一部分四个彩色块块 -->
      <el-card 
        v-for="(data, index) in firstDatas" 
        :key="index" 
        class="firstCard Card" 
        :class="`inFirst${index + 1}`" 
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <span>{{ data.title }}</span>
          </div>
        </template>
        <p class="text item">5201,314</p>
        <template #footer>较上月 ↗2%</template>
      </el-card>
      <!-- 第二部分两个白色块块 -->
      <el-card 
        v-for="(data, index) in secondDatas" 
        :key="index" 
        class="secondCard Card" 
        :class="`inFirst${index + 1}`" 
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <span>订单概况</span>
          </div>
        </template>
        <p class="text item">正文部分</p>
      </el-card>
      <!-- 第三部分一个大的统计表 -->
      <el-card 
        class="thirdCard Card" 
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <span>营业额趋势图</span>
          </div>
        </template>
        <p class="text item"  v-if="ready">
          <PieChart class="chart" :option="thirdCardOptions" />
        </p>
      </el-card>
      <!-- 第四部分两个白色统计图 -->
      <el-card 
        v-for="(data, index) in secondChart" 
        :key="index" 
        class="forthCard Card" 
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <span>{{ data.title }}</span>
          </div>
        </template>
        <p class="text item">正文部分</p>
      </el-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import PieChart from "@/components/ECharts/index.vue"
import { ref, reactive,onMounted,nextTick } from "vue";
import {getBusiness } from "@/api/modules/echarts"
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
let firstDatas = [{title:"本月新单"},{title:"本月营业额"},{title:"本月客诉"},{title:"本月退货"}];
let secondDatas = [1,2];
let secondChart = [{title:"客户订单排名"},{title:"​产品类别分布图"}];
let thirdCardOptions = ref();
let ready = ref(false)
onMounted(async() => {
  // dictStore.loadDicts(['cust'])
  // console.log(dictStore.loadDict('cust'));
  thirdCardOptions.value = await getBusiness()
  await nextTick()
  setTimeout(() => {
    ready.value = true
  }, 100) // 或者用 100ms 保险一点
})
</script>
<style lang="scss">
/* 方法1A：全局移除所有卡片分隔线 */
  .order-container {
    font-size: 20px;
  }
  .order-container .cards{
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 25px 20px; /* 行间隙为10px，列间隙为20px */
  }
  // 所有卡片统一样式
  .Card{
    border-radius: 15px;
    // cursor: pointer; /* 将鼠标变为手型指针 */
  }
  .firstCard{
    color: #fff;
    &.inFirst1{
      background: linear-gradient(45deg, #56CCF2, #D8F0FF);
    }
    &.inFirst2{
      // C5ED9A c8eda0
      background: linear-gradient(45deg, #52C234, #cef0a9);
    }
    &.inFirst3{
      background: linear-gradient(45deg, #FF7E5F, #FFD9C9);
    }
    &.inFirst4{
      background: linear-gradient(45deg, #A18CD1, #F0E1FF);
    }
    .text{
      font-size: 35px;
      font-weight: bold; /* 加粗 */
      font-variant-numeric: tabular-nums;
      letter-spacing: 1.5px;
      padding: 10px;
      margin: 0px 0;
    }
  }
  .secondCard{
    grid-column: span 2; /* 横跨2列 */
  }
  .thirdCard{
    grid-column: span 4; /* 横跨4列 */
    height: 800px;
    .card-header{
      font-size:24px;
      font-weight: bold; /* 加粗 */
    }
    .chart{
     height: 700px !important;
    }
  }
  .forthCard{
    grid-column: span 2; /* 横跨2列 */
    .card-header{
      font-size:23px;
      font-weight: bold; /* 加粗 */
    }
  }
</style>
