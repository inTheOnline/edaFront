<template>
  <section v-loading="loading" class="knowledge-manager">
    <div class="toolbar"><p>已发布文档用于回答操作方法，访问范围由文档权限决定。</p><el-button type="primary" :icon="Plus" @click="edit()">新增文档</el-button></div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-table :data="documents" border empty-text="暂无知识文档">
      <el-table-column prop="title" label="标题" min-width="190" show-overflow-tooltip />
      <el-table-column label="所属模块" width="100"><template #default="{ row }">{{ moduleName(row.module) }}</template></el-table-column>
      <el-table-column label="状态" width="95"><template #default="{ row }"><el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">{{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}</el-tag></template></el-table-column>
      <el-table-column prop="version" label="版本" width="65" />
      <el-table-column label="操作" min-width="210"><template #default="{ row }">
        <el-button link type="primary" @click="edit(row)">编辑</el-button>
        <el-button link type="primary" :disabled="busy || row.status === 'PUBLISHED'" @click="publish(row)">发布</el-button>
        <el-button link type="primary" :disabled="row.status !== 'PUBLISHED'" @click="download(row)">下载</el-button>
        <el-button link type="danger" :disabled="busy" @click="remove(row)">删除</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="visible" :title="form.id ? '编辑知识文档' : '新增知识文档'" width="min(820px, 96vw)" append-to-body :close-on-click-modal="false" :before-close="beforeClose">
      <el-form label-position="top">
        <el-form-item label="标题" required><el-input v-model="form.title" maxlength="150" show-word-limit /></el-form-item>
        <div class="form-grid">
          <el-form-item label="所属模块" required><el-select v-model="form.module" filterable><el-option v-for="item in modules" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="访问权限"><el-select v-model="permissions" multiple filterable allow-create default-first-option placeholder="留空仅超级管理员"><el-option v-for="item in permissionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        </div>
        <p class="hint">留空仅超级管理员可读。填写多项权限时，读者须同时拥有全部权限；新增标识使用 menu:页面路径 或 perm:业务权限。</p>
        <el-form-item label="正文" required><el-input v-model="form.content" type="textarea" :rows="14" maxlength="100000" placeholder="填写操作步骤、字段说明和业务规则" /></el-form-item>
        <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" />
      </el-form>
      <template #footer><el-button :disabled="busy" @click="visible = false">取消</el-button><el-button type="primary" :loading="busy" @click="save">保存草稿</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { getAiDocuments, saveAiDocument, publishAiDocument, deleteAiDocument, downloadAiDocument, type AiDocument } from "@/api/modules/ai";

const documents = ref<AiDocument[]>([]), loading = ref(false), busy = ref(false), visible = ref(false);
const error = ref(""), saveError = ref(""), permissions = ref<string[]>([]);
const form = ref<AiDocument>({ title: "", module: "base", content: "" });
const modules = [
  { value: "base", label: "基础资料" }, { value: "bom", label: "产品 BOM" }, { value: "order", label: "订单" },
  { value: "shipping", label: "出退货对账" }, { value: "purchase", label: "原辅料采购" }, { value: "office", label: "办公用品" },
  { value: "stock", label: "仓储" }, { value: "outgoing", label: "外发" }, { value: "production", label: "生产包装效率" },
  { value: "hr", label: "人事考勤薪酬" }, { value: "report", label: "经营统计" }, { value: "system", label: "系统" }
];
const permissionOptions = [
  { value: "admin", label: "仅超级管理员" }, { value: "perm:ai:use", label: "AI 使用权限" },
  { value: "menu:/order/orderTable", label: "订单页面权限" }, { value: "perm:stock:view", label: "库存查看权限" },
  { value: "perm:price:view", label: "价格查看权限" }, { value: "perm:production:eff:view", label: "生产效率查看权限" }
];
const moduleName = (value: string) => modules.find(item => item.value === value)?.label || value;
const message = (value: unknown) => value instanceof Error ? value.message : "操作失败，请重试";
const beforeClose = (done: () => void) => { if (!busy.value) done(); };
async function load() {
  loading.value = true; error.value = "";
  try { documents.value = (await getAiDocuments()).data; }
  catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
function edit(document?: AiDocument) {
  form.value = document ? { ...document } : { title: "", module: "base", content: "" };
  permissions.value = []; saveError.value = "";
  if (document?.permissionsJson) {
    try {
      const parsed: unknown = JSON.parse(document.permissionsJson);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === "string")) throw new Error();
      permissions.value = parsed;
    } catch { ElMessage.error("文档权限格式异常，请先核对数据"); return; }
  }
  visible.value = true;
}
async function save() {
  if (!form.value.title.trim() || !form.value.module.trim() || !form.value.content.trim()) {
    saveError.value = "请填写标题、所属模块和正文"; return;
  }
  busy.value = true; saveError.value = "";
  try {
    await saveAiDocument({ ...form.value, title: form.value.title.trim(), permissionsJson: permissions.value.length ? JSON.stringify(permissions.value) : undefined });
    visible.value = false; ElMessage.success("已保存草稿"); await load();
  } catch (cause) { saveError.value = message(cause); }
  finally { busy.value = false; }
}
async function publish(document: AiDocument) {
  if (!document.id) return;
  try { await ElMessageBox.confirm(`发布“${document.title}”供 AI 检索？`, "发布文档", { confirmButtonText: "发布", cancelButtonText: "取消" }); } catch { return; }
  busy.value = true;
  try { await publishAiDocument(document.id); ElMessage.success("文档已发布"); await load(); }
  catch (cause) { ElMessage.error(message(cause)); }
  finally { busy.value = false; }
}
async function remove(document: AiDocument) {
  if (!document.id) return;
  try { await ElMessageBox.confirm(`删除“${document.title}”后将不再用于新回答。`, "删除文档", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }); } catch { return; }
  busy.value = true;
  try { await deleteAiDocument(document.id); await load(); }
  catch (cause) { ElMessage.error(message(cause)); }
  finally { busy.value = false; }
}
async function download(document: AiDocument) {
  if (!document.id) return;
  try { await downloadAiDocument(document.id, document.title); }
  catch (cause) { ElMessage.error(message(cause)); }
}
onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; gap: 16px; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.toolbar p, .hint { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.hint { margin: -4px 0 18px; }
.form-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
.el-alert { margin-bottom: 16px; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; gap: 0; } .toolbar { align-items: flex-start; } }
</style>
