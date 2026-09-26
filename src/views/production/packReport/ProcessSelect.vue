<template>
  <div class="process-select">
    <el-select v-model="selected" multiple filterable :filter-method="filter" placeholder="选择工序，可多选"
      :aria-label="label" @visible-change="query = ''">
      <el-option v-for="option in filteredOptions" :key="option.label" :label="option.label" :value="option.label" />
    </el-select>
    <el-select v-if="detailOptions.length" v-model="details" multiple filterable clearable
      placeholder="阶段 / 方式（选填）" :aria-label="`${label}的阶段或方式`">
      <el-option-group v-for="option in detailOptions" :key="option.label" :label="option.label">
        <el-option v-for="detail in option.details" :key="detail" :label="detail" :value="detail" />
      </el-option-group>
    </el-select>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import type { PackProcess } from "@/api/modules/packReport";
const props = defineProps<{ modelValue: string; detail?: string | null; options: PackProcess[]; label: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string]; "update:detail": [value: string] }>();
const query = ref("");
const split = (value?: string | null) => value ? value.split(",") : [];
const selected = computed({
  get: () => split(props.modelValue),
  set: (values: string[]) => {
    emit("update:modelValue", values.join(","));
    const allowed = props.options.filter(option => values.includes(option.label)).flatMap(option => option.details);
    emit("update:detail", split(props.detail).filter(value => allowed.includes(value)).join(","));
  }
});
const details = computed({ get: () => split(props.detail), set: (values: string[]) => emit("update:detail", values.join(",")) });
const detailOptions = computed(() => props.options.filter(option => selected.value.includes(option.label) && option.details.length));
const filteredOptions = computed(() => props.options.filter(option => {
  const text = `${option.label} ${option.keywords} ${option.details.join(" ")}`;
  const keyword = query.value.replace(/[\s，、/+＋（）()]/g, "");
  return selected.value.includes(option.label) || text.includes(keyword)
    || text.split(/\s+/).some(word => word.length >= 2 && keyword.includes(word));
}));
const filter = (value: string) => { query.value = value; };
</script>
<style scoped>
.process-select { display: flex; flex-direction: column; gap: 8px; width: 100%; }
</style>
