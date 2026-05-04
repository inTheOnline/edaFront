<template>
  <el-dialog v-model="visible" title="选择外发明细" width="980px" :close-on-click-modal="false">
    <div v-if="lockedSupplierLabel" class="locked-banner">
      <span class="locked-banner__label">已锁定供应商</span>
      <strong>{{ lockedSupplierLabel }}</strong>
      <span>当前仅展示该供应商的外发明细</span>
    </div>

    <div class="selector-toolbar">
      <el-input v-model="query.subcNum" placeholder="外发单号" clearable />
      <el-input v-model="query.materNum" placeholder="物料编码" clearable />
      <el-input v-model="query.materName" placeholder="物料名称" clearable />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      border
      height="420"
      row-key="id"
      :highlight-current-row="!multiple"
      @row-click="handleRowClick"
      @current-change="handleCurrentChange"
      @selection-change="handleSelectionChange"
      @row-dblclick="confirm"
    >
      <el-table-column v-if="multiple" type="selection" width="52" align="center" />
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="subcNum" label="外发单号" min-width="150" />
      <el-table-column prop="supName" label="供应商" min-width="140" />
      <el-table-column prop="materNum" label="物料编码" min-width="120" />
      <el-table-column prop="materName" label="物料名称" min-width="160" />
      <el-table-column prop="number" label="外发数量" width="110" />
      <el-table-column prop="backNumber" label="已回货数量" width="110" />
      <el-table-column prop="notbackNumber" label="未回货数量" width="110" />
      <el-table-column prop="stateLabel" label="状态" width="110" />
    </el-table>

    <div class="selector-pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @current-change="fetchTableData"
        @size-change="fetchTableData"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { OutformRecord } from "../../service";
import { getOutformPageApi, unwrapData } from "../../service";

type OpenOptions = {
  multiple?: boolean;
  supId?: string | number;
  supName?: string;
};

const visible = ref(false);
const tableRef = ref();
const tableData = ref<OutformRecord[]>([]);
const currentRow = ref<OutformRecord | null>(null);
const selectedRows = ref<OutformRecord[]>([]);
const multiple = ref(false);
const lockedSupId = ref<string | number>("");
const lockedSupplierLabel = ref("");
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const query = reactive({
  subcNum: "",
  materNum: "",
  materName: ""
});

const emit = defineEmits<{
  confirm: [row: OutformRecord];
  "confirm-multi": [rows: OutformRecord[]];
}>();

const fetchTableData = async () => {
  const data = await unwrapData(
    getOutformPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      supId: lockedSupId.value || undefined,
      subcNum: query.subcNum || undefined,
      materNum: query.materNum || undefined,
      materName: query.materName || undefined
    })
  );
  tableData.value = (data.records || []).filter(item => (item.notbackNumber || 0) > 0);
  total.value = data.total || 0;
};

const open = async (options: OpenOptions = {}) => {
  visible.value = true;
  pageNum.value = 1;
  currentRow.value = null;
  selectedRows.value = [];
  multiple.value = !!options.multiple;
  lockedSupId.value = options.supId ?? "";
  lockedSupplierLabel.value = options.supName || "";
  await fetchTableData();
};

const search = async () => {
  pageNum.value = 1;
  await fetchTableData();
};

const reset = async () => {
  query.subcNum = "";
  query.materNum = "";
  query.materName = "";
  pageNum.value = 1;
  await fetchTableData();
};

const handleCurrentChange = (row: OutformRecord | null) => {
  if (!multiple.value) currentRow.value = row;
};

const handleSelectionChange = (rows: OutformRecord[]) => {
  if (multiple.value) selectedRows.value = rows;
};

const handleRowClick = (row: OutformRecord) => {
  if (multiple.value) {
    tableRef.value?.toggleRowSelection?.(row);
    return;
  }

  currentRow.value = row;
  tableRef.value?.setCurrentRow?.(row);
};

const confirm = () => {
  if (multiple.value) {
    if (!selectedRows.value.length) {
      ElMessage.warning("请至少选择一条外发明细");
      return;
    }
    emit("confirm-multi", selectedRows.value);
    visible.value = false;
    return;
  }

  if (!currentRow.value) {
    ElMessage.warning("请选择外发明细");
    return;
  }
  emit("confirm", currentRow.value);
  visible.value = false;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.locked-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(27, 98, 240, 0.16);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(27, 98, 240, 0.12), rgba(20, 184, 166, 0.1)),
    #f8fbff;
  color: #1f2937;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.locked-banner__label {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(27, 98, 240, 0.14);
  color: #155eef;
  font-size: 12px;
  font-weight: 600;
}

.selector-toolbar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto auto;
  gap: 12px;
  margin-bottom: 16px;
}

:deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px 14px;
  background: linear-gradient(135deg, #0f172a, #1d4ed8 55%, #14b8a6);
}

:deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 30%),
    linear-gradient(180deg, #f8fbff, #ffffff 26%);
}

:deep(.el-dialog__footer) {
  padding: 0 24px 24px;
  background: transparent;
}

:deep(.el-table) {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.selector-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1100px) {
  .selector-toolbar {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
