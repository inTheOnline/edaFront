<template>
  <div class="card base-container">
    <div class="base-heading">
      <h2>基础管理</h2>
      <el-dropdown trigger="click" @command="openTool"
        ><el-button type="primary" :icon="Tools">工具箱</el-button
        ><template #dropdown
          ><el-dropdown-menu><el-dropdown-item command="seal">PDF 盖章 / 签名</el-dropdown-item></el-dropdown-menu></template
        ></el-dropdown
      >
    </div>
    <p>通过工具箱导入 PDF，选择公章或签名，自由定位并下载盖章文件。</p>
    <SealTool ref="sealTool" />
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { Tools } from "@element-plus/icons-vue";
import SealTool from "./seal/index.vue";
const sealTool = ref<{ open: () => void }>();
const openTool = (command: string) => {
  if (command === "seal") sealTool.value?.open();
};
</script>
<style scoped>
.base-container {
  padding: 24px;
}
.base-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
h2 {
  margin: 0;
  font-size: 20px;
}
p {
  color: var(--el-text-color-secondary);
}
</style>
