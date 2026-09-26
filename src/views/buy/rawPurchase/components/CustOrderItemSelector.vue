<template>
  <el-dialog v-model="visible" title="选择订单条目" width="82%" :close-on-click-modal="false">
    <el-alert v-if="requiredMaterId != null" title="只能关联相同物料的订单，已关联订单不可重复选择" type="info" :closable="false" show-icon class="selection-tip" />
    <ProTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :request-api="getOrderMater"
      :data-callback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'search']"
      table-height="430px"
      :row-class-name="rowClassName"
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
      <el-button type="primary" :disabled="!selectedRows.length" @click="confirm">确认选择</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { getOrderMater } from "@/api/modules/order";
import { useDictStore } from "@/stores/modules/dict";
import { getMaterBindings } from "@/api/modules/mater";

const emit = defineEmits<{ confirm: [rows: any[]] }>();

const dictStore = useDictStore();
const visible = ref(false);
const tableRef = ref<InstanceType<typeof ProTable> | null>(null);
const selectedRows = ref<any[]>([]);
const stateOptions = computed(() => dictStore.dictMap.state || []);

const columns: ColumnProps[] = reactive([
  { type: "selection", width: 55, selectable: row => !selectionDisabled(row) },
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
  list: (data?.records || []).map(row => ({ ...row, relationMissing: isRelationMissing(row) })),
  total: Number(data?.total || 0)
});

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

const handleRowClick = (row: any) => {
  if (isDifferentMater(row)) {
    ElMessage.warning("同一条请购明细只能关联相同物料的订单");
    return;
  }
  if (excludedIds.value.has(String(row.id))) {
    ElMessage.warning("该订单已关联当前请购明细");
    return;
  }
  if (isPlugin(row)) {
    ElMessage.warning(`插件产品 ${row.materNum || row.materName || ""} 不能主动请购，请选择对应的主产品`);
    return;
  }
  if (isRelationMissing(row)) {
    ElMessage.warning(`物料 ${row.materNum || row.materName || ""} 未维护原材料关系，无法选择`);
    return;
  }
  tableRef.value?.element?.toggleRowSelection(row);
};

const relationMaterIds = ref(new Set<string>());
const pluginMaterIds = ref(new Set<string>());
const allowMissing = ref(false);
const requiredMaterId = ref<string | number>();
const excludedIds = ref(new Set<string>());
const isRelationMissing = (row: any) => !allowMissing.value && !relationMaterIds.value.has(String(row.materId));
const isPlugin = (row: any) => pluginMaterIds.value.has(String(row.materId));
const isDifferentMater = (row: any) => requiredMaterId.value != null && String(row.materId) !== String(requiredMaterId.value);
const selectionDisabled = (row: any) => isPlugin(row) || isRelationMissing(row) || isDifferentMater(row) || excludedIds.value.has(String(row.id));
const rowClassName = ({ row }: any) => (isPlugin(row) || isRelationMissing(row) ? "relation-missing-row" : isDifferentMater(row) || excludedIds.value.has(String(row.id)) ? "selection-disabled-row" : "");

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

const open = async (materIds: Array<string | number> = [], allowRowsWithoutRaw = false, options: { materId?: string | number; excludedIds?: Array<string | number> } = {}) => {
  allowMissing.value = allowRowsWithoutRaw;
  requiredMaterId.value = options.materId;
  excludedIds.value = new Set((options.excludedIds || []).map(String));
  relationMaterIds.value = new Set(materIds.filter(value => value !== null && value !== undefined).map(String));
  selectedRows.value = [];
  const results = await Promise.all([...['cust', 'user', 'state'].map(type => dictStore.loadDict(type, { force: true })), getMaterBindings()]);
  const bindingResponse: any = results[results.length - 1];
  const bindings = bindingResponse?.data?.data ?? bindingResponse?.data ?? bindingResponse ?? [];
  pluginMaterIds.value = new Set(bindings.map((row: any) => String(row.pluginMaterId)));
  visible.value = true;
  await nextTick();
  tableRef.value?.element?.clearSelection();
  tableRef.value?.getTableList();
};

const confirm = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning("请选择订单条目");
    return;
  }
  if (selectedRows.value.some(selectionDisabled)) {
    ElMessage.warning("所选订单包含不可关联的条目，请重新选择");
    return;
  }
  emit("confirm", selectedRows.value);
  visible.value = false;
};

defineExpose({ open });
</script>

<style scoped>
.selection-tip { margin-bottom: 12px; }
:deep(.selection-disabled-row > td.el-table__cell) {
  color: var(--el-text-color-disabled);
}
:deep(.relation-missing-row > td.el-table__cell) {
  background: #fef0f0 !important;
  color: var(--el-color-danger);
}
</style>
