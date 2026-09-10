<template>
  <div class="assist-mater-page">
    <div class="type-switcher">
      <el-segmented v-model="activeType" :options="typeOptions" />
    </div>
    <ProTable
      :key="activeType"
      ref="proTableRef"
      :columns="columns"
      :request-api="requestPage"
      :data-callback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'setting', 'search']"
      row-key="id"
      striped
      :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }"
    >
      <template #tableHeader>
        <el-button type="primary" :icon="CirclePlus" @click="openEditor()">新增{{ activeTypeLabel }}</el-button>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link :icon="EditPen" @click="openEditor(row)">编辑</el-button>
        <el-button type="danger" link :icon="Delete" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="editorVisible"
      :title="`${form.id ? '编辑' : '新增'}${activeTypeLabel}`"
      width="520px"
      :close-on-click-modal="false"
      @closed="formRef?.resetFields()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="`${activeTypeLabel}编号`" prop="code">
          <el-input v-model.trim="form.code" :disabled="!!form.id" maxlength="100" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="form.name" maxlength="255" />
        </el-form-item>
        <el-form-item label="规格" prop="spec">
          <el-input v-model.trim="form.spec" maxlength="255" />
        </el-form-item>
        <el-form-item v-if="activeType === 'box'" label="每箱数量" prop="gridNumber">
          <el-input-number v-model="form.gridNumber" :min="1" :precision="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { CirclePlus, Delete, EditPen } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import {
  deleteAssistMater,
  getAssistMaterPage,
  saveAssistMater,
  type AssistMater,
  type AssistMaterType,
} from "@/api/modules/godown/assistMater";

const activeType = ref<AssistMaterType>("pvc");
const proTableRef = ref<any>();
const formRef = ref<FormInstance>();
const editorVisible = ref(false);
const saving = ref(false);
const form = reactive<AssistMater>({ type: "pvc", code: "" });
const typeOptions = [
  { label: "吸塑", value: "pvc" },
  { label: "纸箱", value: "box" },
  { label: "隔板", value: "spacer" },
  { label: "螺母", value: "nut" },
];
const activeTypeLabel = computed(() => typeOptions.find((item) => item.value === activeType.value)?.label || "辅料");
const rules: FormRules<AssistMater> = {
  code: [{ required: true, message: "请输入编号", trigger: "blur" }],
  spec: [{ required: true, message: "请输入规格", trigger: "blur" }],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  gridNumber: [{ required: true, message: "请输入每箱数量", trigger: "change" }],
};

const indexColumn = {
  type: "index",
  label: "序号",
  width: 70,
  align: "center",
  index: (index: number) => (proTableRef.value?.pageable.pageNum - 1) * proTableRef.value?.pageable.pageSize + index + 1,
};

const columns = computed<any[]>(() => {
  if (activeType.value === "pvc") {
    return [
      indexColumn,
      { label: "吸塑编号", prop: "code", minWidth: 180, search: { el: "input" } },
      { label: "名称", prop: "name", minWidth: 160 },
      { label: "规格", prop: "spec", minWidth: 180, search: { el: "input" } },
      { label: "备注", prop: "remark", minWidth: 180 },
      { label: "操作", prop: "operation", fixed: "right", width: 150 },
    ];
  }
  if (activeType.value === "box") {
    return [
      indexColumn,
      { label: "纸箱编号", prop: "code", minWidth: 160, search: { el: "input" } },
      { label: "名称", prop: "name", minWidth: 160 },
      { label: "纸箱规格", prop: "spec", minWidth: 220, search: { el: "input" } },
      { label: "每箱数量", prop: "gridNumber", width: 140 },
      { label: "备注", prop: "remark", minWidth: 160 },
      { label: "操作", prop: "operation", fixed: "right", width: 150 },
    ];
  }
  if (activeType.value === "spacer") {
    return [
      indexColumn,
      { label: "隔板编号", prop: "code", minWidth: 160, search: { el: "input" } },
      { label: "名称", prop: "name", minWidth: 160 },
      { label: "隔板规格", prop: "spec", minWidth: 220, search: { el: "input" } },
      { label: "备注", prop: "remark", minWidth: 160 },
      { label: "操作", prop: "operation", fixed: "right", width: 150 },
    ];
  }
  return [
    indexColumn,
    { label: "螺母编号", prop: "code", minWidth: 160, search: { el: "input" } },
    { label: "螺母名称", prop: "name", minWidth: 220, search: { el: "input" } },
    { label: "规格", prop: "spec", minWidth: 180, search: { el: "input" } },
    { label: "备注", prop: "remark", minWidth: 160 },
    { label: "操作", prop: "operation", fixed: "right", width: 150 },
  ];
});

const requestPage = (params: any) => getAssistMaterPage(activeType.value, params);
const dataCallback = (data: any) => ({ list: data.records, total: data.total });

const openEditor = (row?: AssistMater) => {
  Object.keys(form).forEach((key) => delete (form as any)[key]);
  Object.assign(form, row ? { ...row } : { type: activeType.value, code: "" });
  editorVisible.value = true;
};

const submit = async () => {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    await saveAssistMater({ ...form, type: activeType.value });
    ElMessage.success("保存成功");
    editorVisible.value = false;
    proTableRef.value?.getTableList();
  } finally {
    saving.value = false;
  }
};

const remove = async (row: AssistMater) => {
  if (!row.id) return;
  await ElMessageBox.confirm(`确认删除“${row.code}”吗？`, "删除确认", { type: "warning" });
  await deleteAssistMater(row.id);
  ElMessage.success("删除成功");
  proTableRef.value?.getTableList();
};
</script>

<style scoped lang="scss">
.assist-mater-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.type-switcher {
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.assist-mater-page :deep(.ProTable) {
  flex: 1;
  min-height: 0;
}

.assist-mater-page :deep(.el-input-number) {
  width: 100%;
}
</style>
