<template>
  <el-dialog v-model="visible" title="批量添加采购订单明细" width="90%" :close-on-click-modal="false">
    <el-form :model="header" label-width="98px" class="batch-header">
      <el-form-item label="采购日期">
        <el-date-picker v-model="header.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="采购订单号">
        <el-input v-model="header.purchaseOrderNum" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-select v-model="header.supId" filterable clearable style="width: 100%" @change="handleHeaderSupChange">
          <el-option v-for="item in supOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="header.remark" />
      </el-form-item>
      <el-button-group class="mode-switch">
        <el-button :type="mode === 'withRequisition' ? 'primary' : 'default'" @click="switchMode('withRequisition')">
          有请购
        </el-button>
        <el-button :type="mode === 'withoutRequisition' ? 'primary' : 'default'" @click="switchMode('withoutRequisition')">
          无请购
        </el-button>
      </el-button-group>
    </el-form>

    <div class="selector-actions" v-if="mode === 'withRequisition'">
      <el-button type="primary" plain @click="openRequisitionSelector">选择请购明细</el-button>
    </div>

    <el-table :data="rows" border>
      <el-table-column type="index" width="52" align="center" />
      <el-table-column label="请购来源" width="110">
        <template #default="{ row }">
          <span>{{ row.requisitionId || "无请购" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="客户订单" min-width="140">
        <template #default="{ row }">
          <el-input v-model="row.custOrderNum" :readonly="mode === 'withRequisition'" />
        </template>
      </el-table-column>
      <el-table-column label="品名" min-width="190">
        <template #default="{ row }">
          <el-select
            v-model="row.materId"
            filterable
            clearable
            style="width: 100%"
            :disabled="mode === 'withRequisition'"
            @change="value => handleMaterChange(row, value)"
          >
            <el-option v-for="item in materOptions" :key="item.value" :label="formatMaterLabel(item)" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="原材料" min-width="220">
        <template #default="{ row }">
          <el-select
            v-model="row.rawId"
            filterable
            clearable
            style="width: 100%"
            :disabled="mode === 'withRequisition'"
            @change="value => handleRawChange(row, value)"
          >
            <el-option v-for="item in rawOptions" :key="item.value" :label="formatRawLabel(item)" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="采购数量" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.purchaseNumber" :min="0" :precision="0" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="采购重量" width="140">
        <template #default="{ row }">
          <el-input-number v-model="row.purchaseWeight" :min="0" :precision="4" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="单价" width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.unitPrice" :min="0" :precision="4" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="140">
        <template #default="{ row }">
          <el-input v-model="row.remark" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="batch-actions">
      <el-button type="primary" plain @click="addRow">添加一行</el-button>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>

  <RequisitionSelector ref="selectorRef" @confirm="handleSelectRequisitions" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type {
  OrderItemBatchPayload,
  RawPurchaseOption,
  RawPurchaseRequisition
} from "@/api/interface/buy/rawPurchase";
import RequisitionSelector from "./RequisitionSelector.vue";

type BatchRow = OrderItemBatchPayload["rows"][number];
type Mode = OrderItemBatchPayload["mode"];
type OpenParams = {
  materOptions: RawPurchaseOption[];
  rawOptions: RawPurchaseOption[];
  supOptions: RawPurchaseOption[];
  submitApi: (data: OrderItemBatchPayload) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const selectorRef = ref<InstanceType<typeof RequisitionSelector> | null>(null);
const mode = ref<Mode>("withRequisition");
const materOptions = ref<RawPurchaseOption[]>([]);
const rawOptions = ref<RawPurchaseOption[]>([]);
const supOptions = ref<RawPurchaseOption[]>([]);
const rows = ref<BatchRow[]>([]);
const header = ref({
  purchaseDate: "",
  purchaseOrderId: "" as string | number,
  purchaseOrderNum: "",
  supId: "" as string | number,
  supName: "",
  remark: ""
});
let submitApi: OpenParams["submitApi"] | null = null;
let getTableList: OpenParams["getTableList"];

const today = () => new Date().toISOString().slice(0, 10);
const formatMaterLabel = (item: RawPurchaseOption) => `${item.label || ""}${item.num ? `（${item.num}）` : ""}`;
const formatRawLabel = (item: RawPurchaseOption) => `${item.rawNum || item.label || ""}${item.rawSpecs ? ` / ${item.rawSpecs}` : ""}`;

const buildEmptyRow = (): BatchRow => ({
  requisitionId: null,
  custOrderNum: "",
  materId: "",
  materNum: "",
  materName: "",
  rawId: "",
  rawNum: "",
  rawSpecs: "",
  orderNumber: 0,
  purchaseNumber: 0,
  purchaseWeight: 0,
  unitPrice: 0,
  remark: ""
});

const addRow = () => rows.value.push(buildEmptyRow());
const removeRow = (index: number) => rows.value.splice(index, 1);

const switchMode = (value: Mode) => {
  mode.value = value;
  rows.value = [];
  if (value === "withoutRequisition") addRow();
};

const handleHeaderSupChange = (value: string | number) => {
  const item = supOptions.value.find(option => String(option.value) === String(value));
  header.value.supName = item?.label || "";
};

const handleMaterChange = (row: BatchRow, value: string | number) => {
  const item = materOptions.value.find(option => String(option.value) === String(value));
  row.materNum = item?.num || item?.materNum || "";
  row.materName = item?.label || item?.materName || "";
};

const handleRawChange = (row: BatchRow, value: string | number) => {
  const item = rawOptions.value.find(option => String(option.value) === String(value));
  row.rawNum = item?.rawNum || item?.label || "";
  row.rawSpecs = item?.rawSpecs || "";
};

const openRequisitionSelector = () => selectorRef.value?.open();

const handleSelectRequisitions = (list: RawPurchaseRequisition[]) => {
  rows.value = list.map(item => ({
    requisitionId: item.id ?? null,
    custOrderId: item.custOrderId || "",
    custOrderNum: item.custOrderNum || "",
    materId: item.materId || "",
    materNum: item.materNum || "",
    materName: item.materName || "",
    rawId: item.rawId || "",
    rawNum: item.rawNum || "",
    rawSpecs: item.rawSpecs || "",
    relationId: item.relationId,
    useType: item.useType,
    sheetOutputNumber: item.sheetOutputNumber,
    rollUnitWeight: item.rollUnitWeight,
    orderNumber: Number(item.requisitionNumber || 0),
    purchaseNumber: Number(item.notPurchaseNumber ?? item.requisitionNumber ?? 0),
    purchaseWeight: Number(item.requisitionWeight || 0),
    unitPrice: 0,
    remark: item.remark || ""
  }));
};

const open = (params: OpenParams) => {
  materOptions.value = params.materOptions;
  rawOptions.value = params.rawOptions;
  supOptions.value = params.supOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  mode.value = "withRequisition";
  header.value = { purchaseDate: today(), purchaseOrderId: "", purchaseOrderNum: "", supId: "", supName: "", remark: "" };
  rows.value = [];
  visible.value = true;
};

const submit = async () => {
  if (!header.value.purchaseDate) return ElMessage.warning("请选择采购日期");
  if (!header.value.purchaseOrderNum) return ElMessage.warning("请输入采购订单号");
  if (!rows.value.length) return ElMessage.warning("请添加明细");
  if (rows.value.some(item => !item.rawNum || !item.rawSpecs || !item.purchaseNumber)) {
    return ElMessage.warning("请补全原材料和采购数量");
  }
  if (!submitApi) return;
  await submitApi({ mode: mode.value, header: header.value, rows: rows.value });
  ElMessage.success("批量添加成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.batch-header {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: start;
}

.mode-switch {
  margin-top: 1px;
}

.selector-actions,
.batch-actions {
  margin: 12px 0;
}
</style>
