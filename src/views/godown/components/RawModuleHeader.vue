<template>
  <header class="module-header">
    <div class="module-header__identity">
      <span class="module-header__icon" aria-hidden="true">
        <el-icon><component :is="icon" /></el-icon>
      </span>
      <div>
        <p class="module-header__eyebrow">RAW MATERIAL CENTER</p>
        <h1>{{ title }}</h1>
        <p class="module-header__description">{{ description }}</p>
      </div>
    </div>
    <div v-if="$slots.meta" class="module-header__meta">
      <slot name="meta" />
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  title: string;
  description: string;
  icon: Component;
}>();
</script>

<style scoped lang="scss">
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 24px;
  color: var(--el-text-color-primary);
  background: linear-gradient(120deg, var(--el-color-primary-light-9), transparent 58%), var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(31 45 61 / 6%);
}

.module-header__identity {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 16px;
}

.module-header__icon {
  display: grid;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  place-items: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 12px;
  font-size: 24px;
}

.module-header__eyebrow {
  margin: 0 0 3px;
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.35;
}

.module-header__description {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.module-header__meta {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .module-header {
    align-items: flex-start;
    padding: 16px;
  }

  .module-header__icon {
    display: none;
  }

  h1 {
    font-size: 19px;
  }
}
</style>
