<template>
  <el-drawer v-model="visible" :title="`${mode}包装日报`" size="min(1100px, 96vw)" destroy-on-close :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="mode === '查看' || saving">
      <div class="group-fields">
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="员工" prop="operatorId">
          <el-select v-model="form.operatorId" filterable placeholder="搜索员工姓名">
            <el-option v-for="staff in staffOptions" :key="staff.value" :label="staff.label" :value="Number(staff.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="本组共用工时（小时）" prop="hours">
          <el-input-number v-model="form.hours" :min="0" :max="99999999.99" :precision="2" :step="0.5" :controls="false" />
        </el-form-item>
      </div>
      <p class="hint">下列明细共用上方工时，仅累计一次。工时不同的作业请另建一组；辅助作业可不选产品、不填数量。</p>
      <section v-for="(item, index) in form.items" :key="index" class="item-card">
        <div class="item-heading">
          <strong>明细 {{ index + 1 }}</strong>
          <el-button v-if="mode !== '查看'" type="danger" link :disabled="form.items.length === 1" @click="form.items.splice(index, 1)">移除明细</el-button>
        </div>
        <div class="item-fields">
          <el-form-item label="产品编号 / 名称">
            <el-select :model-value="item.materId ?? undefined" @update:model-value="item.materId = $event || null" filterable clearable placeholder="搜索产品编号或名称">
              <el-option v-for="mater in materialOptions" :key="mater.value" :label="`${mater.num || ''} ${mater.label}`" :value="Number(mater.value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="工序" :prop="`items.${index}.process`" :rules="[{ required: true, message: '请选择工序', trigger: 'change' }]">
            <ProcessSelect v-model="item.process" v-model:detail="item.processDetail" :options="processOptions" :label="`明细${index + 1}工序`" />
          </el-form-item>
        </div>
        <div class="number-fields">
          <el-form-item v-for="field in numberFields" :key="field.key" :label="field.label">
            <el-input-number :model-value="item[field.key] ?? undefined" @update:model-value="item[field.key] = $event" :min="0" :max="2147483647" :precision="0" :controls="false" :aria-label="`明细${index + 1}${field.label}`" />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="item.remark" type="textarea" :rows="2" :maxlength="1000" show-word-limit placeholder="出差地点、作业说明或异常情况" />
        </el-form-item>
      </section>
      <el-button v-if="mode !== '查看'" plain type="primary" :disabled="form.items.length >= 200" @click="form.items.push(emptyItem())">添加共用工时明细</el-button>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">{{ mode === '查看' ? '关闭' : '取消' }}</el-button>
      <el-button v-if="mode !== '查看'" type="primary" :loading="saving" @click="save">保存本组</el-button>
    </template>
  </el-drawer>
</template>
<script setup lang="ts">
import { ref } from "vue";
import dayjs from "dayjs";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { addPackReport, editPackReport, getPackReport, type PackItem, type PackReport, type PackProcess } from "@/api/modules/packReport";
import ProcessSelect from "./ProcessSelect.vue";
defineProps<{
  staffOptions: { value: string | number; label: string }[];
  materialOptions: { value: string | number; label: string; num?: string }[];
  processOptions: PackProcess[];
}>();
const emit = defineEmits<{ saved: [] }>();
const visible = ref(false), saving = ref(false);
const mode = ref<"新增" | "编辑" | "查看">("新增");
const formRef = ref<FormInstance>();
const emptyItem = (): PackItem => ({ process: "", qty: undefined, defect: undefined, scrap: undefined, remark: "" });
const form = ref<PackReport>({ date: "", items: [] });
const rules: FormRules = {
  date: [{ required: true, message: "请选择日期", trigger: "change" }],
  operatorId: [{ required: true, message: "请选择员工", trigger: "change" }],
  hours: [{ required: true, message: "请填写本组共用工时", trigger: "blur" }]
};
const numberFields = [
  { key: "qty", label: "数量" }, { key: "defect", label: "不良品数" }, { key: "scrap", label: "报废数" }
] as const;
const open = async (title: typeof mode.value, id?: number) => {
  const data = id ? (await getPackReport(id)).data : { date: dayjs().format("YYYY-MM-DD"), items: [emptyItem()] };
  // 数字控件用 undefined 显示空值，保存时仍按未填写处理。
  data.items.forEach(item => numberFields.forEach(field => { if (item[field.key] == null) item[field.key] = undefined; }));
  form.value = data;
  mode.value = title;
  visible.value = true;
};
const save = async () => {
  if (saving.value || !(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    await (mode.value === "新增" ? addPackReport : editPackReport)(form.value);
    ElMessage.success("包装日报已保存");
    visible.value = false;
    emit("saved");
  } finally { saving.value = false; }
};
defineExpose({ open });
</script>
<style scoped>
.group-fields, .number-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.item-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.item-card { padding: 16px; margin: 16px 0; border: 1px solid var(--el-border-color); border-radius: 6px; }
.item-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.hint { color: var(--el-text-color-secondary); line-height: 1.7; }
:deep(.el-input-number), :deep(.el-date-editor) { width: 100%; }
@media (max-width: 700px) { .group-fields, .item-fields, .number-fields { grid-template-columns: 1fr; gap: 0; } }
</style>
