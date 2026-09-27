<template>
  <div v-loading="initializing" class="ai-page">
    <header class="page-header">
      <div><h1>AI 助手</h1><p>查询业务数据，查阅操作方法。</p></div>
      <el-button v-if="capabilities?.admin && serviceReady" :icon="Setting" :disabled="sending" @click="adminVisible = true">AI 管理</el-button>
    </header>
    <el-alert v-if="pageError" :title="pageError" type="error" :closable="false"><template #default><el-button link type="primary" @click="initialize">重新加载</el-button></template></el-alert>
    <el-alert v-if="capabilities && !capabilities.canUse" title="尚未开通 AI 使用权限，请联系管理员。" type="warning" :closable="false" />
    <el-alert v-else-if="capabilities?.ready === false" :title="capabilities.reason || 'AI 服务尚未初始化，暂时无法创建会话或生成回答。'" type="warning" :closable="false"><template #default><el-button link type="primary" @click="initialize">重新检查</el-button></template></el-alert>
    <el-alert v-else-if="capabilities && !capabilities.apiConfigured" title="模型 API 尚未配置，暂时无法生成回答。" type="info" :closable="false" />
    <el-alert v-else-if="capabilities?.settings && !capabilities.settings.enabled" title="AI 服务已停用。" type="info" :closable="false" />
    <el-alert v-else-if="capabilities && !selectedModel" title="暂无已启用的模型，请联系管理员核对模型目录。" type="warning" :closable="false" />
    <div v-if="capabilities?.canUse" class="workspace">
      <aside class="conversation-panel">
        <div class="conversation-heading"><h2>会话</h2><el-button :icon="Plus" :disabled="!serviceReady || sending || loadingMessages" @click="newConversation">新建会话</el-button></div>
        <el-empty v-if="!conversations.length" description="暂无会话" :image-size="64" />
        <nav v-else class="conversation-list" aria-label="历史会话">
          <div v-for="conversation in conversations" :key="conversation.id" class="conversation-row" :class="{ selected: selectedId === conversation.id }">
            <button class="conversation-button" :disabled="sending" :aria-current="selectedId === conversation.id ? 'true' : undefined" @click="selectConversation(conversation.id)"><span>{{ conversation.title || '新会话' }}</span><time>{{ formatTime(conversation.updatedAt || conversation.createdAt) }}</time></button>
            <el-button class="delete-conversation" text :icon="Delete" :disabled="sending" :aria-label="`删除会话：${conversation.title}`" @click="removeConversation(conversation)" />
          </div>
        </nav>
      </aside>
      <main class="chat-panel">
        <div class="chat-heading">
          <div><h2>{{ currentTitle }}</h2><span class="scope-hint">{{ selectedId ? '历史消息按当前权限展示，部分内容可能已不可见' : '依据当前账号权限查询' }}</span></div>
          <div v-if="capabilities.admin" class="model-controls">
            <el-select v-model="modelId" aria-label="模型" :disabled="!serviceReady || sending" @change="syncEffort"><el-option v-for="model in availableModels" :key="model.id" :label="model.name" :value="model.id" /></el-select>
            <el-select v-model="effort" aria-label="推理强度" :disabled="!serviceReady || sending"><el-option v-for="value in selectedModel?.efforts || []" :key="value" :label="value" :value="value" /></el-select>
            <el-select v-model="mode" aria-label="工作模式" :disabled="!serviceReady || sending"><el-option label="标准" value="STANDARD" /><el-option label="Ultra" value="ULTRA" :disabled="!selectedModel?.ultra" /></el-select>
          </div>
          <el-tag v-else type="info">{{ defaultModelName }}</el-tag>
          <el-button text :icon="Refresh" :disabled="!serviceReady || sending || loadingMessages" aria-label="刷新权限与历史" title="刷新权限与历史" @click="refreshHistory" />
        </div>
        <div ref="messageList" v-loading="loadingMessages" class="message-list" role="log" aria-label="对话内容" :aria-busy="sending">
          <section v-if="!messages.length && !loadingMessages" class="empty-chat">
            <el-icon :size="32"><ChatDotRound /></el-icon><h2>{{ selectedId ? '当前会话没有可见消息' : '从一个具体问题开始' }}</h2>
            <p>{{ selectedId ? '历史内容会按当前权限筛选。你可以继续提问。' : '说明客户、产品、单据或时间范围，便于找到准确依据。' }}</p>
            <div class="examples"><el-button v-for="example in examples" :key="example" :disabled="!canSend" @click="draft = example">{{ example }}</el-button></div>
          </section>
          <article v-for="message in messages" :key="message.uiKey" class="message" :class="{ 'user-message': message.role === 'user' }">
            <div class="message-label"><strong>{{ message.role === 'user' ? '我' : 'AI 助手' }}</strong><span v-if="message.role !== 'user'">{{ statusLabel(message.status) }}</span></div>
            <div class="message-content">{{ message.content || (message.status === 'RUNNING' ? '正在处理…' : '暂无正文') }}</div>
            <AnswerEvidence v-if="message.role !== 'user'" :evidence="message.evidence" />
            <div v-if="message.candidates?.length" class="candidate-list"><el-button v-for="candidate in message.candidates" :key="`${candidate.kind}:${candidate.id}`" :disabled="sending" @click="chooseCandidate(candidate)">{{ candidate.displayName ? `${candidate.displayName}（${candidate.value}）` : candidate.value }}</el-button></div>
            <div v-if="message.role !== 'user' && message.model" class="message-meta">{{ message.model }}<span v-if="message.mode === 'ULTRA'"> · Ultra</span><span v-if="message.outputTokens != null"> · 输出 {{ message.outputTokens }} Token</span></div>
          </article>
        </div>
        <form class="composer" @submit.prevent="send">
          <div v-if="sending" class="run-status" role="status"><el-icon class="is-loading"><Loading /></el-icon>{{ runStatus || '正在回答…' }}</div>
          <el-alert v-if="chatError" :title="chatError" type="error" :closable="false" class="chat-error" />
          <el-input v-model="draft" aria-label="输入问题" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" maxlength="4000" placeholder="例如：胜蓝有哪些未交订单？" :disabled="!canSend || loadingMessages" @keydown="onInputKey" />
          <div class="composer-footer"><span>Enter 发送 · Shift + Enter 换行</span><el-button v-if="sending" :loading="stopping" @click="stop">停止回答</el-button><el-button v-else native-type="submit" type="primary" :icon="Promotion" :disabled="!canSend || loadingMessages || !draft.trim()">发送</el-button></div>
        </form>
      </main>
    </div>
    <AdminPanel v-if="capabilities?.admin && serviceReady" v-model="adminVisible" :api-configured="capabilities.apiConfigured" @changed="refreshCapabilities" />
  </div>
</template>

<script setup lang="ts" name="aiAssistant">
import { computed, nextTick, onDeactivated, onMounted, onUnmounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ChatDotRound, Delete, Loading, Plus, Promotion, Refresh, Setting } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/modules/user";
import { useAuthStore } from "@/stores/modules/auth";
import AnswerEvidence from "./components/AnswerEvidence.vue";
import AdminPanel from "./components/AdminPanel.vue";
import { getAiCapabilities, getAiConversations, createAiConversation, deleteAiConversation, getAiMessages, streamAiChat, cancelAiRun,
  type AiCapabilities, type AiConversation, type AiMessage, type AiEvidence, type AiStreamEvent } from "@/api/modules/ai";

type Candidate = { kind: string; id: string | number; value: string; displayName?: string };
type ChatMessage = AiMessage & { uiKey: string; evidence: AiEvidence[]; candidates?: Candidate[] };
const user = useUserStore();
const auth = useAuthStore();
const capabilities = ref<AiCapabilities>(), conversations = ref<AiConversation[]>([]), messages = ref<ChatMessage[]>([]);
const selectedId = ref<number>(), draft = ref(""), modelId = ref(""), effort = ref(""), mode = ref<"STANDARD" | "ULTRA">("STANDARD");
const initializing = ref(false), loadingMessages = ref(false), sending = ref(false), stopping = ref(false), adminVisible = ref(false);
const pageError = ref(""), chatError = ref(""), runStatus = ref(""), messageList = ref<HTMLElement>();
let controller: AbortController | undefined, runId: string | undefined, loadVersion = 0;
const availableModels = computed(() => capabilities.value?.models.filter(model => model.enabled) || []);
const selectedModel = computed(() => availableModels.value.find(model => model.id === modelId.value));
const defaultModelName = computed(() => capabilities.value?.models.find(model => model.id === capabilities.value?.settings?.defaultModel)?.name || "系统默认模型");
const currentTitle = computed(() => conversations.value.find(item => item.id === selectedId.value)?.title || "新会话");
const serviceReady = computed(() => Boolean(capabilities.value?.canUse && capabilities.value.ready !== false && capabilities.value.settings));
const canSend = computed(() => Boolean(serviceReady.value && capabilities.value?.apiConfigured && capabilities.value.settings?.enabled && selectedModel.value));
const examples = ["胜蓝有哪些未交订单？", "如何录入采购单？", "查询本月生产进度"];
const errorMessage = (error: unknown) => error instanceof Error ? error.message : (error as { message?: string })?.message || "请求失败，请重试";
const formatTime = (value?: string) => value ? value.replace("T", " ").slice(0, 16) : "";
function statusLabel(status: string) {
  return ({ RUNNING: "处理中", FAILED: "失败", ERROR: "失败", CANCELLED: "已停止", CANCELED: "已停止", CLARIFICATION: "待确认", TIMEOUT: "已超时" } as Record<string, string>)[status?.toUpperCase()] || "";
}
function syncEffort() {
  if (!selectedModel.value?.efforts.includes(effort.value)) effort.value = selectedModel.value?.efforts[0] || "";
  if (!selectedModel.value?.ultra) mode.value = "STANDARD";
}
function clearAiState() {
  loadVersion++; loadingMessages.value = false;
  capabilities.value = undefined; messages.value = []; conversations.value = []; selectedId.value = undefined;
  modelId.value = ""; effort.value = ""; mode.value = "STANDARD"; adminVisible.value = false;
}
async function loadCapabilities() {
  const token = user.token;
  try {
    const data = (await getAiCapabilities()).data;
    if (token !== user.token) return;
    if (!data.canUse || data.ready === false) clearAiState();
    capabilities.value = data; auth.aiCanUse = data.canUse === true; pageError.value = "";
    if (!data.canUse || data.ready === false) return;
    if (!data.settings) throw new Error("AI 配置未返回，请刷新后重试");
    if (!modelId.value || !data.models.some(model => model.id === modelId.value && model.enabled) || !data.admin) {
      modelId.value = data.settings.defaultModel; effort.value = data.settings.defaultEffort;
    }
    syncEffort();
  } catch (error) {
    if (token !== user.token) return;
    clearAiState();
    const failure = error as { code?: string; response?: { status?: number } };
    if (["401", "403"].includes(String(failure.response?.status || failure.code))) auth.aiCanUse = false;
    pageError.value = errorMessage(error);
    throw error;
  }
}
async function refreshCapabilities() {
  pageError.value = "";
  try { await loadCapabilities(); }
  catch (error) { pageError.value = errorMessage(error); }
}
async function refreshHistory() {
  try {
    await loadCapabilities();
    if (!serviceReady.value) { messages.value = []; conversations.value = []; return; }
    if (selectedId.value) await selectConversation(selectedId.value);
  } catch (error) { chatError.value = errorMessage(error); }
}
async function initialize() {
  const token = user.token;
  initializing.value = true; pageError.value = "";
  try {
    await loadCapabilities();
    if (serviceReady.value) {
      const data = (await getAiConversations()).data;
      if (token !== user.token) return;
      conversations.value = data;
      if (conversations.value.length) await selectConversation(conversations.value[0].id);
    }
  } catch (error) { pageError.value = errorMessage(error); }
  finally { initializing.value = false; }
}
function parseMessage(message: AiMessage): ChatMessage {
  let evidence: AiEvidence[] = [];
  if (message.sourcesJson) {
    try { const parsed = JSON.parse(message.sourcesJson); if (Array.isArray(parsed)) evidence = parsed; }
    catch { /* 旧消息缺少可解析依据时仍展示正文。 */ }
  }
  return { ...message, uiKey: `saved-${message.id}`, evidence };
}
async function scrollToLatest(force = false) {
  const element = messageList.value;
  if (!element) return;
  const follow = force || element.scrollHeight - element.scrollTop - element.clientHeight < 160;
  await nextTick();
  if (follow) element.scrollTop = element.scrollHeight;
}
async function selectConversation(id: number) {
  if (sending.value) return;
  const version = ++loadVersion;
  selectedId.value = id; loadingMessages.value = true; chatError.value = ""; messages.value = [];
  try {
    const data = (await getAiMessages(id)).data;
    if (version !== loadVersion) return;
    messages.value = data.map(parseMessage); await scrollToLatest(true);
  } catch (error) { if (version === loadVersion) chatError.value = errorMessage(error); }
  finally { if (version === loadVersion) loadingMessages.value = false; }
}
function newConversation() {
  if (sending.value) return;
  loadVersion++; selectedId.value = undefined; messages.value = []; draft.value = ""; chatError.value = "";
}
async function removeConversation(conversation: AiConversation) {
  try { await ElMessageBox.confirm(`删除会话“${conversation.title}”？`, "删除会话", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }); } catch { return; }
  try {
    await deleteAiConversation(conversation.id);
    conversations.value = conversations.value.filter(item => item.id !== conversation.id);
    if (selectedId.value === conversation.id) newConversation();
  } catch (error) { ElMessage.error(errorMessage(error)); }
}
function onInputKey(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent)) return;
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!sending.value) void send(); }
}
function chooseCandidate(candidate: Candidate) {
  draft.value = candidate.value;
  void send();
}
async function send() {
  const text = draft.value.trim();
  const capability = capabilities.value, settings = capability?.settings;
  if (!text || sending.value || !canSend.value || !capability || !settings) return;
  if (text.length > 4000) { chatError.value = "问题不能超过 4000 字"; return; }
  sending.value = true; chatError.value = ""; runStatus.value = "正在准备查询…"; runId = undefined;
  const activeController = new AbortController(); controller = activeController;
  let answer: ChatMessage | undefined;
  try {
    if (!selectedId.value) {
      const conversation = (await createAiConversation(text.slice(0, 60))).data;
      if (activeController.signal.aborted) return;
      conversations.value.unshift(conversation); selectedId.value = conversation.id;
    }
    if (activeController.signal.aborted) return;
    const localId = Date.now();
    messages.value.push({ id: -localId, uiKey: `user-${localId}`, role: "user", content: text, status: "COMPLETED", evidence: [] });
    messages.value.push({ id: -localId - 1, uiKey: `assistant-${localId}`, role: "assistant", content: "", status: "RUNNING", evidence: [] });
    answer = messages.value[messages.value.length - 1];
    draft.value = ""; await scrollToLatest(true);
    const onEvent = (event: AiStreamEvent) => {
      if (!answer || activeController.signal.aborted) return;
      switch (event.event) {
        case "start": runId = String(event.data.runId); break;
        case "status": runStatus.value = event.data.message; break;
        case "delta": answer.content += event.data.text; break;
        case "evidence": answer.evidence.push(event.data); break;
        case "clarification": answer.content = event.data.message; answer.candidates = event.data.candidates; answer.status = "CLARIFICATION"; break;
        case "done": Object.assign(answer, event.data, { id: event.data.messageId }); break;
        case "error": answer.status = "FAILED"; chatError.value = event.data.message || "回答生成失败"; break;
      }
      void scrollToLatest();
    };
    await streamAiChat({ conversationId: selectedId.value, message: text,
      ...(capability.admin ? { modelId: modelId.value, effort: effort.value, mode: mode.value } : {})
    }, activeController.signal, onEvent, settings.timeoutSeconds);
    if (answer.status === "RUNNING") answer.status = "COMPLETED";
  } catch (error) {
    if (activeController.signal.aborted) { if (answer) answer.status = "CANCELLED"; }
    else { chatError.value = errorMessage(error); if (answer) answer.status = "FAILED"; }
  } finally {
    sending.value = false; stopping.value = false; runId = undefined; controller = undefined; runStatus.value = "";
  }
}
async function stop() {
  stopping.value = true;
  const activeController = controller;
  try { if (runId) await cancelAiRun(runId); }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { activeController?.abort(); stopping.value = false; }
}
function stopOnLeave() {
  if (runId) void cancelAiRun(runId).catch(() => undefined);
  controller?.abort();
}
watch(() => user.token, () => {
  stopOnLeave(); clearAiState(); auth.aiCanUse = false; draft.value = ""; pageError.value = ""; chatError.value = "";
});
onMounted(initialize);
onDeactivated(stopOnLeave);
onUnmounted(stopOnLeave);
</script>

<style scoped>
.ai-page { display: flex; height: 100%; min-height: 520px; flex-direction: column; gap: 14px; color: var(--el-text-color-primary); }
.page-header, .chat-heading, .conversation-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.page-header h1 { margin: 0; font-size: 22px; font-weight: 600; }
.page-header p { margin: 6px 0 0; font-size: 14px; color: var(--el-text-color-secondary); }
.workspace { display: grid; grid-template-columns: 250px minmax(0, 1fr); min-height: 0; flex: 1; gap: 14px; }
.conversation-panel, .chat-panel { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 8px; min-height: 0; }
.conversation-panel { display: flex; flex-direction: column; overflow: hidden; }
.conversation-heading { padding: 16px; gap: 8px; }
h2 { margin: 0; font-size: 15px; font-weight: 600; }
.conversation-list { padding: 0 8px 8px; overflow-y: auto; }
.conversation-row { display: flex; align-items: center; border-radius: 6px; margin-bottom: 4px; }
.conversation-row:hover { background: var(--el-fill-color-light); }
.conversation-row.selected { background: var(--el-color-primary-light-9); }
.conversation-button { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 7px; text-align: left; border: 0; color: inherit; background: transparent; padding: 13px 10px; cursor: pointer; font: inherit; }
.conversation-button span { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.conversation-button time { font-size: 12px; color: var(--el-text-color-secondary); }
.conversation-button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; border-radius: 5px; }
.conversation-button:disabled { cursor: wait; }
.delete-conversation { margin: 0 3px 0 0; min-width: 32px; padding: 7px; }
.chat-panel { display: flex; flex-direction: column; overflow: hidden; }
.chat-heading { padding: 15px 20px; border-bottom: 1px solid var(--el-border-color-lighter); flex-wrap: wrap; }
.chat-heading h2 { max-width: 420px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.scope-hint { display: inline-block; margin-top: 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.model-controls { display: flex; gap: 8px; flex-wrap: wrap; }
.model-controls .el-select { width: 150px; }
.model-controls .el-select:nth-child(n + 2) { width: 95px; }
.message-list { flex: 1; min-height: 180px; padding: 24px; overflow-y: auto; overscroll-behavior: contain; }
.empty-chat { display: flex; min-height: 250px; height: 100%; align-items: center; justify-content: center; flex-direction: column; text-align: center; }
.empty-chat > .el-icon { margin-bottom: 16px; color: var(--el-color-primary); }
.empty-chat h2 { font-size: 19px; }
.empty-chat p { max-width: 420px; font-size: 14px; line-height: 1.8; color: var(--el-text-color-secondary); }
.examples { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 8px; }
.examples .el-button { margin: 0; height: auto; min-height: 36px; white-space: normal; line-height: 1.5; }
.message { padding: 0 0 26px; margin: 0 0 24px; border-bottom: 1px solid var(--el-border-color-lighter); }
.message:last-child { margin-bottom: 0; border: 0; }
.message-label { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; font-size: 13px; }
.message-label > span, .message-meta { font-size: 12px; color: var(--el-text-color-secondary); }
.message-content { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.85; font-size: 14px; }
.user-message .message-content { display: inline-block; padding: 12px 16px; background: var(--el-fill-color-light); border-radius: 6px; }
.message-meta { margin-top: 16px; }
.candidate-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.candidate-list .el-button { margin: 0; }
.composer { padding: 16px 20px; border-top: 1px solid var(--el-border-color-lighter); }
.composer-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; }
.composer-footer > span { color: var(--el-text-color-secondary); font-size: 12px; }
.run-status { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 12px; color: var(--el-text-color-regular); }
.chat-error { margin-bottom: 12px; }
@media (max-width: 1100px) { .workspace { grid-template-columns: 210px minmax(0, 1fr); } .chat-heading { gap: 12px; } }
@media (max-width: 760px) {
  .ai-page { height: auto; min-height: calc(100vh - 140px); }
  .workspace { grid-template-columns: minmax(0, 1fr); }
  .conversation-panel { max-height: 170px; }
  .conversation-heading { padding: 10px 14px; }
  .conversation-list { display: flex; gap: 6px; overflow-x: auto; }
  .conversation-row { min-width: 180px; max-width: 230px; }
  .chat-panel { min-height: 560px; }
  .message-list { max-height: 55vh; padding: 18px 14px; }
  .chat-heading, .composer { padding: 14px; }
  .chat-heading h2 { max-width: 260px; }
  .model-controls { width: 100%; }
  .model-controls .el-select { flex: 1; min-width: 110px; }
  .model-controls .el-select:nth-child(n + 2) { min-width: 75px; }
}
@media (prefers-reduced-motion: reduce) { .is-loading { animation: none; } }
</style>
