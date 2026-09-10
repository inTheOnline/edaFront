<template>
  <div class="selection-summary">
    <div v-for="item in items" :key="item.label" class="selection-summary__item">
      <span class="selection-summary__label">{{ item.label }}</span>
      <span class="selection-summary__value">{{ formatNumber(item.value) }}</span>
    </div>
    <el-button type="primary" plain :icon="CircleClose" :disabled="disabled" @click="$emit('clear')">取消选择</el-button>
  </div>
</template>

<script setup lang="ts">
import { CircleClose } from "@element-plus/icons-vue";

defineProps<{
  items: Array<{ label: string; value: number }>;
  disabled: boolean;
}>();

defineEmits<{ clear: [] }>();

const formatNumber = (value: number) => Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 4 });
</script>

<style scoped>
.selection-summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.selection-summary__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  line-height: 1;
}

.selection-summary__label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.selection-summary__value {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-primary);
}
</style>
