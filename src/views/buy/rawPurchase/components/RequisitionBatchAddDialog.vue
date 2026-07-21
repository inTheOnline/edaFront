<template>
  <el-dialog v-model="visible" title="批量添加请购明细" width="92%" :close-on-click-modal="false">
    <el-form :model="header" label-width="98px" class="batch-header">
      <el-form-item label="请购日期">
        <el-date-picker v-model="header.requisitionDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="申请人">
        <el-select v-model="header.applyUserId" filterable clearable style="width: 100%">
          <el-option v-for="item in userOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="同步生成采购">
        <el-switch v-model="autoCreatePurchase" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="header.remark" />
      </el-form-item>
      <el-button-group class="mode-switch">
        <el-button :type="mode === 'withOrder' ? 'primary' : 'default'" @click="switchMode('withOrder')">绑定订单</el-button>
        <el-button :type="mode === 'withoutOrder' ? 'primary' : 'default'" @click="switchMode('withoutOrder')">不绑定订单</el-button>
      </el-button-group>
    </el-form>

    <div v-if="autoCreatePurchase" class="purchase-panel">
      <div class="purchase-panel__side">
        <div class="purchase-panel__title">采购信息</div>
        <div class="purchase-panel__desc">单号由后端生成</div>
      </div>
      <div class="purchase-panel__form">
        <FormProvider :form="purchaseForm">
          <SchemaField :schema="purchaseSchema" />
        </FormProvider>
      </div>
    </div>

    <div v-if="mode === 'withOrder'" class="selector-actions">
      <el-button type="primary" plain @click="openOrderSelector">选择订单条目</el-button>
    </div>

    <el-table :data="rows" border>
      <el-table-column type="index" width="52" align="center" />
      <el-table-column v-if="mode === 'withOrder'" label="订单编号" min-width="170">
        <template #default="{ row }">
          <el-input v-model="row.custOrderNum" readonly />
        </template>
      </el-table-column>
      <el-table-column label="产品/原材料" min-width="280">
        <template #default="{ row }">
          <el-select
            v-model="row.relationKey"
            filterable
            clearable
            style="width: 100%"
            placeholder="请选择品名或原材料"
            :disabled="mode === 'withOrder' && !!row.custOrderId && row.lockRelation"
            @change="value => handleRelationChange(row, value)"
          >
            <el-option v-for="item in relationOptions" :key="item.value" :label="formatRelationLabel(item)" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="用料类型" width="96" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.useType" :type="row.useType === 'sheet' ? 'success' : 'warning'">
            {{ formatUseType(row.useType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="每张产出" width="110">
        <template #default="{ row }">
          <span>{{ row.sheetOutputNumber ?? "" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单个重量" width="110">
        <template #default="{ row }">
          <span>{{ row.rollUnitWeight ?? "" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="请购数量" width="130">
        <template #default="{ row }">
          <el-input-number
            v-model="row.requisitionNumber"
            :min="0"
            :precision="0"
            :controls="false"
            :value-on-clear="null"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column label="请购重量" width="145">
        <template #default="{ row }">
          <el-input-number
            v-model="row.requisitionWeight"
            :min="0"
            :precision="4"
            :controls="false"
            :value-on-clear="null"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
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
  <CustOrderItemSelector ref="orderSelectorRef" @confirm="handleSelectOrders" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/vue";
import { DatePicker, FormItem, Input, InputNumber, Select } from "@formily/element-plus";
import type { RawMaterOption, RawPurchaseOption, RequisitionBatchPayload } from "@/api/interface/buy/rawPurchase";
import CustOrderItemSelector from "./CustOrderItemSelector.vue";

type BatchMode = "withOrder" | "withoutOrder";
type BatchRow = RequisitionBatchPayload["rows"][number] & { relationKey?: string; lockRelation?: boolean };
type PurchaseHeader = NonNullable<RequisitionBatchPayload["purchaseHeader"]>;
type OpenParams = {
  userOptions: RawPurchaseOption[];
  rawMaterOptions: RawMaterOption[];
  currentUserId?: number | string;
  supOptions: RawPurchaseOption[];
  materOptions?: RawPurchaseOption[];
  rawOptions?: RawPurchaseOption[];
  submitApi: (data: RequisitionBatchPayload) => Promise<unknown>;
  getTableList?: () => void;
};

const { SchemaField } = createSchemaField({
  components: { DatePicker, FormItem, Input, InputNumber, Select }
});

const visible = ref(false);
const autoCreatePurchase = ref(false);
const mode = ref<BatchMode>("withoutOrder");
const orderSelectorRef = ref<InstanceType<typeof CustOrderItemSelector> | null>(null);
const userOptions = ref<RawPurchaseOption[]>([]);
const rawMaterOptions = ref<RawMaterOption[]>([]);
const supOptions = ref<RawPurchaseOption[]>([]);
const rows = ref<BatchRow[]>([]);
const header = ref({ requisitionDate: "", applyUserId: "" as string | number, remark: "" });
const purchaseForm = createForm();
let submitApi: OpenParams["submitApi"] | null = null;
let getTableList: OpenParams["getTableList"];

const today = () => new Date().toISOString().slice(0, 10);
const formatUseType = (value?: string) => (value === "sheet" ? "张料" : value === "roll" ? "卷料" : "");
const hasValue = (value: unknown) => value !== null && value !== undefined && value !== "";

const relationOptions = computed(() =>
  rawMaterOptions.value.map(item => ({
    ...item,
    value: `${item.relationId}-${item.useType}`,
    label: formatRelationLabel(item)
  }))
);

const purchaseSchema = computed(() => ({
  type: "object",
  properties: {
    purchaseDate: {
      type: "string",
      title: "采购日期",
      required: true,
      "x-decorator": "FormItem",
      "x-component": "DatePicker",
      "x-component-props": { valueFormat: "YYYY-MM-DD", style: { width: "180px" } }
    },
    supId: {
      type: "string",
      title: "供应商",
      enum: supOptions.value,
      "x-decorator": "FormItem",
      "x-component": "Select",
      "x-component-props": { filterable: true, clearable: true, style: { width: "260px" } }
    },
    unitPrice: {
      type: "number",
      title: "单价",
      "x-decorator": "FormItem",
      "x-component": "InputNumber",
      "x-component-props": { min: 0, precision: 4, controlsPosition: "right", class: "purchase-price-input" }
    },
    remark: {
      type: "string",
      title: "采购备注",
      "x-decorator": "FormItem",
      "x-component": "Input",
      "x-component-props": { clearable: true }
    }
  }
}));

watch(autoCreatePurchase, value => {
  if (!value) return;
  purchaseForm.setValues({ purchaseDate: today(), unitPrice: 0 }, "merge");
});

const formatRelationLabel = (item: Partial<RawMaterOption>) => {
  const materText = `${item.materName || ""}${item.materNum ? `（${item.materNum}）` : ""}`;
  return `${materText} / ${formatUseType(item.useType)}${item.rawSpecs ? ` / ${item.rawSpecs}` : ""}`;
};

const buildEmptyRow = (): BatchRow => ({
  custOrderId: "",
  custOrderNum: "",
  materId: "",
  materNum: "",
  materName: "",
  rawId: "",
  rawNum: "",
  rawSpecs: "",
  relationId: "",
  useType: undefined,
  sheetOutputNumber: undefined,
  rollUnitWeight: undefined,
  requisitionNumber: null,
  requisitionWeight: null,
  remark: "",
  relationKey: "",
  lockRelation: false
});

const addRow = () => rows.value.push(buildEmptyRow());
const removeRow = (index: number) => rows.value.splice(index, 1);

const switchMode = (value: BatchMode) => {
  mode.value = value;
  rows.value = [];
  if (value === "withoutOrder") addRow();
};

const openOrderSelector = () => orderSelectorRef.value?.open();

const handleRelationChange = (row: BatchRow, value: string) => {
  const item = relationOptions.value.find(option => String(option.value) === String(value));
  row.relationId = item?.relationId || "";
  row.useType = item?.useType;
  row.materId = item?.materId || "";
  row.materNum = item?.materNum || "";
  row.materName = item?.materName || "";
  row.rawId = item?.rawId || "";
  row.rawNum = item?.rawNum || "";
  row.rawSpecs = item?.rawSpecs || "";
  row.sheetOutputNumber = item?.sheetOutputNumber;
  row.rollUnitWeight = item?.rollUnitWeight;
};

const isSameValue = (left: unknown, right: unknown) => hasValue(left) && hasValue(right) && String(left) === String(right);

const matchRelationByOrder = (order: any) => {
  const exactRelation = relationOptions.value.find(
    item => isSameValue(item.relationId, order.relationId) && (!order.useType || isSameValue(item.useType, order.useType))
  );
  if (exactRelation) return { relation: exactRelation, lockRelation: true };

  const exactRaw = relationOptions.value.find(
    item =>
      (isSameValue(item.rawId, order.rawId) || isSameValue(item.rawNum, order.rawNum)) &&
      (isSameValue(item.materId, order.materId) || isSameValue(item.materNum, order.materNum))
  );
  if (exactRaw) return { relation: exactRaw, lockRelation: true };

  const matches = relationOptions.value.filter(item => {
    if (isSameValue(item.materId, order.materId)) return true;
    if (isSameValue(item.materNum, order.materNum)) return true;
    return isSameValue(item.materName, order.materName);
  });

  if (!matches.length) return null;
  return { relation: matches[0], lockRelation: matches.length === 1 };
};

const buildRowFromOrder = (order: any): BatchRow => {
  const row = buildEmptyRow();
  row.custOrderId = order.id || order.custOrderId || "";
  row.custOrderNum = order.orderNum || order.custOrderNum || "";
  row.materId = order.materId || "";
  row.materNum = order.materNum || "";
  row.materName = order.materName || "";
  row.requisitionNumber = order.notAlreadyNumber ?? null;
  row.lockRelation = false;
  const matchResult = matchRelationByOrder(order);
  if (matchResult) {
    row.relationKey = matchResult.relation.value;
    handleRelationChange(row, matchResult.relation.value);
    row.lockRelation = matchResult.lockRelation;
  }
  return row;
};

const handleSelectOrders = (orders: any[]) => {
  if (!orders.length) return;
  rows.value = orders.map(buildRowFromOrder);
  ElMessage.success(`已选择 ${orders.length} 条订单条目`);
};

const open = (params: OpenParams) => {
  userOptions.value = params.userOptions;
  rawMaterOptions.value = params.rawMaterOptions || [];
  supOptions.value = params.supOptions || [];
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  autoCreatePurchase.value = false;
  mode.value = "withoutOrder";
  purchaseForm.reset();
  header.value = { requisitionDate: today(), applyUserId: params.currentUserId || "", remark: "" };
  rows.value = [];
  addRow();
  visible.value = true;
};

const buildPurchaseHeader = async (): Promise<PurchaseHeader | undefined> => {
  if (!autoCreatePurchase.value) return undefined;
  await purchaseForm.validate();
  const values = purchaseForm.values as PurchaseHeader;
  const sup = supOptions.value.find(item => String(item.value) === String(values.supId));
  return {
    ...values,
    supName: sup?.label || values.supName || ""
  };
};

const submit = async () => {
  if (!header.value.requisitionDate) return ElMessage.warning("请选择请购日期");
  if (!rows.value.length) return ElMessage.warning("请添加明细");
  if (mode.value === "withOrder" && rows.value.some(item => !item.custOrderId)) {
    return ElMessage.warning("绑定订单模式下请先选择订单条目");
  }
  if (rows.value.some(item => !item.rawNum || !item.rawSpecs || !hasValue(item.requisitionNumber) && !hasValue(item.requisitionWeight))) {
    return ElMessage.warning("请补全原材料，并且请购数量和请购重量至少填写一个");
  }
  if (!submitApi) return;
  const purchaseHeader = await buildPurchaseHeader().catch(() => undefined);
  if (autoCreatePurchase.value && !purchaseHeader) return;
  const submitRows: RequisitionBatchPayload["rows"] = rows.value.map(({ relationKey, lockRelation, ...item }) => {
    if (mode.value === "withoutOrder") {
      const { custOrderId, custOrderNum, ...withoutOrderItem } = item;
      return withoutOrderItem;
    }
    return item;
  });
  await submitApi({ header: header.value, autoCreatePurchase: autoCreatePurchase.value, purchaseHeader, rows: submitRows });
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

.purchase-panel {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #ffffff;
}

.purchase-panel__side {
  min-height: 52px;
  padding-right: 18px;
  border-right: 1px solid #ebeef5;
}

.purchase-panel__title {
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.purchase-panel__desc {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.purchase-panel__form {
  min-width: 0;
}

.purchase-panel__form :deep(.formily-element-plus-form) {
  display: grid;
  grid-template-columns: 180px 260px 160px minmax(260px, 1fr);
  gap: 12px 16px;
  align-items: start;
}

.purchase-panel__form :deep(.formily-element-plus-form-item) {
  margin-bottom: 0;
}

.purchase-panel__form :deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
}

.purchase-panel__form :deep(.purchase-price-input) {
  width: 160px;
}

.purchase-panel__form :deep(.purchase-price-input .el-input__inner) {
  text-align: right;
}

.purchase-panel__form :deep(.el-input),
.purchase-panel__form :deep(.el-select) {
  max-width: 100%;
}

@media (max-width: 1280px) {
  .purchase-panel {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .purchase-panel__side {
    min-height: auto;
    padding-right: 0;
    padding-bottom: 10px;
    border-right: 0;
    border-bottom: 1px solid #ebeef5;
  }

  .purchase-panel__form :deep(.formily-element-plus-form) {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .purchase-panel__form :deep(.formily-element-plus-form) {
    grid-template-columns: 1fr;
  }
}
</style>
