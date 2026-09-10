<template>
  <el-drawer v-model="visible" :title="`${propsData.title}产品原材料关系`" size="620px" destroy-on-close>
    <el-form ref="formRef" :model="propsData.row" :rules="rules" label-width="120px" :disabled="propsData.isView">
      <el-form-item label="产品" prop="materId">
        <el-select v-model="propsData.row.materId" filterable style="width: 100%" placeholder="请选择产品">
          <el-option v-for="item in propsData.materOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-divider content-position="left">张料</el-divider>
      <el-form-item label="张料原料" prop="sheetRawId">
        <el-select v-model="propsData.row.sheetRawId" filterable clearable style="width: 100%" placeholder="请选择张料">
          <el-option v-for="item in propsData.rawOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="每张产出数" prop="sheetOutputNumber">
        <el-input-number v-model="propsData.row.sheetOutputNumber" :min="1" :precision="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="张重(kg/张)" prop="sheetWeight">
        <el-input-number v-model="propsData.row.sheetWeight" :min="0" :precision="6" style="width: 100%" />
      </el-form-item>
      <el-divider content-position="left">卷料</el-divider>
      <el-form-item label="卷料原料" prop="rollRawId">
        <el-select v-model="propsData.row.rollRawId" filterable clearable style="width: 100%" placeholder="请选择卷料">
          <el-option v-for="item in propsData.rawOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="单件耗重" prop="rollUnitWeight">
        <el-input-number v-model="propsData.row.rollUnitWeight" :min="0" :precision="4" style="width: 100%" />
      </el-form-item>
      <el-form-item label="产品毛重(g/个)" prop="grossWeight">
        <el-input-number v-model="propsData.row.grossWeight" :min="0" :precision="4" style="width: 100%" />
      </el-form-item>
      <el-form-item label="废料重" prop="utilBadWeight">
        <el-input-number v-model="propsData.row.utilBadWeight" :min="0" :precision="4" style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="propsData.row.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button v-if="!propsData.isView" type="primary" @click="submit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { RawMaterRelation } from "@/api/interface/buy/rawPurchase";

type Option = { value: string | number; label: string };
type DrawerProps = {
  title: string;
  isView: boolean;
  row: RawMaterRelation;
  api?: (row: RawMaterRelation) => Promise<any>;
  materOptions: Option[];
  rawOptions: Option[];
  getTableList?: () => void;
};

const visible = ref(false);
const formRef = ref<FormInstance>();
const propsData = ref<DrawerProps>({ title: "", isView: false, row: {}, materOptions: [], rawOptions: [] });

const validateRelation = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  const row = propsData.value.row;
  const hasSheet = row.sheetRawId !== null && row.sheetRawId !== undefined && row.sheetRawId !== "";
  const hasRoll = row.rollRawId !== null && row.rollRawId !== undefined && row.rollRawId !== "";
  if (!hasSheet && !hasRoll) return callback(new Error("张料和卷料至少维护一种"));
  if (hasSheet && !row.sheetOutputNumber) return callback(new Error("选择张料后必须填写每张产出数"));
  if (hasSheet && (!row.sheetWeight || row.sheetWeight <= 0)) return callback(new Error("选择张料后必须填写张重"));
  if (!hasSheet && row.sheetOutputNumber !== undefined) return callback(new Error("未选择张料时不能填写每张产出数"));
  if (hasRoll && (!row.rollUnitWeight || row.rollUnitWeight <= 0)) return callback(new Error("选择卷料后必须填写大于 0 的单件耗重"));
  if (hasRoll && (!row.grossWeight || row.grossWeight <= 0)) return callback(new Error("选择卷料后必须填写产品毛重"));
  if (!hasRoll && row.rollUnitWeight !== undefined) return callback(new Error("未选择卷料时不能填写单件耗重"));
  callback();
};

const rules: FormRules = reactive({
  materId: [{ required: true, message: "请选择产品", trigger: "change" }],
  sheetRawId: [{ validator: validateRelation, trigger: "change" }],
  sheetOutputNumber: [{ validator: validateRelation, trigger: "change" }],
  sheetWeight: [{ validator: validateRelation, trigger: "change" }],
  rollRawId: [{ validator: validateRelation, trigger: "change" }],
  rollUnitWeight: [{ validator: validateRelation, trigger: "change" }],
  grossWeight: [{ validator: validateRelation, trigger: "change" }]
});

const acceptParams = (params: DrawerProps) => {
  propsData.value = params;
  visible.value = true;
};

const submit = async () => {
  await formRef.value?.validate();
  await propsData.value.api?.(propsData.value.row);
  ElMessage.success(`${propsData.value.title}成功`);
  propsData.value.getTableList?.();
  visible.value = false;
};

defineExpose({ acceptParams });
</script>
