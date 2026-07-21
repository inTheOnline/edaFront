<template>
  <el-drawer v-model="visible" :title="`${title}采购订单明细`" size="680px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="128px" :disabled="isView">
      <el-form-item label="请购来源">
        <el-input :model-value="form.requisitionId ? `请购ID：${form.requisitionId}` : '无请购'" readonly />
      </el-form-item>
      <el-form-item label="采购日期" prop="purchaseDate">
        <el-date-picker v-model="form.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="采购订单号" prop="purchaseOrderNum">
        <el-input v-model="form.purchaseOrderNum" clearable />
      </el-form-item>
      <el-form-item label="客户订单号" prop="custOrderNum">
        <el-input v-model="form.custOrderNum" clearable />
      </el-form-item>
      <el-form-item label="品名" prop="materId">
        <el-select v-model="form.materId" filterable clearable style="width: 100%" @change="handleMaterChange">
          <el-option v-for="item in materOptions" :key="item.value" :label="formatMaterLabel(item)" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="原材料" prop="rawId">
        <el-select v-model="form.rawId" filterable clearable style="width: 100%" @change="handleRawChange">
          <el-option v-for="item in rawOptions" :key="item.value" :label="formatRawLabel(item)" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="原材料号" prop="rawNum">
        <el-input v-model="form.rawNum" clearable />
      </el-form-item>
      <el-form-item label="原材料型号" prop="rawSpecs">
        <el-input v-model="form.rawSpecs" clearable />
      </el-form-item>
      <el-form-item label="订单数量" prop="orderNumber">
        <el-input-number v-model="form.orderNumber" :min="0" :precision="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="采购数量" prop="purchaseNumber">
        <el-input-number v-model="form.purchaseNumber" :min="0" :precision="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="采购重量" prop="purchaseWeight">
        <el-input-number v-model="form.purchaseWeight" :min="0" :precision="4" style="width: 100%" />
      </el-form-item>
      <el-form-item label="单价" prop="unitPrice">
        <el-input-number v-model="form.unitPrice" :min="0" :precision="4" style="width: 100%" />
      </el-form-item>
      <el-form-item label="供应商" prop="supId">
        <el-select v-model="form.supId" filterable clearable style="width: 100%" @change="handleSupChange">
          <el-option v-for="item in supOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ isView ? "关闭" : "取消" }}</el-button>
      <el-button v-if="!isView" type="primary" @click="submit">保存</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { RawPurchaseItem, RawPurchaseOption } from "@/api/interface/buy/rawPurchase";

type DrawerParams = {
  title: string;
  isView?: boolean;
  row?: Partial<RawPurchaseItem>;
  materOptions: RawPurchaseOption[];
  rawOptions: RawPurchaseOption[];
  supOptions: RawPurchaseOption[];
  submitApi?: (data: RawPurchaseItem) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const title = ref("新增");
const isView = ref(false);
const formRef = ref<FormInstance>();
const materOptions = ref<RawPurchaseOption[]>([]);
const rawOptions = ref<RawPurchaseOption[]>([]);
const supOptions = ref<RawPurchaseOption[]>([]);
let submitApi: DrawerParams["submitApi"];
let getTableList: DrawerParams["getTableList"];

const form = reactive<RawPurchaseItem>({
  requisitionId: null,
  purchaseDate: "",
  purchaseOrderId: "",
  purchaseOrderNum: "",
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
  orderNumber: 0,
  purchaseNumber: 0,
  purchaseWeight: 0,
  unitPrice: 0,
  supId: "",
  supName: "",
  remark: ""
});

const rules: FormRules = {
  purchaseDate: [{ required: true, message: "请选择采购日期", trigger: "change" }],
  purchaseOrderNum: [{ required: true, message: "请输入采购订单号", trigger: "blur" }],
  rawNum: [{ required: true, message: "请输入原材料号", trigger: "blur" }],
  rawSpecs: [{ required: true, message: "请输入原材料型号", trigger: "blur" }],
  purchaseNumber: [{ required: true, message: "请输入采购数量", trigger: "change" }]
};

const formatMaterLabel = (item: RawPurchaseOption) => `${item.label || ""}${item.num ? `（${item.num}）` : ""}`;
const formatRawLabel = (item: RawPurchaseOption) => `${item.rawNum || item.label || ""}${item.rawSpecs ? ` / ${item.rawSpecs}` : ""}`;

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    requisitionId: null,
    purchaseDate: "",
    purchaseOrderId: "",
    purchaseOrderNum: "",
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
    orderNumber: 0,
    purchaseNumber: 0,
    purchaseWeight: 0,
    unitPrice: 0,
    supId: "",
    supName: "",
    remark: ""
  });
};

const handleMaterChange = (value: string | number) => {
  const item = materOptions.value.find(option => String(option.value) === String(value));
  form.materNum = item?.num || item?.materNum || "";
  form.materName = item?.label || item?.materName || "";
};

const handleRawChange = (value: string | number) => {
  const item = rawOptions.value.find(option => String(option.value) === String(value));
  form.rawNum = item?.rawNum || item?.label || "";
  form.rawSpecs = item?.rawSpecs || "";
};

const handleSupChange = (value: string | number) => {
  const item = supOptions.value.find(option => String(option.value) === String(value));
  form.supName = item?.label || "";
};

const acceptParams = (params: DrawerParams) => {
  title.value = params.title;
  isView.value = !!params.isView;
  materOptions.value = params.materOptions;
  rawOptions.value = params.rawOptions;
  supOptions.value = params.supOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  resetForm();
  Object.assign(form, params.row || {});
  visible.value = true;
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !submitApi) return;
  await submitApi({ ...form });
  ElMessage.success("保存成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ acceptParams });
</script>
