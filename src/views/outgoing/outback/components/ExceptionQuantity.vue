<template>
  <el-tooltip v-if="quantity !== null && change" placement="top">
    <template #content><span :class="changeClass">{{ change < 0 ? '⤵' : '⤴' }} {{ Math.abs(change) }}</span></template>
    <span tabindex="0" :class="changeClass" :aria-label="`${quantity}，本次${change < 0 ? '减少' : '增加'}${Math.abs(change)}`">{{ quantity }}</span>
  </el-tooltip>
  <span v-else>{{ quantity ?? '—' }}</span>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ number?: number | string | null; delta?: number | string | null }>();
const parseNumber = (value: number | string | null | undefined) =>
  value == null || (typeof value === 'string' && !value.trim()) || !Number.isFinite(Number(value)) ? null : Number(value);
const quantity = computed(() => parseNumber(props.number));
const change = computed(() => parseNumber(props.delta) ?? 0);
const changeClass = computed(() => change.value < 0 ? 'quantity-down' : 'quantity-up');
</script>
<style scoped>
.quantity-down { color: var(--el-color-success); font-weight: 600; }
.quantity-up { color: var(--el-color-danger); font-weight: 600; }
</style>
