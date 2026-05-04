<template>
  <el-dialog v-model="visible" title="批量采购录入" width="680px" destroy-on-close>
    <div class="batch-head">
      已选 <strong>{{ purchaseIds.length }}</strong> 条请购记录，将批量写入采购信息。
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="采购平台" prop="platform">
        <el-select v-model="form.platform" style="width: 100%" placeholder="请选择采购平台">
          <el-option label="淘宝" value="淘宝" />
          <el-option label="京东" value="京东" />
          <el-option label="拼多多" value="拼多多" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <el-form-item label="采购链接">
        <el-input v-model="form.link" placeholder="可粘贴采购链接" clearable />
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="单价" prop="unitPrice">
            <el-input-number v-model="form.unitPrice" :min="0" :precision="2" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="数量" prop="number">
            <el-input-number v-model="form.number" :min="0.01" :precision="2" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="金额" prop="amount">
            <el-input-number v-model="form.amount" :min="0" :precision="2" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="采购日期" prop="buyDate">
        <el-date-picker
          v-model="form.buyDate"
          type="datetime"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
          placeholder="请选择采购日期"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选备注" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认批量采购</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";
import { addBatchPurchaseRecordByPurchaseIds } from "@/api/modules/buy/officePurchase";

interface BatchForm {
  platform: string;
  link?: string;
  unitPrice: number;
  number: number;
  amount: number;
  buyDate: string;
  remark?: string;
}

interface OpenParams {
  purchaseIds: number[];
  getTableList?: () => void;
}

const visible = ref(false);
const submitting = ref(false);
const purchaseIds = ref<number[]>([]);
const getTableList = ref<() => void>();
const formRef = ref<FormInstance>();

const form = reactive<BatchForm>({
  platform: "",
  link: "",
  unitPrice: 0,
  number: 1,
  amount: 0,
  buyDate: "",
  remark: ""
});

const rules = {
  platform: [{ required: true, message: "请选择采购平台", trigger: "change" }],
  unitPrice: [{ required: true, message: "请输入单价", trigger: "change" }],
  number: [{ required: true, message: "请输入数量", trigger: "change" }],
  buyDate: [{ required: true, message: "请选择采购日期", trigger: "change" }]
};

watch(
  () => [form.unitPrice, form.number],
  ([unitPrice, number]) => {
    form.amount = Number((Number(unitPrice || 0) * Number(number || 0)).toFixed(2));
  }
);

const resetForm = () => {
  form.platform = "";
  form.link = "";
  form.unitPrice = 0;
  form.number = 1;
  form.amount = 0;
  form.buyDate = "";
  form.remark = "";
};

const open = (params: OpenParams) => {
  purchaseIds.value = params.purchaseIds || [];
  getTableList.value = params.getTableList;
  resetForm();
  visible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    if (!purchaseIds.value.length) {
      ElMessage.warning("请先选择要采购的请购记录");
      return;
    }

    submitting.value = true;
    try {
      await addBatchPurchaseRecordByPurchaseIds({
        purchaseIds: purchaseIds.value,
        record: {
          platform: form.platform,
          link: form.link,
          unitPrice: Number(form.unitPrice || 0),
          number: Number(form.number || 0),
          amount: Number(form.amount || 0),
          buyDate: form.buyDate,
          remark: form.remark
        }
      });

      ElMessage.success("批量采购录入成功");
      visible.value = false;
      getTableList.value?.();
    } finally {
      submitting.value = false;
    }
  });
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.batch-head {
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  color: #166534;
}
</style>
