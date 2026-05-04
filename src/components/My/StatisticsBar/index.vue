<template>
  <div class="stat-bar">
    <el-descriptions :column="column" size="small">
      <el-descriptions-item v-for="item in config" :key="item.label">
        <template #label>
          <span class="stat-label">{{ item.label }}：</span>
        </template>

        <span class="stat-value">
          {{ formatValue(getValue(item)) }}
        </span>
      </el-descriptions-item>
    </el-descriptions>

    <slot name="extra" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * @description: 统计栏传入参数
 * @param {Array} list 被选择的项的id列表
 * @param {Array} config 统计配置项，包含 label、field、type、calc、formatter 等属性
 * @param {Number} column 每行显示的统计项数量，默认为 2
 */
const props = defineProps({
  list: { type: Array, default: () => [] },
  config: { type: Array, default: () => [] },
  column: { type: Number, default: 2 }
});

/**
 * 计算值
 */
const getValue = (item: any) => {
  if (item.calc) {
    return item.calc(props.list);
  }

  if (!item.field) return 0;

  const values = props.list.map((e: any) => Number(e[item.field] || 0));

  if (item.type === "avg") {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // 默认 sum
  return values.reduce((a, b) => a + b, 0);
};

/**
 * 格式化
 */
const formatValue = (val: number, item?: any) => {
  if (item?.formatter) return item.formatter(val);
  return Number(val).toLocaleString();
};
</script>

<style scoped>
.stat-bar {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
</style>