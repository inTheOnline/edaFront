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
        <el-button type="primary" plain class="hero-btn hero-btn--ghost" :icon="Upload" @click="openBatchDialog">批量增加</el-button>
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
        </div>
      </template>

      <template #operation="{ row }">
        <el-button type="primary" link :icon="View" @click="openViewDialog(row)">查看</el-button>
        <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', row)">编辑</el-button>
        <el-button type="danger" link :icon="Delete" @click="openDeleteDialog([row])">删除</el-button>
      </template>
    </ProTable>

    <UserDrawer ref="drawerRef" />
    <BatchAddDialog ref="batchDialogRef" />
    <OutbackDetailDialog ref="detailDialogRef" @confirm-delete="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { CirclePlus, Delete, EditPen, Upload, View } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, EnumProps } from "@/components/ProTable/interface";
import { getAllSup } from "@/api/modules/sup";
import { useDictStore } from "@/stores/modules/dict";
import BatchAddDialog from "./components/BatchAddDialog.vue";
import OutbackDetailDialog from "./components/OutbackDetailDialog.vue";
import UserDrawer from "./components/UserDrawer.vue";
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

const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const batchDialogRef = ref<InstanceType<typeof BatchAddDialog> | null>(null);
const detailDialogRef = ref<InstanceType<typeof OutbackDetailDialog> | null>(null);
const supplierEnum = computed(() => dictStore.dictMap.sup || []);
const materEnum = computed(() => dictStore.dictMap.mater || []);
const batchSupplierOptions = ref<Array<{ label: string; value: string | number; callName?: string }>>([]);
const stateEnum = ref<EnumProps[]>([]);
const pendingDeleteIds = ref<number[]>([]);
const selectedList = computed(() => proTableRef.value?.selectedList || []);
const numberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.number || 0), 0));
const backNumberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.backNumber || 0), 0));
const notbackNumberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.notbackNumber || 0), 0));

const dataCallback = (data: { records: OutformRecord[]; total: number }) => ({
  list: data.records,
  total: data.total
});

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
    enum: supplierEnum,
    search: {
      el: "select",
      props: { filterable: true, placeholder: "请选择供应商" }
    }
  },
  {
    prop: "materId",
    label: "物料编码",
    minWidth: 140,
    enum: materEnum,
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
    enum: stateEnum,
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
    getTableList: proTableRef.value?.getTableList
  });
};

const openBatchDialog = () => {
  batchDialogRef.value?.open({
    suppliers: batchSupplierOptions.value.length ? batchSupplierOptions.value : supplierEnum.value,
    maters: materEnum.value,
    stateOptions: stateEnum.value,
    submitApi: createOutformBatchApi,
    getTableList: proTableRef.value?.getTableList
  });
};

const handleRowClick = (row: OutformRecord) => {
  proTableRef.value?.element?.toggleRowSelection(row);
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
  proTableRef.value?.getTableList();
};

onMounted(async () => {
  await dictStore.loadDicts(["sup", "mater"]);
  await loadBatchSuppliers();
  stateEnum.value = mapStateEnum(await unwrapData(getOutItemStateApi()));
});
</script>

<style scoped lang="scss">
.outgoing-page {
  min-height: calc(100vh - 120px);
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
