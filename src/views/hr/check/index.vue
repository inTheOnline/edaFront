<template>
  <div class="work-container">
    <div>
      <el-card class="title">
          深圳市意达五金制品有限公司考勤表
          <el-divider />
          <div class="buttons">
            <el-button @click="toDetail(but)" class="button" v-for="(but,index) in data" :key="index" color="#008c8c" :dark="true">{{ but }}考勤表</el-button>
          </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ref, reactive,onMounted,onBeforeMount } from "vue";
import { getMonths } from "@/api/modules/hr";
import { ElMessage, ElMessageBox,ElCard,ElDivider} from "element-plus";
//初始化
const data = ref()
onBeforeMount(async()=>{
  const result = await getMonths();
  data.value=result.data
})
const router = useRouter();
const toDetail=(but)=>{
  //传入参数
  router.push('/hr/check/detail?year='+but.split('.')[0]+'&month='+but.split('.')[1]);
}
</script>

<style lang="scss" scoped>
.buttons{
  display: grid;
  grid-template-columns: auto auto auto;
  row-gap: 100px;
  column-gap: 200px;
}
.button{
  font-size: 30px;
  padding: 20px;
}
.title{
  text-align: center;
  font-size: 23px;
  font-weight: 700;
  color: var(--el-text-color-regular);
}
.staff-container {
  display: flex;
  width: 100%;
  height: 91%;
}
.table-main {
  overflow-x: auto;
}
</style>
