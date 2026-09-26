<template>
  <div class="pack-page">
    <ProTable ref="table" :columns="columns" :request-api="getPackReports" :data-callback="dataCallback" row-key="id"
      title="包装日报表" :search-col="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }" :tool-button="['refresh', 'setting', 'search']">
      <template #tableHeader="scope">
        <el-button type="primary" :icon="CirclePlus" :disabled="!ready" @click="drawer?.open('新增')">新增包装日报</el-button>
        <el-button type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="remove(scope.selectedListIds.map(Number))">删除选中组</el-button>
        <el-button plain @click="table?.element?.toggleAllSelection()">当页全选 / 取消</el-button>
        <div class="totals">
          <span>已选 {{ selected.length }} 组</span>
          <span>共用工时 <strong>{{ totals.hours.toFixed(2) }}</strong> 小时</span>
          <span>数量 <strong>{{ totals.qty.toLocaleString() }}</strong></span>
          <span>不良 <strong>{{ totals.defect.toLocaleString() }}</strong></span>
          <span>报废 <strong>{{ totals.scrap.toLocaleString() }}</strong></span>
        </div>
        <p class="hint">按共用工时分组显示、选择和分页；筛选命中明细时保留整组，工时只累计一次。</p>
        <el-alert v-if="optionError" title="选项加载失败，请刷新重试" type="error" :closable="false" />
      </template>
      <template #operatorId="{ row }">{{ row.operatorName || dict.getLabel('staff', row.operatorId) }}</template>
      <template v-for="field in detailFields" :key="field" #[field]="{ row }">
        <div v-for="item in row.items" :key="item.id" class="detail-line" :title="String(item[field] ?? '')">{{ display(item[field], field) }}</div>
      </template>
      <template #operation="{ row }">
        <el-button link type="primary" @click="drawer?.open('查看', row.id)">查看</el-button>
        <el-button link type="primary" :disabled="!ready" @click="drawer?.open('编辑', row.id)">编辑</el-button>
        <el-button link type="danger" @click="remove([row.id])">删除</el-button>
      </template>
    </ProTable>
    <PackDrawer ref="drawer" :staff-options="staffOptions" :material-options="materialOptions" :process-options="processOptions" @saved="refresh" />
  </div>
</template>
<script setup lang="ts" name="packReport">
import { computed, onMounted, reactive, ref } from "vue";
import { CirclePlus, Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
import { getPackReports, getPackProcesses, deletePackReports, type PackReport, type PackProcess } from "@/api/modules/packReport";
import PackDrawer from "./PackDrawer.vue";
const table = ref<InstanceType<typeof ProTable>>(), drawer = ref<InstanceType<typeof PackDrawer>>();
const dict = useDictStore();
const staffOptions = computed(() => dict.dictMap.staff || []);
const materialOptions = computed(() => (dict.dictMap.mater || []) as { value: number | string; label: string; num?: string }[]);
const materialSearch = computed(() => materialOptions.value.map(item => ({ ...item, label: `${item.num || ''} ${item.label}` })));
const processOptions = ref<PackProcess[]>([]);
const processSearch = computed(() => processOptions.value.map(item => ({ label: item.label, value: item.label })));
const ready = ref(false), optionError = ref(false);
onMounted(async () => {
  try {
    const [, response] = await Promise.all([dict.loadDicts(["mater", "staff"]), getPackProcesses()]);
    processOptions.value = response.data;
    ready.value = true;
  } catch { optionError.value = true; }
});
const selected = computed(() => (table.value?.selectedList || []) as PackReport[]);
const totals = computed(() => selected.value.reduce((sum, report) => {
  sum.hours += Number(report.hours || 0);
  report.items.forEach(item => { sum.qty += Number(item.qty || 0); sum.defect += Number(item.defect || 0); sum.scrap += Number(item.scrap || 0); });
  return sum;
}, { hours: 0, qty: 0, defect: 0, scrap: 0 }));
const dataCallback = (data: { records: PackReport[]; total: number }) => {
  table.value?.element?.clearSelection();
  return { list: data.records, total: data.total };
};
const display = (value: unknown, field: string) => value == null || value === "" ? "—"
  : typeof value === "string" && ["process", "processDetail"].includes(field) ? value.replaceAll(",", "、") : value;
const detailFields = ["materNum", "materName", "process", "processDetail", "qty", "defect", "scrap", "remark"];
const columns = reactive<ColumnProps[]>([
  { type: "selection", width: 48 },
  { prop: "date", label: "日期", width: 112, search: { el: "date-picker", props: { type: "daterange", valueFormat: "YYYY-MM-DD" } } },
  { prop: "operatorId", label: "员工", enum: staffOptions, minWidth: 95, search: { el: "select", props: { filterable: true } } },
  { prop: "hours", label: "共用工时(H)", width: 115 },
  { prop: "materNum", label: "产品编号", minWidth: 160, enum: materialSearch, isFilterEnum: false,
    search: { key: "materId", label: "产品", el: "select", props: { filterable: true } } },
  { prop: "materName", label: "产品名称", minWidth: 200 },
  { prop: "process", label: "工序", minWidth: 150, enum: processSearch, isFilterEnum: false, search: { el: "select", props: { filterable: true } } },
  { prop: "processDetail", label: "阶段 / 方式", minWidth: 150 },
  { prop: "qty", label: "数量", width: 90 },
  { prop: "defect", label: "不良品数", width: 90 },
  { prop: "scrap", label: "报废数", width: 90 },
  { prop: "remark", label: "备注", minWidth: 180, search: { el: "input" } },
  { prop: "operation", label: "操作（整组）", width: 175, fixed: "right" }
]);
const refresh = () => table.value?.getTableList();
const remove = async (ids: number[]) => {
  try { await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 组包装记录及组内全部明细？`, "删除包装日报", { type: "warning" }); }
  catch { return; }
  await deletePackReports(ids);
  ElMessage.success("已删除");
  table.value?.element?.clearSelection();
  refresh();
};
</script>
<style scoped>
.pack-page { display: flex; flex: 1; min-height: 0; flex-direction: column; }
.totals { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 14px; }
.totals strong { color: var(--el-color-primary); font-variant-numeric: tabular-nums; }
.hint { width: 100%; margin: 8px 0 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
.detail-line { height: 34px; line-height: 34px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.detail-line + .detail-line { border-top: 1px solid var(--el-border-color-lighter); }
</style>
