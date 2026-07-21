<template>
  <el-dialog v-model="visible" title="选择订单条目" width="82%" :close-on-click-modal="false">
    <ProTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :request-api="getOrderMater"
      :data-callback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'search']"
      table-height="430px"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <template #custText="{ row }">
        {{ row.custName || formatCustName(row.custId) }}
      </template>
      <template #createUserText="{ row }">
        {{ row.createUserName || formatUserName(row.createUserId) }}
      </template>
    </ProTable>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确认选择</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { getOrderMater } from "@/api/modules/order";
import { useDictStore } from "@/stores/modules/dict";

const emit = defineEmits<{ confirm: [rows: any[]] }>();

const dictStore = useDictStore();
const visible = ref(false);
const tableRef = ref<InstanceType<typeof ProTable> | null>(null);
const selectedRows = ref<any[]>([]);
const stateOptions = computed(() => dictStore.dictMap.state || []);

const columns: ColumnProps[] = reactive([
  { type: "selection", width: 55 },
  { prop: "localTime", label: "创建时间", minWidth: 160 },
  { prop: "orderNum", label: "订单编号", minWidth: 160, search: { el: "input", props: { placeholder: "请输入订单号" } } },
  { prop: "custText", label: "客户", minWidth: 130 },
  { prop: "materNum", label: "物料编号", minWidth: 130, search: { el: "input", props: { placeholder: "请输入物料编号" } } },
  { prop: "materName", label: "物料名称", minWidth: 180, search: { el: "input", props: { placeholder: "请输入物料名称" } } },
  { prop: "totalNumber", label: "订单总数", width: 100 },
  { prop: "alreadyNumber", label: "已交数量", width: 100 },
  { prop: "notAlreadyNumber", label: "未交数量", width: 110 },
  { prop: "createUserText", label: "创建人", width: 100 },
  { prop: "state", label: "订单状态", tag: true, enum: stateOptions, width: 110 },
  { prop: "remark", label: "备注", minWidth: 150 }
]);

const dataCallback = (data: { records?: any[]; total?: number }) => ({
  list: data?.records || [],
  total: Number(data?.total || 0)
});

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

const handleRowClick = (row: any) => {
  tableRef.value?.element?.toggleRowSelection(row);
};

const formatCustName = (custId?: string | number) => {
  const cust = dictStore.dictMap.cust?.find(item => String(item.value) === String(custId));
  return cust?.label || "";
};

const formatUserName = (userId?: string | number) => {
  const user = dictStore.dictMap.user?.find(item => String(item.value) === String(userId));
  return user?.label || "";
};

onMounted(() => {
  dictStore.loadDicts(["cust", "user", "state"]);
});

const open = () => {
  selectedRows.value = [];
  visible.value = true;
};

const confirm = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning("请选择订单条目");
    return;
  }
  emit("confirm", selectedRows.value);
  visible.value = false;
};

defineExpose({ open });
</script>
