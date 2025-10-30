<template>
  <div>
    <n-card title="供应商管理">
      <n-button @click="batchAdd">供应商扣款计算</n-button>
      <n-button @click="supWorkAdd">供应商报价导入</n-button>
    </n-card>
    <ImportExcel ref="dialogRef" />
  </div>
</template>

<script setup lang="ts">
import {getModel,getDeductions,getSupWorkAddModel,supWorkAddAPI,getMessage} from "@/api/modules/outgoing"
import {ref,onMounted} from "vue"
import ImportExcel from "@/components/ImportExcel/index.vue";
import { useDownload } from "@/hooks/useDownload";
// 在 global.d.ts 或类似文件中
declare global {
  interface WindowEventMap {
    fileUploaded: CustomEvent<{ detail: string }>;
  }
}
onMounted(() => {
  window.addEventListener('fileUploaded', 
  (event: CustomEvent) => {
    const fileUrl = event.detail;
    // 更新组件的状态或触发方法
    handleFileUrl(fileUrl);
  });
});
const handleFileUrl = (url: string) => {
  // 处理文件URL（例如显示图片、下载等）
  console.log('文件URL:', url);
};
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "供应商扣款项",
    tempApi: getModel,
    importApi: downloadFile,
  };
  dialogRef.value?.acceptParams(params);
  // window.dispatchEvent(new CustomEvent('fileUploaded', { detail: fileUrl })); // 触发事件 [6](@ref)
};
const supWorkAdd = () => {
  const params = {
    title: "供应商报价导入",
    tempApi: getSupWorkAddModel,
    importApi: supWorkAddAPI,
  };
  dialogRef.value?.acceptParams(params);
};
const downloadFile = async (file:File) =>{
  // await getDeductions(file)
  file
  useDownload(getDeductions,"扣款",file);
}
// const dedu = async (file) =>{
//   const url= await getDeductions(file)
//   useDownload(url,"扣款回传文件"，)
// }
</script>

<style scoped lang="s">

</style>
