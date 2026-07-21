<template>
  <el-dialog v-model="visible" title="批量添加来料明细" width="86%" :close-on-click-modal="false">
    <el-form :model="header" label-width="90px" class="batch-header">
      <el-form-item label="来料日期">
        <el-date-picker v-model="header.incomingDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-select v-model="header.supId" filterable clearable style="width: 100%" @change="handleHeaderSupChange">
          <el-option v-for="item in supOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="header.remark" />
      </el-form-item>
    </el-form>
    <div class="selector-actions">
      <el-button type="primary" plain @click="openOrderItemSelector">选择采购订单明细</el-button>
    </div>
    <el-table :data="rows" border>
      <el-table-column type="index" width="52" align="center" />
      <el-table-column label="采购订单" prop="purchaseOrderNum" min-width="150" />
      <el-table-column label="品名" prop="materName" min-width="160" />
      <el-table-column label="原材料型号" prop="rawSpecs" min-width="170" />
      <el-table-column label="原材料号" prop="rawNum" min-width="140" />
      <el-table-column label="来料数量" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.incomingNumber" :min="0" :precision="0" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="来料重量" width="140">
        <template #default="{ row }">
          <el-input-number v-model="row.incomingWeight" :min="0" :precision="4" style="width: 100%" />
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
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>

  <OrderItemSelector ref="selectorRef" @confirm="handleSelectOrderItems" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { IncomingBatchPayload, RawPurchaseItem, RawPurchaseOption } from "@/api/interface/buy/rawPurchase";
import OrderItemSelector from "./OrderItemSelector.vue";

type BatchRow = IncomingBatchPayload["rows"][number] & Partial<RawPurchaseItem>;
type OpenParams = {
  supOptions: RawPurchaseOption[];
  submitApi: (data: IncomingBatchPayload) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const selectorRef = ref<InstanceType<typeof OrderItemSelector> | null>(null);
const supOptions = ref<RawPurchaseOption[]>([]);
const rows = ref<BatchRow[]>([]);
const header = ref({ incomingDate: "", supId: "" as string | number, supName: "", remark: "" });
let submitApi: OpenParams["submitApi"] | null = null;
let getTableList: OpenParams["getTableList"];

const today = () => new Date().toISOString().slice(0, 10);

const handleHeaderSupChange = (value: string | number) => {
  const item = supOptions.value.find(option => String(option.value) === String(value));
  header.value.supName = item?.label || "";
};

const openOrderItemSelector = () => selectorRef.value?.open();

const handleSelectOrderItems = (list: RawPurchaseItem[]) => {
  rows.value = list.map(item => ({
    rawPurchaseItemId: item.id as number,
    incomingNumber: Number(item.notbackNumber || 0),
    incomingWeight: 0,
    remark: "",
    purchaseOrderNum: item.purchaseOrderNum,
    materName: item.materName,
    rawNum: item.rawNum,
    rawSpecs: item.rawSpecs
  }));
};

const removeRow = (index: number) => rows.value.splice(index, 1);

const open = (params: OpenParams) => {
  supOptions.value = params.supOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  header.value = { incomingDate: today(), supId: "", supName: "", remark: "" };
  rows.value = [];
  visible.value = true;
};

const submit = async () => {
  if (!header.value.incomingDate) return ElMessage.warning("请选择来料日期");
  if (!rows.value.length) return ElMessage.warning("请选择采购订单明细");
  if (rows.value.some(item => !item.rawPurchaseItemId || !item.incomingNumber)) {
    return ElMessage.warning("请补全来料数量");
  }
  if (!submitApi) return;
  await submitApi({
    header: header.value,
    rows: rows.value.map(item => ({
      rawPurchaseItemId: item.rawPurchaseItemId,
      incomingNumber: Number(item.incomingNumber || 0),
      incomingWeight: Number(item.incomingWeight || 0),
      remark: item.remark || ""
    }))
  });
  ElMessage.success("批量添加成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.batch-header {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.selector-actions {
  margin: 12px 0;
}
</style>
