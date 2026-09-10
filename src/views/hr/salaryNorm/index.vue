<template>
  <div class="page">
    <ProTable
      ref="tableRef"
      :columns="columns"
      :request-api="getSalaryNormPage"
      :dataCallback="dataCallback"
      row-key="id"
      title="工资标准"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #operation="scope">
        <div class="row-actions">
          <el-button link type="primary" :icon="EditPen" @click="openEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" :icon="Clock" @click="openLog(scope.row)">修改记录</el-button>
        </div>
      </template>
    </ProTable>
    <SalaryNormDrawer ref="drawerRef" />
    <SalaryNormLogDialog ref="logRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Clock, EditPen } from "@element-plus/icons-vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import type { SalaryNorm } from "@/api/interface/hr";
import { editSalaryNorm, getSalaryNorm, getSalaryNormPage } from "@/api/modules/hr";
import { useDictStore } from "@/stores/modules/dict";
import SalaryNormDrawer from "./components/SalaryNormDrawer.vue";
import SalaryNormLogDialog from "./components/SalaryNormLogDialog.vue";
import { salaryNormFields } from "./fields";

const dictStore = useDictStore();
const tableRef = ref<InstanceType<typeof ProTable>>();
const drawerRef = ref<InstanceType<typeof SalaryNormDrawer>>();
const logRef = ref<InstanceType<typeof SalaryNormLogDialog>>();
const staffDict = computed(() => dictStore.dictMap["staff"] || []);
const dataCallback = (data: any) => ({ list: data.records, total: data.total });
const money = (value: unknown) => (value == null ? "-" : Number(value).toFixed(2));

const getStaffName = (staffId?: number) => {
  const item = staffDict.value.find(option => String(option.value) === String(staffId));
  return item?.label || `员工 ID：${staffId ?? "-"}`;
};

onMounted(() => dictStore.loadDicts(["staff"]));

const columns: ColumnProps[] = reactive([
  { type: "index", label: "序号", width: 70, align: "center" },
  {
    label: "员工",
    prop: "staffId",
    minWidth: 150,
    fixed: "left",
    enum: staffDict,
    search: { el: "select", props: { filterable: true, clearable: true } }
  },
  ...salaryNormFields.map(item => ({
    prop: item.prop,
    label: item.label,
    width: 125,
    align: "right" as const,
    headerAlign: "right" as const,
    render: ({ row }: any) => money(row[item.prop])
  })),
  { label: "备注", prop: "remark", minWidth: 180, showOverflowTooltip: true },
  { label: "操作", prop: "operation", fixed: "right", width: 185, align: "center" }
]);

const openEdit = async (row: SalaryNorm) => {
  const { data } = await getSalaryNorm(row.id!);
  drawerRef.value?.acceptParams({
    row: data,
    staffDict: staffDict.value,
    api: editSalaryNorm,
    refresh: tableRef.value?.getTableList
  });
};

const openLog = (row: SalaryNorm) => {
  if (row.id) logRef.value?.open(row.id, getStaffName(row.staffId));
};
</script>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
