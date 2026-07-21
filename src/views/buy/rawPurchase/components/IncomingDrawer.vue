<template>
  <el-drawer v-model="visible" :title="`${title}来料明细`" size="560px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="128px" :disabled="isView">
      <el-form-item label="采购明细" prop="rawPurchaseItemId">
        <el-select v-model="form.rawPurchaseItemId" filterable clearable style="width: 100%" @change="handleItemChange">
          <el-option v-for="item in orderItemOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="来料日期" prop="incomingDate">
        <el-date-picker v-model="form.incomingDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="来料数量" prop="incomingNumber">
        <el-input-number v-model="form.incomingNumber" :min="0" :precision="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="来料重量" prop="incomingWeight">
        <el-input-number v-model="form.incomingWeight" :min="0" :precision="4" style="width: 100%" />
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
import type { RawPurchaseIncoming, RawPurchaseOption } from "@/api/interface/buy/rawPurchase";

type DrawerParams = {
  title: string;
  isView?: boolean;
  row?: Partial<RawPurchaseIncoming>;
  orderItemOptions: RawPurchaseOption[];
  supOptions: RawPurchaseOption[];
  submitApi?: (data: RawPurchaseIncoming) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const title = ref("新增");
const isView = ref(false);
const formRef = ref<FormInstance>();
const orderItemOptions = ref<RawPurchaseOption[]>([]);
const supOptions = ref<RawPurchaseOption[]>([]);
let submitApi: DrawerParams["submitApi"];
let getTableList: DrawerParams["getTableList"];

const form = reactive<RawPurchaseIncoming>({
  rawPurchaseItemId: "",
  incomingDate: "",
  incomingNumber: 0,
  incomingWeight: 0,
  supId: "",
  supName: "",
  remark: ""
});

const rules: FormRules = {
  rawPurchaseItemId: [{ required: true, message: "请选择采购明细", trigger: "change" }],
  incomingDate: [{ required: true, message: "请选择来料日期", trigger: "change" }],
  incomingNumber: [{ required: true, message: "请输入来料数量", trigger: "change" }]
};

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    rawPurchaseItemId: "",
    incomingDate: "",
    incomingNumber: 0,
    incomingWeight: 0,
    supId: "",
    supName: "",
    remark: ""
  });
};

const handleSupChange = (value: string | number) => {
  const item = supOptions.value.find(option => String(option.value) === String(value));
  form.supName = item?.label || "";
};

const handleItemChange = (value: string | number) => {
  const item = orderItemOptions.value.find(option => String(option.value) === String(value));
  form.rawNum = item?.rawNum;
  form.rawSpecs = item?.rawSpecs;
  form.materName = item?.materName;
  form.purchaseOrderNum = item?.purchaseOrderNum;
  form.custOrderNum = item?.custOrderNum;
};

const acceptParams = (params: DrawerParams) => {
  title.value = params.title;
  isView.value = !!params.isView;
  orderItemOptions.value = params.orderItemOptions;
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
