<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="width"
    :destroy-on-close="true"
  >
    <slot />
  </el-drawer>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  width?: string;
}>();

const visible = defineModel<boolean>("visible");
</script>
