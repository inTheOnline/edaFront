<template>
  <el-drawer v-model="visible" :title="`${title}请购明细`" size="620px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" :disabled="isView">
      <el-form-item label="请购日期" prop="requisitionDate">
        <el-date-picker v-model="form.requisitionDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="申请人" prop="applyUserId">
        <el-select v-model="form.applyUserId" filterable clearable style="width: 100%">
          <el-option v-for="item in userOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
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
      <el-form-item label="请购数量" prop="requisitionNumber">
        <el-input-number v-model="form.requisitionNumber" :min="0" :precision="0" :value-on-clear="null" style="width: 100%" />
      </el-form-item>
      <el-form-item label="请购重量" prop="requisitionWeight">
        <el-input-number v-model="form.requisitionWeight" :min="0" :precision="4" :value-on-clear="null" style="width: 100%" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" style="width: 100%">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
import type { RawPurchaseOption, RawPurchaseRequisition, RawPurchaseStatus } from "@/api/interface/buy/rawPurchase";

type DrawerParams = {
  title: string;
  isView?: boolean;
  row?: Partial<RawPurchaseRequisition>;
  userOptions: RawPurchaseOption[];
  materOptions: RawPurchaseOption[];
  rawOptions: RawPurchaseOption[];
  submitApi?: (data: RawPurchaseRequisition) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const title = ref("新增");
const isView = ref(false);
const formRef = ref<FormInstance>();
const userOptions = ref<RawPurchaseOption[]>([]);
const materOptions = ref<RawPurchaseOption[]>([]);
const rawOptions = ref<RawPurchaseOption[]>([]);
let submitApi: DrawerParams["submitApi"];
let getTableList: DrawerParams["getTableList"];

const statusOptions: Array<{ label: RawPurchaseStatus; value: RawPurchaseStatus }> = [
  { label: "待采购", value: "待采购" },
  { label: "部分采购", value: "部分采购" },
  { label: "已采购", value: "已采购" },
  { label: "已取消", value: "已取消" }
];

const form = reactive<RawPurchaseRequisition>({
  requisitionDate: "",
  applyUserId: "",
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
  status: "待采购",
  remark: ""
});

const validateRequisitionAmount = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  if (form.requisitionNumber !== null && form.requisitionNumber !== undefined) return callback();
  if (form.requisitionWeight !== null && form.requisitionWeight !== undefined) return callback();
  callback(new Error("请购数量和请购重量至少填写一个"));
};

const rules: FormRules = {
  requisitionDate: [{ required: true, message: "请选择请购日期", trigger: "change" }],
  rawNum: [{ required: true, message: "请输入原材料号", trigger: "blur" }],
  rawSpecs: [{ required: true, message: "请输入原材料型号", trigger: "blur" }],
  requisitionNumber: [{ validator: validateRequisitionAmount, trigger: "change" }],
  requisitionWeight: [{ validator: validateRequisitionAmount, trigger: "change" }]
};

const formatMaterLabel = (item: RawPurchaseOption) => `${item.label || ""}${item.num ? `（${item.num}）` : ""}`;
const formatRawLabel = (item: RawPurchaseOption) => `${item.rawNum || item.label || ""}${item.rawSpecs ? ` / ${item.rawSpecs}` : ""}`;

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    requisitionDate: "",
    applyUserId: "",
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
    status: "待采购",
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

const acceptParams = (params: DrawerParams) => {
  title.value = params.title;
  isView.value = !!params.isView;
  userOptions.value = params.userOptions;
  materOptions.value = params.materOptions;
  rawOptions.value = params.rawOptions;
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
