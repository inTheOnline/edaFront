<template>
  <el-dialog v-model="visible" title="选择请购明细" width="80%" :close-on-click-modal="false">
    <ProTable
      ref="proTableRef"
      row-key="id"
      :columns="columns"
      :request-api="getRequisitionPage"
      :data-callback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'search']"
      table-height="460px"
      @row-click="handleRowClick"
    />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确认选择</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { getRequisitionPage } from "@/api/modules/buy/rawPurchase";
import type { RawPurchaseRequisition } from "@/api/interface/buy/rawPurchase";

const emit = defineEmits<{ confirm: [rows: RawPurchaseRequisition[]] }>();
const visible = ref(false);
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);

const dataCallback = (data: { records: RawPurchaseRequisition[]; total: number }) => ({
  list: data.records,
  total: data.total
});

const columns: ColumnProps<RawPurchaseRequisition>[] = reactive([
  { type: "selection", width: 55 },
  { prop: "requisitionDate", label: "请购日期", width: 120 },
  { prop: "custOrderNum", label: "客户订单", minWidth: 150, search: { el: "input", props: { placeholder: "请输入客户订单" } } },
  { prop: "materName", label: "品名", minWidth: 160, search: { el: "input", props: { placeholder: "请输入品名" } } },
  { prop: "rawSpecs", label: "原材料型号", minWidth: 180, search: { el: "input", props: { placeholder: "请输入型号" } } },
  { prop: "rawNum", label: "原材料号", minWidth: 140, search: { el: "input", props: { placeholder: "请输入原材料号" } } },
  { prop: "notPurchaseNumber", label: "未采购数量", width: 120 },
  { prop: "status", label: "状态", width: 100 }
]);

const handleRowClick = (row: RawPurchaseRequisition) => {
  proTableRef.value?.element?.toggleRowSelection(row);
};

const open = () => {
  visible.value = true;
};

const confirm = () => {
  const rows = (proTableRef.value?.selectedList || []) as RawPurchaseRequisition[];
  if (!rows.length) {
    ElMessage.warning("请选择请购明细");
    return;
  }
  emit("confirm", rows);
  visible.value = false;
};

defineExpose({ open });
</script>
