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
import {useDictStore} from '@/stores/modules/dict'
import { sortUserPlugins } from "vite";
import { ElNotification } from "element-plus";
const dictStore = useDictStore()
// 在 global.d.ts 或类似文件中
declare global {
  interface WindowEventMap {
    fileUploaded: CustomEvent<{ detail: string }>;
  }
}
onMounted(async () => {
  window.addEventListener('fileUploaded', 
  (event: CustomEvent) => {
    const fileUrl = event.detail;
    // 更新组件的状态或触发方法
    handleFileUrl(fileUrl);
  });
  await dictStore.loadDicts(['sup']);
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
const downloadFile = async (formData: FormData) =>{
  const file = formData.get("file") as File | null;
  console.log(file)
  if (!file) {
    ElNotification({ title: "错误", message: "未获取到上传文件", type: "error" });
    return;
  }
  // 调用验证函数
  const isFileNameValid = inspectFileName(file.name, dictStore.dictMap['sup']);
  
  if (!isFileNameValid) {
    console.error('文件名不符合要求，扣款前必须是供应商名字');
    ElNotification({ title: "错误", message: "文件名不符合要求，扣款前必须是供应商名字", type: "error" });
    return; // 验证失败则终止执行
  }
  useDownload(getDeductions,"扣款",formData);
}
// 检验文件名是否符合格式要求的工具函数
const inspectFileName = (
  fileName: string, 
  supplierList: Array<{ label: string }>
): boolean => {
  // 提取文件名（不含扩展名）
  const baseName = fileName.split('.').slice(0, -1).join('.');
  // 提取所有供应商名称
  const supplierNames = supplierList.map(item => item.label);
  
  // 1. 验证基本格式：必须包含"扣款"且"扣款"前有内容
  const hasValidStructure = /^.+扣款.+$/.test(baseName);
  if (!hasValidStructure) return false;
  
  // 2. 提取"扣款"前的名称并验证是否为供应商
  const nameBeforeDeduction = baseName.split('扣款')[0];
  return supplierNames.includes(nameBeforeDeduction);
};
// const dedu = async (file) =>{
//   const url= await getDeductions(file)
//   useDownload(url,"扣款回传文件"，)
// }
</script>

<style scoped lang="s">

</style>
