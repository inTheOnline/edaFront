<template>
  <div class="outgoing-page outgoing-page--back">
    <ProTable
      ref="proTableRef"
      row-key="id"
      title="外发回执"
      :columns="columns"
      :request-api="getOutbackPageApi"
      :dataCallback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'setting', 'search']"
      :search-col="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }"
      @row-click="handleRowClick"
    >
      <template #tableHeader="scope">
        <el-button type="primary" class="hero-btn hero-btn--primary" :icon="CirclePlus" @click="openDrawer('新增')">新增回执</el-button>
        <el-button type="primary" plain class="hero-btn hero-btn--ghost" :icon="Upload" @click="openBatchDialog">批量增加</el-button>
        <el-button type="primary" plain class="hero-btn hero-btn--ghost" :icon="Download" @click="exportExcel">导出 Excel</el-button>
        <el-button
          type="danger"
          plain
          class="hero-btn hero-btn--danger"
          :icon="Delete"
          :disabled="!scope.isSelected"
          @click="deleteSelected(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <div class="selection-summary">
          <el-descriptions :column="1" size="small">
            <el-descriptions-item>
              <template #label>
                <span class="selection-summary__label">数量总计</span>
              </template>
              <span class="selection-summary__value">{{ Number(numberTotal).toLocaleString() }}</span>
            </el-descriptions-item>
          </el-descriptions>
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
        <el-button type="primary" link :icon="View" @click="openDrawer('查看', row)">查看</el-button>
        <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', row)">编辑</el-button>
        <el-button type="danger" link :icon="Delete" @click="deleteOne(row.id)">删除</el-button>
      </template>
    </ProTable>

    <UserDrawer ref="drawerRef" />
    <BatchAddDialog ref="batchDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { CircleClose, CirclePlus, Delete, Download, EditPen, Upload, View } from "@element-plus/icons-vue";
import { ElLoading, ElMessage, ElMessageBox } from "element-plus";
import * as XLSX from "xlsx";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, EnumProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
import BatchAddDialog from "./components/BatchAddDialog.vue";
import UserDrawer from "./components/UserDrawer.vue";
import {
  createOutbackApi,
  createOutbackBatchApi,
  deleteOutbackApi,
  formatOutgoingDate,
  getOutbackPageApi,
  getOutbackStateApi,
  mapStateEnum,
  type OutbackRecord,
  unwrapData,
  updateOutbackApi
} from "../service";

const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const batchDialogRef = ref<InstanceType<typeof BatchAddDialog> | null>(null);
const supplierEnum = computed(() => dictStore.dictMap.sup || []);
const materEnum = computed(() => dictStore.dictMap.mater || []);
const stateEnum = ref<EnumProps[]>([]);
const selectedList = computed(() => proTableRef.value?.selectedList || []);
const numberTotal = computed(() => selectedList.value.reduce((sum, item) => sum + Number(item.number || 0), 0));

const dataCallback = (data: { records: OutbackRecord[]; total: number }) => ({
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
    prop: "backDate",
    label: "回执日期",
    width: 120,
    render: ({ row }) => formatOutgoingDate(row.backDate),
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
    prop: "outbackNum",
    label: "回执单号",
    minWidth: 160,
    search: {
      el: "input",
      props: { placeholder: "请输入回执单号" }
    }
  },
  { prop: "subcNum", label: "对应外发单", minWidth: 160 },
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
  { prop: "number", label: "回执数量", width: 110 },
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
  { prop: "outbackRemark", label: "整单备注", minWidth: 180 },
  { prop: "remark", label: "行备注", minWidth: 180 },
  { prop: "operation", label: "操作", fixed: "right", width: 220 }
]);

const openDrawer = (title: string, row: Partial<OutbackRecord> = {}) => {
  drawerRef.value?.acceptParams({
    title,
    isView: title === "查看",
    row,
    suppliers: supplierEnum.value,
    maters: materEnum.value,
    stateOptions: stateEnum.value,
    submitApi: (payload, editId) => (editId ? updateOutbackApi(editId, payload) : createOutbackApi(payload)),
    getTableList: proTableRef.value?.getTableList
  });
};

const openBatchDialog = () => {
  batchDialogRef.value?.open({
    suppliers: supplierEnum.value,
    maters: materEnum.value,
    stateOptions: stateEnum.value,
    submitApi: createOutbackBatchApi,
    getTableList: proTableRef.value?.getTableList
  });
};

const handleRowClick = (row: OutbackRecord) => {
  proTableRef.value?.element?.toggleRowSelection(row);
};

const cancelSelect = () => {
  proTableRef.value?.element?.clearSelection();
};

// 导出当前筛选条件下的全部回执
const exportExcel = async () => {
  try {
    await ElMessageBox.confirm("确认导出当前筛选条件下的全部回执数据吗？", "导出确认", { type: "warning" });
  } catch {
    return;
  }
  const loading = ElLoading.service({ text: "正在导出..." });

  try {
    const searchParam = { ...(proTableRef.value?.searchParam || {}) };
    const firstPage = await unwrapData(getOutbackPageApi({ ...searchParam, pageNum: 1, pageSize: 1 }));
    const records = firstPage.total
      ? (await unwrapData(getOutbackPageApi({ ...searchParam, pageNum: 1, pageSize: firstPage.total }))).records
      : [];
    const data = records.map(item => ({
      回执日期: formatOutgoingDate(item.backDate),
      回执单号: item.outbackNum,
      对应外发单: item.subcNum || "",
      供应商: item.supName || "",
      物料编码: item.materNum || "",
      物料名称: item.materName || "",
      回执数量: item.number,
      状态: item.stateLabel || item.state,
      整单备注: item.outbackRemark || "",
      行备注: item.remark || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: ["回执日期", "回执单号", "对应外发单", "供应商", "物料编码", "物料名称", "回执数量", "状态", "整单备注", "行备注"]
    });
    worksheet["!cols"] = [12, 20, 20, 18, 18, 22, 12, 12, 24, 24].map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "委外回执");
    XLSX.writeFile(workbook, `委外回执_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`成功导出 ${records.length} 条数据`);
  } catch {
    ElMessage.error("导出失败，请稍后重试");
  } finally {
    loading.close();
  }
};

const deleteSelected = async (ids: number[]) => {
  if (!ids.length) return;
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 条回执记录吗？`, "删除确认", { type: "warning" });
    await deleteOutbackApi(ids);
    proTableRef.value?.getTableList();
  } catch (_error) {
    // ignore cancel
  }
};

const deleteOne = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除当前回执记录吗？", "删除确认", { type: "warning" });
    await deleteOutbackApi([id]);
    proTableRef.value?.getTableList();
  } catch (_error) {
    // ignore cancel
  }
};

onMounted(async () => {
  await dictStore.loadDicts(["sup", "mater"]);
  stateEnum.value = mapStateEnum(await unwrapData(getOutbackStateApi()));
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
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.12), transparent 26%),
    linear-gradient(180deg, #f7fbff, #eef7f9 18%, #ffffff 52%);
}

.hero-btn {
  border-radius: 14px;
  font-weight: 600;
}

.hero-btn--primary {
  border: none;
  background: linear-gradient(135deg, #0f766e, #0ea5e9 56%, #2563eb);
  box-shadow: 0 16px 28px rgba(14, 165, 233, 0.18);
}

.hero-btn--ghost {
  border-color: rgba(14, 165, 233, 0.16);
  color: #0369a1;
  background: rgba(255, 255, 255, 0.88);
}

.hero-btn--danger {
  border-color: rgba(217, 45, 32, 0.16);
  background: rgba(255, 255, 255, 0.88);
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.selection-summary__label {
  font-size: 14px;
  font-weight: 400;
}

.selection-summary__value {
  font-size: 18px;
  color: var(--el-color-primary);
}

.selection-summary__clear {
  margin-left: 2px;
}

:deep(.table-main) {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 24%),
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
  background: linear-gradient(180deg, #edfdfa, #f7fbff);
  color: #1f2937;
  font-weight: 700;
}

:deep(.el-table .el-table__row:hover > td.el-table__cell) {
  background: rgba(14, 165, 233, 0.05);
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-pagination) {
  padding-top: 18px;
}
</style>
