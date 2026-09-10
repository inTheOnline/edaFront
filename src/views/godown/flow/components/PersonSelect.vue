<template>
  <el-select :model-value="modelValue" filterable remote clearable :remote-method="search"
    :loading="loading" placeholder="输入姓名搜索员工" style="width:100%"
    @update:model-value="emit('update:modelValue', $event)" @visible-change="query = ''">
    <el-option v-for="name in names" :key="name" :label="name" :value="name" />
  </el-select>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useDictStore } from "@/stores/modules/dict";

defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const dictStore = useDictStore();
const query = ref("");
const loading = ref(false);
const names = computed(() => query.value
  ? [...new Set((dictStore.dictMap.staff || []).map(item => item.label).filter(name => name?.includes(query.value)))]
  : []);
const search = async (value: string) => {
  query.value = value.trim();
  if (!query.value) return;
  loading.value = true;
  try {
    await dictStore.loadDict("staff");
  } finally {
    loading.value = false;
  }
};
</script>
