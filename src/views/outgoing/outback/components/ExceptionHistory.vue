<template>
  <el-dialog v-model="visible" title="条目异常记录与作证照片" width="min(760px, 96vw)" @closed="clear">
    <div v-loading="loading">
      <el-empty v-if="!loading && !records.length" description="暂无异常记录" />
      <section v-for="row in records" :key="row.id" class="record">
        <strong>{{ row.foundDate }} 发现{{ row.kind === 'MIX' ? '混料' : '少料' }}</strong>
        <p>原条目：{{ row.beforeNumber }} → {{ row.afterNumber }} <span class="decrease">⤵ {{ row.quantity }}</span></p>
        <p v-if="row.kind === 'MIX'">混入物料：{{ material(row.mixedMaterId) }} <span class="increase">⤴ {{ row.mixedNumber }}</span></p>
        <p v-if="row.remark">{{ row.remark }}</p>
        <div class="photos"><el-image v-for="url in row.urls" :key="url" :src="url" :preview-src-list="row.urls" preview-teleported fit="cover" /></div>
        <span v-if="row.photoError" class="photo-error">部分照片加载失败，请重新打开查看。</span>
      </section>
    </div>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { evidencePhoto, exceptionHistory, type ExceptionHistory } from "../exception";
const props = defineProps<{ maters: Array<{ value: string | number; label: string; num?: string }> }>();
const visible = ref(false), loading = ref(false);
const records = ref<Array<ExceptionHistory & { urls: string[]; photoError: boolean }>>([]);
const material = (id?: number) => { const m = props.maters.find(m => Number(m.value) === id); return m ? `${m.num || ''} ${m.label}` : id; };
let generation = 0;
const urls = new Set<string>();
const clear = () => { generation++; urls.forEach(URL.revokeObjectURL); urls.clear(); };
const open = async (id: number) => {
  clear(); const current = generation; visible.value = true; loading.value = true; records.value = [];
  try {
    const { data } = await exceptionHistory(id);
    if (current !== generation) return;
    records.value = data.map(row => ({ ...row, urls: [], photoError: false }));
    await Promise.all(records.value.map(async row => {
      const paths: string[] = JSON.parse(row.photosJson || '[]');
      await Promise.all(paths.map(async path => {
        try {
          const result = await evidencePhoto(row.itemId, path);
          if (current !== generation) return;
          const blob = result instanceof Blob ? result : new Blob([result]);
          if (!blob.type.startsWith('image/')) throw new Error('照片响应无效');
          const url = URL.createObjectURL(blob); urls.add(url); row.urls.push(url);
        } catch { row.photoError = true; }
      }));
    }));
  } finally { if (current === generation) loading.value = false; }
};
defineExpose({ open });
</script>
<style scoped>
.record { padding: 16px 0; border-bottom: 1px solid var(--el-border-color); }
.decrease { color: var(--el-color-success); margin-left: 10px; }
.increase, .photo-error { color: var(--el-color-danger); margin-left: 10px; }
.photos { display: flex; flex-wrap: wrap; gap: 10px; }
.el-image { width: 96px; height: 96px; border-radius: 6px; }
</style>
