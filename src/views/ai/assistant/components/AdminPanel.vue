<template>
  <el-drawer :model-value="modelValue" title="AI 管理" size="min(1050px, 96vw)" :close-on-click-modal="false" @update:model-value="$emit('update:modelValue', $event)">
    <el-alert v-if="!apiConfigured" title="模型 API 尚未配置，可先整理知识文档和模型目录。" type="info" :closable="false" class="notice" />
    <el-tabs v-model="tab">
      <el-tab-pane label="知识文档" name="knowledge" lazy><KnowledgeManager v-if="modelValue" /></el-tab-pane>
      <el-tab-pane label="模型目录" name="models">
        <div class="toolbar"><p>模型名称用于展示，接口模型 ID 必须与已接入的服务一致。</p><el-button type="primary" :icon="Plus" @click="editModel()">新增模型</el-button></div>
        <el-table v-loading="loading" :data="models" border>
          <el-table-column prop="name" label="模型" min-width="150" />
          <el-table-column prop="apiModel" label="接口模型 ID" min-width="160" />
          <el-table-column label="推理强度" min-width="150"><template #default="{ row }">{{ row.efforts.join('、') || '默认' }}</template></el-table-column>
          <el-table-column label="状态" width="85"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag></template></el-table-column>
          <el-table-column label="Ultra" width="80"><template #default="{ row }">{{ row.ultra ? '支持' : '—' }}</template></el-table-column>
          <el-table-column label="操作" width="70"><template #default="{ row }"><el-button link type="primary" @click="editModel(row)">编辑</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="系统设置" name="settings">
        <el-form v-if="settings" v-loading="loading" label-position="top" class="settings-form">
          <el-form-item label="AI 服务"><el-switch v-model="settings.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
          <div class="form-grid">
            <el-form-item label="默认模型"><el-select v-model="settings.defaultModel" @change="syncDefaultEffort"><el-option v-for="item in models.filter(model => model.enabled)" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
            <el-form-item label="默认推理强度"><el-select v-model="settings.defaultEffort"><el-option v-for="item in defaultEfforts" :key="item" :label="item" :value="item" /></el-select></el-form-item>
            <el-form-item label="单次工具调用上限"><el-input-number v-model="settings.toolLimit" :min="1" :max="12" :controls="false" :precision="0" /></el-form-item>
            <el-form-item label="Ultra 并行任务上限"><el-input-number v-model="settings.maxAgents" :min="1" :max="3" :controls="false" :precision="0" /></el-form-item>
            <el-form-item label="回答超时（秒）"><el-input-number v-model="settings.timeoutSeconds" :min="10" :max="600" :controls="false" :precision="0" /></el-form-item>
            <el-form-item label="历史消息条数"><el-input-number v-model="settings.historyLimit" :min="1" :max="100" :controls="false" :precision="0" /></el-form-item>
            <el-form-item label="单次输出 Token 上限"><el-input-number v-model="settings.maxOutputTokens" :min="256" :max="131072" :controls="false" :precision="0" /></el-form-item>
          </div>
          <el-alert v-if="error" :title="error" type="error" :closable="false" class="notice" />
          <el-button type="primary" :loading="saving" @click="saveSettings">保存设置</el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <el-alert v-if="error && tab !== 'settings'" :title="error" type="error" :closable="false" class="notice" />
    <el-dialog v-model="modelVisible" :title="editing ? '编辑模型' : '新增模型'" width="min(560px, 94vw)" append-to-body :close-on-click-modal="false" :before-close="beforeClose">
      <el-form label-position="top">
        <el-form-item label="目录标识" required><el-input v-model="modelForm.id" :disabled="editing" placeholder="例如 gpt-5.6" /></el-form-item>
        <el-form-item label="显示名称" required><el-input v-model="modelForm.name" placeholder="例如 GPT-5.6" /></el-form-item>
        <el-form-item label="接口模型 ID" required><el-input v-model="modelForm.apiModel" placeholder="填写服务提供方实际支持的模型 ID" /></el-form-item>
        <el-form-item label="支持的推理强度" required><el-select v-model="modelForm.efforts" multiple><el-option v-for="item in effortOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <div class="form-grid"><el-form-item label="模型状态"><el-switch v-model="modelForm.enabled" active-text="启用" /></el-form-item><el-form-item label="Ultra 模式"><el-switch v-model="modelForm.ultra" active-text="支持" /></el-form-item></div>
        <el-alert v-if="modelError" :title="modelError" type="error" :closable="false" />
      </el-form>
      <template #footer><el-button :disabled="saving" @click="modelVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveModel">保存模型</el-button></template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import KnowledgeManager from "./KnowledgeManager.vue";
import { getAiModels, getAiSettings, saveAiModel, saveAiSettings, type AiModel, type AiSettings } from "@/api/modules/ai";

const props = defineProps<{ modelValue: boolean; apiConfigured: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; changed: [] }>();
const tab = ref("knowledge"), models = ref<AiModel[]>([]), settings = ref<AiSettings>();
const loading = ref(false), saving = ref(false), error = ref(""), modelError = ref("");
const modelVisible = ref(false), editing = ref(false);
const emptyModel = (): AiModel => ({ id: "", name: "", apiModel: "", efforts: ["medium"], enabled: false, ultra: false });
const modelForm = ref<AiModel>(emptyModel());
const effortOptions = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];
const defaultEfforts = computed(() => models.value.find(item => item.id === settings.value?.defaultModel)?.efforts || []);
const message = (value: unknown) => value instanceof Error ? value.message : "操作失败，请重试";
const beforeClose = (done: () => void) => { if (!saving.value) done(); };
async function load() {
  loading.value = true; error.value = "";
  try {
    const [modelResponse, settingsResponse] = await Promise.all([getAiModels(), getAiSettings()]);
    models.value = modelResponse.data; settings.value = { ...settingsResponse.data };
  } catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
function editModel(model?: AiModel) {
  editing.value = Boolean(model); modelError.value = "";
  modelForm.value = model ? { ...model, efforts: [...model.efforts] } : emptyModel();
  modelVisible.value = true;
}
function syncDefaultEffort() {
  if (settings.value && !defaultEfforts.value.includes(settings.value.defaultEffort)) settings.value.defaultEffort = defaultEfforts.value[0] || "";
}
async function saveModel() {
  const model = modelForm.value;
  if (!model.id.trim() || !model.name.trim() || !model.apiModel.trim() || !model.efforts.length) {
    modelError.value = "请填写模型标识、名称、接口模型 ID 和推理强度"; return;
  }
  saving.value = true; modelError.value = "";
  try {
    await saveAiModel({ ...model, id: model.id.trim(), name: model.name.trim(), apiModel: model.apiModel.trim() });
    modelVisible.value = false; await load(); emit("changed"); ElMessage.success("模型目录已保存");
  } catch (cause) { modelError.value = message(cause); }
  finally { saving.value = false; }
}
async function saveSettings() {
  if (!settings.value) return;
  if (!settings.value.defaultModel || !defaultEfforts.value.includes(settings.value.defaultEffort)) {
    error.value = "请选择已启用的默认模型和支持的推理强度"; return;
  }
  saving.value = true; error.value = "";
  try {
    await saveAiSettings(settings.value);
    settings.value = (await getAiSettings()).data;
    emit("changed"); ElMessage.success("系统设置已保存");
  }
  catch (cause) { error.value = message(cause); }
  finally { saving.value = false; }
}
watch(() => props.modelValue, value => { if (value) void load(); }, { immediate: true });
</script>

<style scoped>
.notice { margin-bottom: 16px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.toolbar p { margin: 0; color: var(--el-text-color-secondary); line-height: 1.7; font-size: 13px; }
.settings-form { max-width: 700px; padding-top: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
.el-input-number { width: 100%; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .toolbar { align-items: flex-start; } }
</style>
