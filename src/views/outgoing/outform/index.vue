<template>
  <div class="outgoing-page outgoing-page--form">
    <ProTable
      ref="proTableRef"
      row-key="id"
      title="外发表"
      :columns="columns"
      :request-api="getOutformPageApi"
      :dataCallback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'setting', 'search']"
      :search-col="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }"
      @row-click="handleRowClick"
    >
      <template #tableHeader="scope">
        <el-button type="primary" class="hero-btn hero-btn--primary" :icon="CirclePlus" @click="openDrawer('新增')">新增外发表</el-button>
        <el-button type="success" class="hero-btn" :icon="Tickets" @click="openOrderDialog()">开委外单</el-button>
        <el-button type="warning" class="hero-btn" :icon="Tickets" @click="openReturnOrderDialog()">开退货单</el-button>
        <el-button type="primary" plain class="hero-btn hero-btn--ghost" :icon="Upload" @click="openBatchDialog">批量增加</el-button>
        <el-button type="primary" plain class="hero-btn hero-btn--ghost" :icon="Download" @click="exportExcel">导出 Excel</el-button>
        <el-button
          type="danger"
          plain
          class="hero-btn hero-btn--danger"
          :icon="Delete"
          :disabled="!scope.isSelected"
          @click="openDeleteDialog(scope.selectedList || [])"
        >
          批量删除
        </el-button>
        <div class="selection-summary">
          <div class="selection-summary__item">
            <span class="selection-summary__label">外发数量</span>
            <span class="selection-summary__value">{{ Number(numberTotal).toLocaleString() }}</span>
          </div>
          <div class="selection-summary__item">
            <span class="selection-summary__label">已回货</span>
            <span class="selection-summary__value">{{ Number(backNumberTotal).toLocaleString() }}</span>
          </div>
          <div class="selection-summary__item selection-summary__item--pending">
            <span class="selection-summary__label">未回货</span>
            <span class="selection-summary__value">{{ Number(notbackNumberTotal).toLocaleString() }}</span>
          </div>
          <el-button
            type="primary"
            plain
            class="selection-summary__clear"
            :icon="CircleClose"
            :disabled="!scope.isSelected"
            @click="cancelSelect"
          >
            取消选择
          </el-button>
        </div>
      </template>

      <template #operation="{ row }">
        <el-button type="primary" link :icon="View" @click="openViewDialog(row)">查看</el-button>
        <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', row)">编辑</el-button>
        <el-button v-if="row.printNum" type="success" link :icon="Tickets" @click="openSavedOrder(row)">{{ isReturnOrder(row) ? "退货单编辑" : "整单编辑" }}</el-button>
        <el-button v-if="row.printNum" type="success" link :icon="Printer" @click="printSavedOrder(row)">打印</el-button>
        <el-button type="danger" link :icon="Delete" @click="openDeleteDialog([row])">删除</el-button>
      </template>
    </ProTable>

    <UserDrawer ref="drawerRef" />
    <BatchAddDialog ref="batchDialogRef" />
    <OutbackDetailDialog ref="detailDialogRef" @confirm-delete="confirmDelete" />
    <OrderDialog ref="orderDialogRef" />
    <ReturnOrderDialog ref="returnOrderDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onMounted, reactive, ref, watch } from "vue";
import { CircleClose, CirclePlus, Delete, Download, EditPen, Printer, Tickets, Upload, View } from "@element-plus/icons-vue";
import { ElLoading, ElMessage, ElMessageBox } from "element-plus";
import * as XLSX from "xlsx";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, EnumProps } from "@/components/ProTable/interface";
import { getAllSup } from "@/api/modules/sup";
import { useDictStore } from "@/stores/modules/dict";
import BatchAddDialog from "./components/BatchAddDialog.vue";
import OutbackDetailDialog from "./components/OutbackDetailDialog.vue";
import UserDrawer from "./components/UserDrawer.vue";
import OrderDialog from "./components/OrderDialog.vue";
import ReturnOrderDialog from "./components/ReturnOrderDialog.vue";
import {
  createOutformApi,
  createOutformBatchApi,
  deleteOutformApi,
  formatOutgoingDate,
  getOutformPageApi,
  getOutItemStateApi,
  getRelatedOutbackApi,
  mapStateEnum,
  type RelatedOutbackRecord,
  type OutformRecord,
  unwrapData,
  updateOutformApi
} from "../service";

type RelatedGroup = {
  outItem: OutformRecord;
  records: RelatedOutbackRecord[];
};

type OptionValue = string | number | boolean | any[];

const OUTFORM_OPTION_PAGE_SIZE = 1000;

const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const batchDialogRef = ref<InstanceType<typeof BatchAddDialog> | null>(null);
const detailDialogRef = ref<InstanceType<typeof OutbackDetailDialog> | null>(null);
const orderDialogRef = ref<InstanceType<typeof OrderDialog> | null>(null);
const returnOrderDialogRef = ref<InstanceType<typeof ReturnOrderDialog> | null>(null);
const supplierEnum = computed(() => dictStore.dictMap.sup || []);
const materEnum = computed(() => dictStore.dictMap.mater || []);
const batchSupplierOptions = ref<Array<{ label: string; value: string | number; callName?: string }>>([]);
const stateEnum = ref<EnumProps[]>([]);
const allOutformRecords = ref<OutformRecord[]>([]);
const isDynamicOptionsReady = ref(false);
const isDynamicOptionsFailed = ref(false);
const lastChangedSearchKey = ref<"supId" | "materId" | "state">();
const pendingDeleteIds = ref<number[]>([]);
const selectedList = computed(() => proTableRef.value?.selectedList || []);
const numberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.number || 0), 0));
const backNumberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.backNumber || 0), 0));
const notbackNumberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.notbackNumber || 0), 0));
const searchParam = computed<Record<string, any>>(() => (proTableRef.value?.searchParam || {}) as Record<string, any>);
const selectedSupId = computed(() => searchParam.value.supId);
const selectedMaterId = computed(() => searchParam.value.materId);
const selectedState = computed(() => searchParam.value.state);

const dataCallback = (data: { records: OutformRecord[]; total: number }) => ({
  list: data.records,
  total: data.total
});

const isEmptyValue = (value: unknown) => value === undefined || value === null || value === "";

const isSameValue = (left: unknown, right: unknown) => String(left) === String(right);

const findOption = (options: EnumProps[], value: unknown) => options.find(item => isSameValue(item.value, value));

const findMaterialOption = (record: OutformRecord) => {
  if (!isEmptyValue(record.materId)) return findOption(materEnum.value, record.materId);
  if (!record.materNum) return undefined;
  return (materEnum.value as EnumProps[]).find(item => String(item.num || item.label) === String(record.materNum));
};

const getMaterialValue = (record: OutformRecord) => record.materId ?? findMaterialOption(record)?.value;

const normalizeStateValue = (value: unknown) => {
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return value as OptionValue;
};

const getStateLabel = (record: OutformRecord) =>
  record.stateLabel || findOption(stateEnum.value, normalizeStateValue(record.state))?.label || String(record.state);

const buildUniqueOptions = <T,>(
  list: T[],
  getValue: (item: T) => unknown,
  getOption: (item: T, value: OptionValue) => EnumProps | null
) => {
  const valueSet = new Set<string>();
  const options: EnumProps[] = [];

  list.forEach(item => {
    const rawValue = getValue(item);
    if (isEmptyValue(rawValue)) return;
    const value = rawValue as OptionValue;
    const valueKey = String(value);
    if (valueSet.has(valueKey)) return;
    const option = getOption(item, value);
    if (!option?.label) return;
    valueSet.add(valueKey);
    options.push(option);
  });

  return options;
};

const filterRecordsBySearch = (ignoreKey: "supId" | "materId" | "state") =>
  allOutformRecords.value.filter(item => {
    const materValue = getMaterialValue(item);
    return (
      (ignoreKey === "supId" || isEmptyValue(selectedSupId.value) || isSameValue(item.supId, selectedSupId.value)) &&
      (ignoreKey === "materId" || isEmptyValue(selectedMaterId.value) || isSameValue(materValue, selectedMaterId.value)) &&
      (ignoreKey === "state" || isEmptyValue(selectedState.value) || isSameValue(item.state, selectedState.value))
    );
  });

const shouldUseRecordOptions = computed(() => isDynamicOptionsReady.value && !isDynamicOptionsFailed.value);

const dynamicSupplierEnum = computed<EnumProps[]>(() => {
  if (!shouldUseRecordOptions.value) return supplierEnum.value as EnumProps[];
  return buildUniqueOptions(
    filterRecordsBySearch("supId"),
    item => item.supId,
    (item, value) => ({
      label: item.supName || String(findOption(supplierEnum.value, value)?.label || ""),
      value
    })
  );
});

const dynamicMaterEnum = computed<EnumProps[]>(() => {
  if (!shouldUseRecordOptions.value) return materEnum.value as EnumProps[];
  return buildUniqueOptions(
    filterRecordsBySearch("materId"),
    getMaterialValue,
    (item, value) => {
      const materialOption = findMaterialOption(item);
      const num = item.materNum || materialOption?.num || materialOption?.label;
      return {
        label: item.materName || materialOption?.label || String(num || ""),
        value,
        num
      };
    }
  );
});

const dynamicStateEnum = computed<EnumProps[]>(() => {
  if (!shouldUseRecordOptions.value) return stateEnum.value;
  return buildUniqueOptions(
    filterRecordsBySearch("state"),
    item => normalizeStateValue(item.state),
    (item, value) => ({
      label: getStateLabel(item),
      value,
      tagType: findOption(stateEnum.value, value)?.tagType || item.stateTagType || "info"
    })
  );
});

const optionIncludesValue = (options: EnumProps[], value: unknown) =>
  isEmptyValue(value) || options.some(item => isSameValue(item.value, value));

const clearInvalidSearchValue = (preserveKey?: "supId" | "materId" | "state") => {
  const param = searchParam.value;
  if (!param) return;
  if (preserveKey !== "supId" && !optionIncludesValue(dynamicSupplierEnum.value, param.supId)) param.supId = undefined;
  if (preserveKey !== "materId" && !optionIncludesValue(dynamicMaterEnum.value, param.materId)) param.materId = undefined;
  if (preserveKey !== "state" && !optionIncludesValue(dynamicStateEnum.value, param.state)) param.state = undefined;
};

const syncSearchEnumMap = () => {
  const enumMap = proTableRef.value?.enumMap as Map<string, EnumProps[]> | { value?: Map<string, EnumProps[]> } | undefined;
  const map = enumMap instanceof Map ? enumMap : enumMap?.value;
  if (!map) return;
  map.set("supId", dynamicSupplierEnum.value);
  map.set("materId", dynamicMaterEnum.value);
  map.set("state", dynamicStateEnum.value);
};

const syncDynamicSearchOptions = (preserveKey = lastChangedSearchKey.value) => {
  clearInvalidSearchValue(preserveKey);
  syncSearchEnumMap();
};

const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", width: 60 },
  {
    type: "index",
    label: "序号",
    width: 70,
    index: index => ((proTableRef.value?.pageable.pageNum || 1) - 1) * (proTableRef.value?.pageable.pageSize || 20) + index + 1
  },
  {
    prop: "subcDate",
    label: "外发日期",
    width: 120,
    render: ({ row }) => formatOutgoingDate(row.subcDate),
    search: {
      el: "date-picker",
      props: {
        type: "daterange",
        format: "YYYY-MM-DD",
        valueFormat: "YYYY-MM-DD",
        "start-placeholder": "开始日期",
        "end-placeholder": "结束日期",
        style: "width: 100%"
      }
    }
  },
  {
    prop: "subcNum",
    label: "外发单号",
    minWidth: 160,
    search: {
      el: "input",
      props: { placeholder: "请输入外发单号" }
    }
  },
  {
    prop: "supId",
    label: "供应商",
    minWidth: 140,
    enum: dynamicSupplierEnum,
    search: {
      el: "select",
      props: { filterable: true, placeholder: "请选择供应商" }
    }
  },
  {
    prop: "materId",
    label: "物料编码",
    minWidth: 140,
    enum: dynamicMaterEnum,
    fieldNames: { label: "num", value: "value" },
    search: {
      el: "select",
      props: { filterable: true, placeholder: "请选择物料" }
    }
  },
  { prop: "materName", label: "物料名称", minWidth: 160 },
  { prop: "number", label: "外发数量", width: 110 },
  { prop: "backNumber", label: "已回货数量", width: 120 },
  {
    prop: "notbackNumber",
    label: "未回货数量",
    width: 120,
    render: ({ row }) => {
      const value = Number(row.notbackNumber || 0);
      return h(
        "span",
        {
          class: ["pending-chip", value < 0 ? "pending-chip--danger" : value === 0 ? "pending-chip--zero" : ""]
        },
        value
      );
    }
  },
  {
    prop: "state",
    label: "状态",
    width: 100,
    tag: true,
    enum: dynamicStateEnum,
    search: {
      el: "select",
      props: { placeholder: "请选择状态" }
    }
  },
  { prop: "subcRemark", label: "整单备注", minWidth: 180 },
  { prop: "remark", label: "行备注", minWidth: 180 },
  { prop: "operation", label: "操作", fixed: "right", width: 220 }
]);

const openDrawer = (title: string, row: Partial<OutformRecord> = {}) => {
  drawerRef.value?.acceptParams({
    title,
    isView: false,
    row,
    suppliers: supplierEnum.value,
    maters: materEnum.value,
    stateOptions: stateEnum.value,
    submitApi: (payload, editId) => (editId ? updateOutformApi(editId, payload) : createOutformApi(payload)),
    getTableList: refreshOutformPage
  });
};

const openBatchDialog = () => {
  batchDialogRef.value?.open({
    suppliers: batchSupplierOptions.value.length ? batchSupplierOptions.value : supplierEnum.value,
    maters: materEnum.value,
    stateOptions: stateEnum.value,
    submitApi: createOutformBatchApi,
    getTableList: refreshOutformPage
  });
};

const openOrderDialog = (subcId?: number) => {
  orderDialogRef.value?.open({
    suppliers: batchSupplierOptions.value.length ? batchSupplierOptions.value : supplierEnum.value,
    maters: materEnum.value,
    subcId,
    refresh: refreshOutformPage
  });
};

const openReturnOrderDialog = (subcId?: number) => {
  returnOrderDialogRef.value?.open({
    suppliers: batchSupplierOptions.value.length ? batchSupplierOptions.value : supplierEnum.value,
    maters: materEnum.value,
    subcId,
    refresh: refreshOutformPage
  });
};

const isReturnOrder = (row: OutformRecord) => row.subcRemark?.includes("退货返工") === true;
const openSavedOrder = (row: OutformRecord) => isReturnOrder(row) ? openReturnOrderDialog(row.subcId) : openOrderDialog(row.subcId);
const printSavedOrder = (row: OutformRecord) => isReturnOrder(row)
  ? returnOrderDialogRef.value?.print(row.subcId)
  : orderDialogRef.value?.print(row.subcId);

const handleRowClick = (row: OutformRecord) => {
  proTableRef.value?.element?.toggleRowSelection(row);
};

const cancelSelect = () => {
  proTableRef.value?.element?.clearSelection();
};

// 导出当前筛选条件下的全部委外表单
const exportExcel = async () => {
  try {
    await ElMessageBox.confirm("确认导出当前筛选条件下的全部委外表单数据吗？", "导出确认", { type: "warning" });
  } catch {
    return;
  }
  const loading = ElLoading.service({ text: "正在导出..." });

  try {
    const currentSearchParam = { ...(proTableRef.value?.searchParam || {}) };
    const firstPage = await unwrapData(getOutformPageApi({ ...currentSearchParam, pageNum: 1, pageSize: 1 }));
    const records = firstPage.total
      ? (await unwrapData(getOutformPageApi({ ...currentSearchParam, pageNum: 1, pageSize: firstPage.total }))).records
      : [];
    const data = records.map(item => ({
      外发日期: formatOutgoingDate(item.subcDate),
      外发单号: item.subcNum,
      供应商: item.supName || "",
      物料编码: item.materNum || "",
      物料名称: item.materName || "",
      外发数量: item.number,
      已回货数量: item.backNumber || 0,
      未回货数量: item.notbackNumber || 0,
      状态: getStateLabel(item),
      整单备注: item.subcRemark || "",
      行备注: item.remark || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: [
        "外发日期",
        "外发单号",
        "供应商",
        "物料编码",
        "物料名称",
        "外发数量",
        "已回货数量",
        "未回货数量",
        "状态",
        "整单备注",
        "行备注"
      ]
    });
    worksheet["!cols"] = [12, 20, 18, 18, 22, 12, 14, 14, 12, 24, 24].map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "委外表单");
    XLSX.writeFile(workbook, `委外表单_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`成功导出 ${records.length} 条数据`);
  } catch {
    ElMessage.error("导出失败，请稍后重试");
  } finally {
    loading.close();
  }
};

const loadBatchSuppliers = async () => {
  try {
    const data = await unwrapData(getAllSup({ pageNum: 1, pageSize: 9999 }));
    batchSupplierOptions.value = (data?.records || []).map((item: Record<string, any>) => ({
      label: item.supName,
      value: item.id,
      callName: item.callName
    }));
  } catch {
    batchSupplierOptions.value = [];
  }
};

const loadAllOutformRecords = async () => {
  const records: OutformRecord[] = [];
  let pageNum = 1;
  let total = 0;

  try {
    do {
      const data = await unwrapData(getOutformPageApi({ pageNum, pageSize: OUTFORM_OPTION_PAGE_SIZE }));
      const pageRecords = data?.records || [];
      total = Number(data?.total || pageRecords.length || records.length);
      records.push(...pageRecords);
      if (!pageRecords.length) break;
      pageNum += 1;
    } while (records.length < total);

    allOutformRecords.value = records;
    isDynamicOptionsReady.value = true;
    isDynamicOptionsFailed.value = false;
  } catch {
    isDynamicOptionsFailed.value = true;
  } finally {
    syncDynamicSearchOptions();
  }
};

const refreshOutformPage = async () => {
  await proTableRef.value?.getTableList();
  await loadAllOutformRecords();
};

const buildRelatedGroups = async (rows: OutformRecord[]) => {
  const groups = await Promise.all(
    rows.map(async row => {
      const data = await unwrapData(getRelatedOutbackApi(row.id));
      return {
        outItem: row,
        records: data.records || []
      };
    })
  );
  return groups;
};

const openViewDialog = async (row: OutformRecord) => {
  const groups = await buildRelatedGroups([row]);
  detailDialogRef.value?.open({ mode: "view", groups });
};

const openDeleteDialog = async (rows: OutformRecord[]) => {
  if (!rows.length) return;
  pendingDeleteIds.value = rows.map(item => Number(item.id)).filter(Boolean);
  const groups = await buildRelatedGroups(rows);
  detailDialogRef.value?.open({ mode: "delete", groups });
};

const confirmDelete = async () => {
  if (!pendingDeleteIds.value.length) return;
  await deleteOutformApi(pendingDeleteIds.value);
  ElMessage.success("删除成功");
  pendingDeleteIds.value = [];
  await refreshOutformPage();
};

const handleSearchValueChange = (key: "supId" | "materId" | "state") => {
  lastChangedSearchKey.value = key;
  syncDynamicSearchOptions(key);
  nextTick(() => {
    if (lastChangedSearchKey.value === key) lastChangedSearchKey.value = undefined;
  });
};

watch(selectedSupId, () => handleSearchValueChange("supId"));
watch(selectedMaterId, () => handleSearchValueChange("materId"));
watch(selectedState, () => handleSearchValueChange("state"));
watch([dynamicSupplierEnum, dynamicMaterEnum, dynamicStateEnum], () => syncDynamicSearchOptions(), { deep: true });

onMounted(async () => {
  await dictStore.loadDicts(["sup", "mater"]);
  await loadBatchSuppliers();
  stateEnum.value = mapStateEnum(await unwrapData(getOutItemStateApi()));
  await nextTick();
  await loadAllOutformRecords();
  syncDynamicSearchOptions();
});
</script>

<style scoped lang="scss">
.outgoing-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #f4f8ff, #eef5ff 18%, #f8fbff 52%, #ffffff);
}

.hero-btn {
  border-radius: 14px;
  font-weight: 600;
}

.hero-btn--primary {
  border: none;
  background: linear-gradient(135deg, #155eef, #2563eb 48%, #0ea5e9);
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.22);
}

.hero-btn--ghost {
  border-color: rgba(21, 94, 239, 0.16);
  color: #155eef;
  background: rgba(255, 255, 255, 0.88);
}

.hero-btn--danger {
  border-color: rgba(217, 45, 32, 0.16);
  background: rgba(255, 255, 255, 0.88);
}

.selection-summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.selection-summary__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid rgba(21, 94, 239, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  line-height: 1;
}

.selection-summary__item--pending {
  border-color: rgba(14, 165, 233, 0.16);
  background: rgba(240, 249, 255, 0.9);
}

.selection-summary__label {
  font-size: 12px;
  font-weight: 400;
  color: #475467;
}

.selection-summary__value {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.selection-summary__clear {
  margin-left: 2px;
}

.pending-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(21, 94, 239, 0.08);
  color: #155eef;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pending-chip--zero {
  background: rgba(18, 183, 106, 0.1);
  color: #067647;
}

.pending-chip--danger {
  background: rgba(217, 45, 32, 0.12);
  color: #d92d20;
  box-shadow: inset 0 0 0 1px rgba(217, 45, 32, 0.08);
}

:deep(.table-main) {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.1), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), #ffffff);
  box-shadow: 0 28px 64px rgba(15, 23, 42, 0.08);
}

:deep(.table-header) {
  padding: 4px 4px 18px;
}

:deep(.el-table) {
  border-radius: 22px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background: linear-gradient(180deg, #eef4ff, #f8fbff);
  color: #1f2937;
  font-weight: 700;
}

:deep(.el-table .el-table__row:hover > td.el-table__cell) {
  background: rgba(37, 99, 235, 0.05);
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-pagination) {
  padding-top: 18px;
}
</style>
