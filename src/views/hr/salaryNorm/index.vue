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
        <el-button link type="primary" :icon="EditPen" @click="openEdit(scope.row)">编辑</el-button>
      </template>
    </ProTable>
    <SalaryNormDrawer ref="drawerRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { EditPen } from "@element-plus/icons-vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import type { SalaryNorm } from "@/api/interface/hr";
import { editSalaryNorm, getSalaryNorm, getSalaryNormPage } from "@/api/modules/hr";
import { useDictStore } from "@/stores/modules/dict";
import SalaryNormDrawer from "./components/SalaryNormDrawer.vue";

const dictStore = useDictStore();
const tableRef = ref<InstanceType<typeof ProTable>>();
const drawerRef = ref<InstanceType<typeof SalaryNormDrawer>>();
const staffDict = computed(() => dictStore.dictMap["staff"] || []);
const dataCallback = (data: any) => ({ list: data.records, total: data.total });
const money = (value: unknown) => value == null ? "" : Number(value).toFixed(2);

onMounted(() => dictStore.loadDicts(["staff"]));

const columns: ColumnProps[] = reactive([
  { type: "index", label: "序号", width: 70 },
  {
    label: "员工",
    prop: "staffId",
    minWidth: 150,
    enum: staffDict,
    search: { el: "select", props: { filterable: true, clearable: true } }
  },
  ...[["basicNorm", "工资基数"], ["overNorm", "加班基数"], ["nightNorm", "夜班补贴基数"],
    ["otherNorm", "其他补贴"], ["postNorm", "岗位补贴"], ["bonus", "奖金"],
    ["eatCutpay", "餐住扣款"], ["fixedDeduction", "固定扣款"], ["social", "社保扣款"]]
    .map(([prop, label]) => ({ prop, label, width: 125, render: ({ row }: any) => money(row[prop]) })),
  { label: "备注", prop: "remark", minWidth: 180 },
  { label: "操作", prop: "operation", fixed: "right", width: 90 }
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
</script>

<style scoped>
.page { height: 100%; min-height: 0; }
</style>
