<template>
  <el-drawer
    v-model="visible"
    title="编辑工资标准"
    size="720px"
    destroy-on-close
    class="salary-norm-drawer"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <section class="form-section employee-section">
        <div class="section-heading">
          <span class="section-title">员工信息</span>
          <span class="section-description">工资标准与员工固定绑定</span>
        </div>
        <div class="employee-name">{{ staffName }}</div>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <span class="section-title">工资标准</span>
          <span class="section-description">金额单位：元</span>
        </div>
        <el-row :gutter="20">
          <el-col v-for="item in salaryNormFields" :key="item.prop" :xs="24" :sm="12">
            <el-form-item :label="item.label">
              <el-input-number
                v-model="form[item.prop]"
                :min="0"
                :precision="2"
                :controls="false"
                placeholder="0.00"
                class="money-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可填写工资标准相关说明" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="form-section approval-section">
        <div class="section-heading">
          <span class="section-title">调整审批</span>
          <span class="required-tip">以下信息均为必填</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="执行月份" prop="effectiveMonth">
              <el-date-picker
                v-model="form.effectiveMonth"
                type="month"
                value-format="YYYY-MM"
                placeholder="选择执行月份"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="审批日期" prop="approvalDate">
              <el-date-picker
                v-model="form.approvalDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择审批日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="审批人" prop="approverName">
              <el-input v-model="form.approverName" maxlength="100" placeholder="请输入审批人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="修改理由" prop="changeReason">
              <el-input
                v-model="form.changeReason"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="请说明本次工资标准调整原因"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="直属主管意见" prop="supervisorOpinion">
              <el-input
                v-model="form.supervisorOpinion"
                type="textarea"
                :rows="3"
                maxlength="1000"
                show-word-limit
                placeholder="请输入直属主管意见"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </section>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存调整</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { SalaryNorm, SalaryNormEditRequest } from "@/api/interface/hr";
import { salaryNormFields } from "../fields";

type DictItem = { value: string | number; label: string };
type SalaryNormForm = SalaryNorm & {
  changeReason: string;
  effectiveMonth: string;
  supervisorOpinion: string;
  approverName: string;
  approvalDate: string;
};

const emptyForm = (): SalaryNormForm => ({
  changeReason: "",
  effectiveMonth: "",
  supervisorOpinion: "",
  approverName: "",
  approvalDate: ""
});

const visible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = ref<SalaryNormForm>(emptyForm());
const drawer = reactive({
  staffDict: [] as DictItem[],
  api: undefined as ((data: SalaryNormEditRequest) => Promise<unknown>) | undefined,
  refresh: undefined as (() => void) | undefined
});

const requiredText = (message: string) => ({
  validator: (_rule: unknown, value: string, callback: (error?: Error) => void) =>
    value?.trim() ? callback() : callback(new Error(message)),
  trigger: "blur"
});

const rules: FormRules<SalaryNormForm> = {
  effectiveMonth: [{ required: true, message: "请选择执行月份", trigger: "change" }],
  approvalDate: [{ required: true, message: "请选择审批日期", trigger: "change" }],
  approverName: [requiredText("请输入审批人姓名")],
  changeReason: [requiredText("请输入修改理由")],
  supervisorOpinion: [requiredText("请输入直属主管意见")]
};

const staffName = computed(() => {
  const item = drawer.staffDict.find(option => String(option.value) === String(form.value.staffId));
  return item?.label || `员工 ID：${form.value.staffId ?? "-"}`;
});

const acceptParams = (params: {
  row: SalaryNorm;
  staffDict: DictItem[];
  api: (data: SalaryNormEditRequest) => Promise<unknown>;
  refresh?: () => void;
}) => {
  Object.assign(drawer, params);
  form.value = { ...emptyForm(), ...params.row };
  visible.value = true;
};

const submit = async () => {
  if (!(await formRef.value?.validate()) || !form.value.id || !drawer.api) return;

  const body: SalaryNormEditRequest = {
    id: form.value.id,
    changeReason: form.value.changeReason.trim(),
    effectiveMonth: form.value.effectiveMonth,
    supervisorOpinion: form.value.supervisorOpinion.trim(),
    approverName: form.value.approverName.trim(),
    approvalDate: form.value.approvalDate,
    remark: form.value.remark
  };
  salaryNormFields.forEach(item => {
    body[item.prop] = form.value[item.prop];
  });

  submitting.value = true;
  try {
    await drawer.api(body);
    ElMessage.success("工资标准调整已保存");
    visible.value = false;
    drawer.refresh?.();
  } finally {
    submitting.value = false;
  }
};

defineExpose({ acceptParams });
</script>

<style scoped>
.form-section {
  padding: 2px 0 22px;
}

.form-section + .form-section {
  padding-top: 22px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.section-description,
.required-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.employee-section {
  padding-bottom: 20px;
}

.employee-section .section-heading {
  margin-bottom: 10px;
}

.employee-name {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}

.money-input {
  width: 100%;
}

.approval-section {
  padding-bottom: 0;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

:deep(.el-input-number .el-input__inner) {
  text-align: right;
}

@media (max-width: 767px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
