<template>
  <el-dialog v-model="visible" title="批量新增外发回货" width="980px" :close-on-click-modal="false">
    <div class="batch-shell">
      <section class="hero-panel">
        <div>
          <p class="hero-panel__eyebrow">OUTBACK BATCH STUDIO</p>
          <h3>批量添加回货记录</h3>
          <p class="hero-panel__desc">首条外发明细选中后自动带出供应商，后续只展示同一供应商的数据，减少误选。</p>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span>当前条目数</span>
            <strong>{{ validRowCount }}</strong>
          </div>
          <div class="hero-stat">
            <span>锁定供应商</span>
            <strong>{{ headerForm.supName || "待选择" }}</strong>
          </div>
        </div>
      </section>

      <el-form :model="headerForm" label-width="92px" class="batch-header">
        <el-form-item label="回货日期">
          <el-date-picker
            v-model="headerForm.backDate"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="回货单号">
          <el-input v-model="headerForm.outbackNum" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input :model-value="headerForm.supName" readonly placeholder="选择外发明细后自动带出" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="headerForm.state" style="width: 100%">
            <el-option v-for="item in normalizedStateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="整单备注" class="full-row">
          <el-input v-model="headerForm.outbackRemark" />
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="rows" border class="batch-table" :row-class-name="getRowClassName">
      <el-table-column type="index" label="#" width="52" align="center" />
      <el-table-column label="外发明细" min-width="320">
        <template #default="{ row, $index }">
          <div class="select-row">
            <div class="select-card">
              <el-input :model-value="row.displayText" readonly />
              <div v-if="row.outItemId" class="select-card__hint">提交后未回：{{ formatPendingValue(getProjectedNotback(row)) }}</div>
            </div>
            <el-button type="primary" class="accent-btn" @click="openSelector($index)">选择</el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="回货数量" min-width="160">
        <template #default="{ row }">
          <el-input-number v-model="row.number" :min="1" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="行备注" min-width="220">
        <template #default="{ row }">
          <el-input v-model="row.remark" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="batch-actions">
      <el-button type="primary" plain @click="addRow">新增一行</el-button>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确认批量新增</el-button>
    </template>

    <OutItemSelector ref="selectorRef" @confirm="handleSelectOutItem" @confirm-multi="handleSelectOutItems" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import type { EnumProps } from "@/components/ProTable/interface";
import OutItemSelector from "./OutItemSelector.vue";
import {
  calcProjectedNotbackNumber,
  formatMaterialLabel,
  type OutbackBatchPayload,
  type OutformRecord
} from "../../service";

type BatchParams = {
  suppliers: Array<{ label: string; value: string | number }>;
  maters: Array<{ label: string; value: string | number; num?: string }>;
  stateOptions: EnumProps[];
  submitApi: (payload: OutbackBatchPayload) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const selectorRef = ref<InstanceType<typeof OutItemSelector> | null>(null);
const suppliers = ref<BatchParams["suppliers"]>([]);
const stateOptions = ref<EnumProps[]>([]);
let currentIndex = -1;
let submitApi: BatchParams["submitApi"] | null = null;
let getTableList: BatchParams["getTableList"];

const headerForm = ref({
  backDate: dayjs().format("YYYY-MM-DD"),
  outbackNum: "",
  supId: "" as string | number,
  supName: "",
  state: 101 as string | number,
  outbackRemark: ""
});

type BatchRow = {
  outItemId: number;
  number: number;
  remark: string;
  displayText: string;
  supId?: string | number;
  supName?: string;
  materName?: string;
  materNum?: string;
  notbackNumber?: number;
};

const rows = ref<BatchRow[]>([]);

const normalizedStateOptions = computed(() =>
  stateOptions.value
    .map(item => {
      const rawValue = item?.value;
      const value =
        typeof rawValue === "string" && rawValue.trim() && !Number.isNaN(Number(rawValue))
          ? Number(rawValue)
          : (rawValue as string | number);
      if (value === undefined || value === null || !item?.label) return null;
      return { label: String(item.label), value };
    })
    .filter(Boolean) as Array<{ label: string; value: string | number }>
);

const buildDisplayText = (row: OutformRecord) => `${row.materNum || ""} / ${row.materName || ""}`;

const validRows = computed(() => rows.value.filter(item => item.outItemId));
const validRowCount = computed(() => validRows.value.length);

const syncLockedSupplier = () => {
  const firstRow = validRows.value[0];
  if (!firstRow?.supId) {
    headerForm.value.supId = "";
    headerForm.value.supName = "";
    return;
  }

  headerForm.value.supId = firstRow.supId;
  headerForm.value.supName =
    firstRow.supName || suppliers.value.find(item => String(item.value) === String(firstRow.supId))?.label || "";
};

const getProjectedNotback = (row: BatchRow) =>
  calcProjectedNotbackNumber({
    currentNotbackNumber: row.notbackNumber,
    nextReceiptNumber: row.number
  });

const formatPendingValue = (value: number) => `${value > 0 ? "+" : ""}${value}`;

const getRowClassName = ({ row }: { row: BatchRow }) => (row.outItemId && getProjectedNotback(row) < 0 ? "is-danger-row" : "");

const addRow = () => {
  rows.value.push({
    outItemId: 0,
    number: 1,
    remark: "",
    displayText: ""
  });
};

const removeRow = (index: number) => {
  rows.value.splice(index, 1);
  syncLockedSupplier();
};

const open = (params: BatchParams) => {
  suppliers.value = params.suppliers;
  stateOptions.value = params.stateOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  headerForm.value = {
    backDate: dayjs().format("YYYY-MM-DD"),
    outbackNum: "",
    supId: "",
    supName: "",
    state: normalizedStateOptions.value[0]?.value ?? 101,
    outbackRemark: ""
  };
  rows.value = [];
  addRow();
  visible.value = true;
};

const openSelector = (index: number) => {
  currentIndex = index;
  selectorRef.value?.open({
    multiple: true,
    supId: headerForm.value.supId || undefined,
    supName: headerForm.value.supName || undefined
  });
};

const applyOutItem = (row: OutformRecord, index: number, keepRemark = "") => {
  rows.value[index] = {
    outItemId: row.id,
    number: Number(row.notbackNumber || 1),
    remark: keepRemark,
    displayText: buildDisplayText(row),
    supId: row.supId,
    supName: row.supName,
    materName: row.materName,
    materNum: row.materNum,
    notbackNumber: Number(row.notbackNumber || 0)
  };
  syncLockedSupplier();
};

const handleSelectOutItem = (row: OutformRecord) => {
  if (currentIndex < 0) return;
  applyOutItem(row, currentIndex, rows.value[currentIndex]?.remark || "");
};

const handleSelectOutItems = (selected: OutformRecord[]) => {
  if (!selected.length) return;
  const lockedSupplierId = headerForm.value.supId || selected[0]?.supId;
  const sameSupplierSelected = selected.filter(item => String(item.supId) === String(lockedSupplierId));
  const existedIds = new Set(rows.value.map(item => item.outItemId).filter(Boolean));
  const candidates = sameSupplierSelected.filter(item => !existedIds.has(item.id));
  if (!candidates.length) return;

  if (currentIndex < 0) currentIndex = rows.value.length ? rows.value.length - 1 : 0;
  if (!rows.value[currentIndex]) addRow();
  applyOutItem(candidates[0], currentIndex, rows.value[currentIndex]?.remark || "");

  candidates.slice(1).forEach(item => {
    rows.value.push({
      outItemId: item.id,
      number: Number(item.notbackNumber || 1),
      remark: "",
      displayText: buildDisplayText(item),
      supId: item.supId,
      supName: item.supName,
      materName: item.materName,
      materNum: item.materNum,
      notbackNumber: Number(item.notbackNumber || 0)
    });
  });

  syncLockedSupplier();

  if (sameSupplierSelected.length !== selected.length) {
    ElMessage.warning(`已自动锁定供应商为 ${headerForm.value.supName || "当前供应商"}，其他供应商明细未带入`);
  }
};

const confirmNegativeRows = async () => {
  const negativeRows = validRows.value.filter(item => getProjectedNotback(item) < 0);
  if (!negativeRows.length) return true;

  const materialText = negativeRows.map(item => formatMaterialLabel(item)).join("、");
  await ElMessageBox.confirm(
    `提交后以下物料的未回数量将为负数：${materialText}，是否继续？`,
    "未回数量提醒",
    {
      type: "warning",
      confirmButtonText: "继续提交",
      cancelButtonText: "返回修改"
    }
  );
  return true;
};

const submit = async () => {
  if (!headerForm.value.backDate || !headerForm.value.outbackNum || !headerForm.value.supId) {
    ElMessage.warning("请先填写表头信息");
    return;
  }
  if (!rows.value.length || rows.value.some(item => !item.outItemId || !item.number)) {
    ElMessage.warning("请补全批量明细");
    return;
  }
  if (!submitApi) return;

  try {
    await confirmNegativeRows();
  } catch (_error) {
    return;
  }

  await submitApi({
    header: {
      backDate: headerForm.value.backDate,
      outbackNum: headerForm.value.outbackNum,
      supId: headerForm.value.supId,
      state: Number(headerForm.value.state || 101),
      outbackRemark: headerForm.value.outbackRemark
    },
    rows: rows.value.map(item => ({
      outItemId: item.outItemId,
      number: Number(item.number),
      remark: item.remark
    }))
  });

  ElMessage.success("批量新增成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.batch-shell {
  margin-bottom: 16px;
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 22px;
  margin-bottom: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 34%),
    linear-gradient(135deg, #0f172a, #162456 46%, #0f766e 100%);
  color: #fff;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.18);
}

.hero-panel h3 {
  margin: 4px 0 8px;
  font-size: 24px;
  font-weight: 700;
}

.hero-panel__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.hero-panel__desc {
  margin: 0;
  max-width: 520px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 260px;
}

.hero-stat {
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.hero-stat span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.hero-stat strong {
  font-size: 18px;
  font-weight: 700;
}

.batch-header {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 18px 20px 4px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 32%),
    #f8fbff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.full-row {
  grid-column: 1 / -1;
}

.batch-table {
  margin-top: 12px;
}

:deep(.batch-table .el-table__inner-wrapper) {
  border-radius: 20px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}

:deep(.batch-table .is-danger-row td) {
  background: linear-gradient(90deg, rgba(254, 226, 226, 0.72), rgba(255, 255, 255, 0.92));
}

.batch-actions {
  margin-top: 14px;
}

.select-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  width: 100%;
}

.select-card {
  display: grid;
  gap: 6px;
}

.select-card__meta {
  font-size: 12px;
  color: #475467;
}

.select-card__hint {
  font-size: 12px;
  color: #155eef;
}

.accent-btn {
  align-self: start;
  border: none;
  background: linear-gradient(135deg, #155eef, #0ea5e9);
  box-shadow: 0 12px 24px rgba(21, 94, 239, 0.22);
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px 12px;
  background: linear-gradient(135deg, #020617, #1d4ed8 54%, #0f766e);
}

:deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #f6faff, #ffffff 24%);
}

:deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

@media (max-width: 960px) {
  .hero-panel {
    flex-direction: column;
  }

  .hero-stats {
    grid-template-columns: 1fr;
    min-width: auto;
  }

  .batch-header {
    grid-template-columns: 1fr;
  }
}
</style>
