import http from "@/api";
import type { Production } from "@/api/interface/production";

export interface PageData<T> { records: T[]; total: number; current: number; size: number }
export interface EffBatch { id: number; month: string; startDate: string; endDate: string; createdAt: string }
export interface EffStandard {
  id: number; batchId: number; materId: number; materNum: string; materName: string; process: string;
  oldRate: number | null; rate: number | null; employeeCount: number; totalHours: number; productionDays: number;
  status: string; reason: string; evidence: string; approvedAt: string | null; approvedName: string | null;
}
export interface EffRun { id: number; startDate: string; endDate: string; createdAt: string; actorName: string; ruleVersion: string }
export interface EffSummary { operatorId: number | null; operatorName: string; actualHours: number; excludedHours: number; standardHours: number; efficiency: number | null; includedCount: number; recordCount: number }
export interface EffDetail { id: number; productionId: number; revision: number; date: string; operatorName: string; materNum: string; process: string; qty: number; hours: number; standardRate: number | null; standardHours: number | null; included: number; reason: string; standardId: number | null }
export interface EffReviewData { production: Production; versions: { id: number; revision: number; action: string; snapshot: string; evidence: string; createdAt: string }[]; reviews: { id: number; action: string; note: string; actorName: string; createdAt: string }[] }
const base = "/production/eff";
export const getEffOverview = () => http.get<{ records: { status: string; count: number }[]; activeCount: number; excludedProcesses: { process: string; reason: string }[] }>(`${base}/overview`);
export const getEffBatches = () => http.get<EffBatch[]>(`${base}/standard/batches`);
export const getEffStandards = (params: object) => http.post<PageData<EffStandard>>(`${base}/standard/page`, params);
export const getEffStandardHistory = (id: number) => http.get<{ candidate: EffStandard; batch: EffBatch; history: EffStandard[] }>(`${base}/standard/${id}/history`);
export const confirmEffStandards = (params: { batchId: number; ids?: number[]; all?: boolean }) => http.post<number>(`${base}/standard/confirm`, params);
export const getEffReview = (id: number) => http.get<EffReviewData>(`${base}/review/${id}`);
export const resolveEffReview = (params: object) => http.post(`${base}/review`, params);
export const createEffRun = (params: object) => http.post<number>(`${base}/result`, params);
export const getEffRuns = (params: object) => http.post<PageData<EffRun>>(`${base}/result/page`, params);
export const getEffResult = (id: number) => http.get<{ run: EffRun; summary: EffSummary[] }>(`${base}/result/${id}`);
export const getEffDetails = (id: number, params: object) => http.post<PageData<EffDetail>>(`${base}/result/${id}/detail`, params);
export const effStatus: Record<string, string> = { UNCHECKED: "待检测", NORMAL: "有效", INSUFFICIENT: "历史不足", PENDING: "待核实", VERIFIED: "已核对无误", CORRECTED: "已更正", UNKNOWN: "无法核实", INVALID: "基础无效", EXCLUDED: "不参与效率", DELETED: "已删除" };
export const standardStatus: Record<string, string> = { PENDING: "待确认", APPROVED: "已确认", INSUFFICIENT: "样本不足", UNCHANGED: "无变化" };
export const numberText = (value: number | null | undefined) => value == null ? "—" : Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// 兼容局域网HTTP访问，不依赖仅安全上下文可用的randomUUID。
export const requestKey = () => `${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join("")}`;

// 只格式化展示，保留接口和证据中原始时间，不进行时区换算。
export const formatEffTime = (value?: string | null, empty = '—') => value ? value.replace(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/, '$1 $2') : empty;
