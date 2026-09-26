<template>
  <el-dialog v-model="visible" title="吸塑与物料关系维护" width="min(1100px, 95vw)" :close-on-click-modal="false">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索物料编号、名称、吸塑编号或规格" clearable aria-label="搜索绑定关系" />
      <el-button type="primary" :disabled="loading" @click="edit()">新增绑定</el-button>
    </div>
    <el-table v-loading="loading" :data="filteredRows" border stripe max-height="460" empty-text="暂无绑定关系">
      <el-table-column prop="materLabel" label="物料" min-width="220" />
      <el-table-column prop="assistLabel" label="吸塑编号 / 规格" min-width="220" />
      <el-table-column prop="materQty" label="吸塑格数" width="100" />
      <el-table-column label="是否启用" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled !== 0"
            :loading="switching === row.id"
            :disabled="loading || switching !== undefined || deleting !== undefined"
            active-text="启用"
            inactive-text="停用"
            inline-prompt
            :aria-label="`${row.materLabel} ${row.assistLabel} 是否启用`"
            @change="toggle(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link :disabled="loading || deleting !== undefined" @click="edit(row)">编辑</el-button>
          <el-button
            type="danger"
            link
            :loading="deleting === row.id"
            :disabled="loading || deleting !== undefined"
            @click="remove(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      v-model="editing"
      :title="form.id ? '编辑绑定' : '新增绑定'"
      width="min(560px, 95vw)"
      append-to-body
      :close-on-click-modal="false"
      :before-close="closeEditor"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="saving">
        <el-form-item label="物料" prop="materId">
          <el-select v-model="form.materId" filterable placeholder="搜索并选择物料">
            <el-option v-for="item in materials" :key="item.value" :label="materialLabel(item)" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="吸塑" prop="assistId">
          <el-select v-model="form.assistId" filterable placeholder="搜索并选择吸塑" @change="selectAssist">
            <el-option v-for="item in assists" :key="item.id" :label="assistLabel(item)" :value="item.id!" />
          </el-select>
        </el-form-item>
        <el-form-item label="吸塑格数" prop="materQty"
          ><el-input-number v-model="form.materQty" :controls="false"
        /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="editing = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { useDictStore } from "@/stores/modules/dict";
import {
  getPvcRelations,
  savePvcRelation,
  deletePvcRelation,
  setPvcRelationEnabled,
  type PvcRelation,
  type AssistMater,
} from "@/api/modules/godown/assistMater";

const visible = ref(false);
const editing = ref(false);
const loading = ref(false);
const saving = ref(false);
const deleting = ref<number>();
const switching = ref<number>();
const keyword = ref("");
const records = ref<PvcRelation[]>([]);
const assists = ref<AssistMater[]>([]);
const form = ref<PvcRelation>({});
const formRef = ref<FormInstance>();
const dictStore = useDictStore();
const materials = computed(() => dictStore.dictMap.mater || []);
const materialLabel = (item: { num?: string; label?: string }) => `${item.num || ""} / ${item.label || ""}`;
const assistLabel = (item: AssistMater) => `${item.code} / ${item.spec || ""}`;
const filteredRows = computed(() => {
  const materMap = new Map(materials.value.map((item) => [Number(item.value), materialLabel(item)]));
  const assistMap = new Map(assists.value.map((item) => [item.id, assistLabel(item)]));
  const search = keyword.value.trim().toLowerCase();
  return records.value
    .map((row) => ({
      ...row,
      materLabel: materMap.get(row.materId!) || `物料已失效（ID：${row.materId}）`,
      assistLabel: assistMap.get(row.assistId) || `吸塑已失效（ID：${row.assistId}）`,
    }))
    .filter((row) => `${row.materLabel} ${row.assistLabel}`.toLowerCase().includes(search));
});
const positive = (_rule: unknown, value: number, callback: (error?: Error) => void) => {
  callback(Number.isFinite(value) && value > 0 ? undefined : new Error("请输入大于 0 的数量"));
};
const rules: FormRules = {
  materId: [{ required: true, message: "请选择物料", trigger: "change" }],
  assistId: [{ required: true, message: "请选择吸塑", trigger: "change" }],
  materQty: [{ validator: positive, trigger: "blur" }],
};
const load = async () => {
  loading.value = true;
  try {
    const { data } = await getPvcRelations();
    records.value = data.relations;
    assists.value = data.assists;
  } finally {
    loading.value = false;
  }
};
const open = async () => {
  keyword.value = "";
  records.value = [];
  visible.value = true;
  loading.value = true;
  try {
    await Promise.all([dictStore.loadDict("mater", { force: true }), load()]);
  } finally {
    loading.value = false;
  }
};
const edit = async (row?: PvcRelation) => {
  form.value = row
    ? {
        id: row.id,
        materId: row.materId,
        assistId: row.assistId,
        materQty: row.materQty,
        assistQty: row.assistQty,
        remark: row.remark,
      }
    : { assistQty: 1 };
  editing.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};
const selectAssist = () => {
  if (!form.value.id && form.value.materQty == null)
    form.value.materQty = assists.value.find((item) => item.id === form.value.assistId)?.gridNumber;
};
const closeEditor = (done: () => void) => {
  if (!saving.value) done();
};
const submit = async () => {
  if (saving.value || !(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    await savePvcRelation(form.value);
    ElMessage.success("保存成功");
    editing.value = false;
    await load();
  } finally {
    saving.value = false;
  }
};
const remove = async (row: PvcRelation) => {
  if (row.id == null || deleting.value !== undefined) return;
  try {
    await ElMessageBox.confirm("确认删除这条吸塑与物料的绑定关系？", "删除确认", { type: "warning" });
  } catch {
    return;
  }
  deleting.value = row.id;
  try {
    await deletePvcRelation(row.id);
    ElMessage.success("删除成功");
    await load();
  } finally {
    deleting.value = undefined;
  }
};
const toggle = async (row: PvcRelation, value: string | number | boolean) => {
  if (row.id == null || switching.value !== undefined) return;
  switching.value = row.id;
  try {
    await setPvcRelationEnabled(row.id, value === true);
    const record = records.value.find((item) => item.id === row.id);
    if (record) record.enabled = value === true ? 1 : 0;
    ElMessage.success(value === true ? "已启用" : "已停用");
  } finally {
    switching.value = undefined;
  }
};
defineExpose({ open });
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar .el-input {
  max-width: 460px;
}
.el-select,
.el-input-number {
  width: 100%;
}
</style>
