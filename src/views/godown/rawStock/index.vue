<template>
  <div class="stock-module">
    <RawModuleHeader title="原材料库存" description="查看原材料实时结存与出入库流水，快速追溯数量变化。" :icon="DataAnalysis">
      <template #meta><el-tag type="success" effect="plain">原材料仓</el-tag></template>
    </RawModuleHeader>
    <div class="stock-module__content">
      <el-tabs v-model="tab" class="stock-tabs">
        <el-tab-pane label="库存统计" name="total" />
        <el-tab-pane label="库存流水" name="flow" />
      </el-tabs>
      <StockTotal v-if="tab === 'total'" item-type="RAW" fixed-warehouse-code="RAW" :show-switcher="false" />
      <StockFlow v-else item-type="RAW" fixed-warehouse-code="RAW" :show-switcher="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { DataAnalysis } from "@element-plus/icons-vue";
import StockTotal from "@/views/godown/total/index.vue";
import StockFlow from "@/views/godown/flow/index.vue";
import RawModuleHeader from "../components/RawModuleHeader.vue";

const tab = ref("flow");
</script>

<style scoped lang="scss">
.stock-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 16px;
}

.stock-module__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px 16px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.stock-tabs {
  flex: 0 0 auto;
}

.stock-module__content > :last-child {
  flex: 1;
  min-height: 0;
}

@media (max-width: 768px) {
  .stock-module {
    gap: 12px;
  }

  .stock-module__content {
    padding: 0 12px 12px;
  }
}
</style>
