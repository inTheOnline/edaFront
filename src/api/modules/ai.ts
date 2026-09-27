import http from "@/api";
import { useUserStore } from "@/stores/modules/user";
import router from "@/routers";
import { LOGIN_URL } from "@/config";

export interface AiModel {
  id: string;
  name: string;
  apiModel: string;
  efforts: string[];
  enabled: boolean;
  ultra: boolean;
}
export interface AiSettings {
  defaultModel: string;
  defaultEffort: string;
  toolLimit: number;
  maxAgents: number;
  timeoutSeconds: number;
  historyLimit: number;
  maxOutputTokens: number;
  enabled: boolean;
}
export interface AiCapabilities {
  admin: boolean;
  canUse: boolean;
  apiConfigured: boolean;
  models: AiModel[];
  settings?: AiSettings;
}
export interface AiConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export interface AiSource {
  title: string;
  url?: string;
  kind?: string;
  id?: string | number;
  documentId?: number;
  version?: number;
}
export interface AiEvidence {
  reference?: string;
  tool: string;
  data: unknown;
  sources: AiSource[];
}
export interface AiMessage {
  id: number;
  role: string;
  content: string;
  status: string;
  sourcesJson?: string;
  model?: string;
  mode?: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
  createdAt?: string;
}
export interface AiDocument {
  id?: number;
  title: string;
  module: string;
  content: string;
  status?: "DRAFT" | "PUBLISHED";
  version?: number;
  permissionsJson?: string;
}
export interface AiChatRequest {
  conversationId: number;
  message: string;
  modelId?: string;
  effort?: string;
  mode?: "STANDARD" | "ULTRA";
}
export type AiStreamEvent =
  | { event: "start"; data: { runId: string; conversationId: number } }
  | { event: "status"; data: { message: string } }
  | { event: "delta"; data: { text: string } }
  | { event: "evidence"; data: AiEvidence }
  | { event: "done"; data: { messageId: number; status: string; model: string; mode: string; inputTokens?: number; outputTokens?: number } }
  | { event: "error"; data: { message: string } }
  | { event: "clarification"; data: { message: string; candidates: { kind: string; id: string | number; value: string; displayName?: string }[] } };

const options = { loading: false, cancel: false };
export const getAiCapabilities = (timeout?: number) => http.get<AiCapabilities>("/ai/capabilities", {}, { ...options, ...(timeout ? { timeout } : {}) });
export const getAiConversations = () => http.get<AiConversation[]>("/ai/conversations", {}, options);
export const createAiConversation = (title: string) => http.post<AiConversation>("/ai/conversations", { title }, options);
export const deleteAiConversation = (id: number) => http.delete(`/ai/conversations/${id}`, {}, options);
export const getAiMessages = (id: number) => http.get<AiMessage[]>(`/ai/conversations/${id}/messages`, {}, options);
export const cancelAiRun = (id: string) => http.post(`/ai/runs/${encodeURIComponent(id)}/cancel`, {}, options);
export const getAiDocuments = () => http.get<AiDocument[]>("/ai/documents", {}, options);
export const saveAiDocument = (document: AiDocument) => http.post<AiDocument>("/ai/documents", document, options);
export const publishAiDocument = (id: number) => http.post<AiDocument>(`/ai/documents/${id}/publish`, {}, options);
export const deleteAiDocument = (id: number) => http.delete(`/ai/documents/${id}`, {}, options);
export const getAiModels = () => http.get<AiModel[]>("/ai/models", {}, options);
export const saveAiModel = (model: AiModel) => http.put<AiModel>("/ai/models", model, options);
export const getAiSettings = () => http.get<AiSettings>("/ai/settings", {}, options);
export const saveAiSettings = (settings: AiSettings) => http.put<AiSettings>("/ai/settings", settings, options);

function apiUrl(path: string) {
  return `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${path}`;
}

function loginExpired() {
  useUserStore().setToken("");
  void router.replace(LOGIN_URL);
  return new Error("登录已失效，请重新登录");
}

async function responseError(response: Response) {
  if (response.status === 401) return loginExpired();
  const data = await response.json().catch(() => null);
  if (String(data?.code) === "401") return loginExpired();
  return new Error(data?.message || data?.msg || `请求失败（${response.status}）`);
}

// 流式响应独立读取，保留现有 token 认证，不经过普通 JSON 响应拦截器。
export async function streamAiChat(
  request: AiChatRequest,
  signal: AbortSignal,
  onEvent: (event: AiStreamEvent) => void,
  timeoutSeconds: number
) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, (timeoutSeconds + 15) * 1000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetch(apiUrl("/ai/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", token: useUserStore().token },
      credentials: "include",
      body: JSON.stringify(request),
      signal: controller.signal
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/event-stream")) throw await responseError(response);
    if (!response.body) throw new Error("当前浏览器无法读取流式回答");
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "", completed = false;
    const consume = (frame: string) => {
      let event = "message";
      const data: string[] = [];
      frame.split("\n").forEach(line => {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      });
      if (!data.length) return;
      if (!["start", "status", "delta", "evidence", "done", "error", "clarification"].includes(event)) return;
      const payload = JSON.parse(data.join("\n"));
      onEvent({ event, data: payload } as AiStreamEvent);
      // 后端可能先发 error，再发包含保存记录和最终状态的 done。
      if (event === "done" || event === "clarification" || event === "error") completed = true;
    };
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      // 按行识别 CRLF，避免网络分片恰好拆开 CR 和 LF。
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!completed) throw new Error("连接已中断，回答未完成，请重试");
  } catch (error) {
    if (timedOut) throw new Error("回答超时，请缩小查询范围后重试");
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
    await reader?.cancel().catch(() => undefined);
    reader?.releaseLock();
  }
}

export async function downloadAiDocument(id: number, title: string) {
  const response = await fetch(apiUrl(`/ai/documents/${id}/download`), {
    headers: { token: useUserStore().token }, credentials: "include"
  });
  if (!response.ok || response.headers.get("content-type")?.includes("application/json")) throw await responseError(response);
  const href = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${title.replace(/[\\/:*?"<>|]/g, "_") || "知识文档"}.md`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
