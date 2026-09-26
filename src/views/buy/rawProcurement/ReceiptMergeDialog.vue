<template>
  <el-dialog v-model="visible" title="合并同号回执" width="680px" style="max-width: calc(100vw - 32px)" append-to-body :close-on-click-modal="false" @close="finish(null)">
    <p>回执单号 {{ existing?.receiptNum }} 已存在，日期或供应商信息不同。请选择合并后保留的信息。</p>
    <el-table :data="rows" border>
      <el-table-column prop="label" label="信息来源" min-width="110" />
      <el-table-column prop="receiptDate" label="回执日期" min-width="115" />
      <el-table-column prop="supName" label="供应商" min-width="160" />
    </el-table>
    <p>两张回执的明细会合并，备注会拼接。取消合并将保留当前编辑内容。</p>
    <template #footer>
      <div class="merge-actions">
        <el-button @click="finish(null)">取消合并</el-button>
        <el-button @click="finish('existing')">保留已有回执信息</el-button>
        <el-button type="primary" @click="finish('current')">保留当前回执信息</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { RawTable } from "./service";

type Choice = "current" | "existing" | null;
const visible = ref(false);
const current = ref<RawTable>();
const existing = ref<RawTable>();
let resolveChoice: ((choice: Choice) => void) | undefined;
const rows = computed(() => [
  { ...current.value, label: "当前回执" },
  { ...existing.value, label: "已有回执" }
]);
const finish = (choice: Choice) => {
  resolveChoice?.(choice);
  resolveChoice = undefined;
  visible.value = false;
};
const choose = (source: RawTable, target: RawTable) => {
  current.value = source;
  existing.value = target;
  visible.value = true;
  return new Promise<Choice>(resolve => { resolveChoice = resolve; });
};
onBeforeUnmount(() => finish(null));
defineExpose({ choose });
</script>

<style scoped>
.merge-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.merge-actions .el-button { margin-left: 0; }
</style>
