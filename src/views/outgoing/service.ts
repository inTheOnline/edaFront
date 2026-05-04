import dayjs from "dayjs";
import http from "@/api";
import type { ResultData } from "@/api/interface";

export interface OutgoingPageData<T> {
  records: T[];
  total: number;
  size?: number;
  current?: number;
}

export interface OutgoingStateItem {
  stateCode: number;
  stateName: string;
  tagType?: "success" | "warning" | "danger" | "info" | "primary";
}

export interface RelatedOutbackRecord {
  outbackItemId: number;
  outbackId: number;
  outbackNum: string;
  backDate: string;
  number: number;
  state: number;
  stateLabel?: string;
  remark?: string;
}

export interface OutformRecord {
  id: number;
  subcId: number;
  subcDate: string;
  subcNum: string;
  supId: number;
  supName?: string;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  number: number;
  backNumber?: number;
  notbackNumber?: number;
  state: number;
  stateLabel?: string;
  stateTagType?: string;
  subcRemark?: string;
  remark?: string;
}

export interface OutbackRecord {
  id: number;
  outbackId: number;
  outbackNum: string;
  backDate: string;
  supId: number;
  supName?: string;
  outItemId: number;
  subcId?: number;
  subcNum?: string;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  number: number;
  state: number;
  stateLabel?: string;
  stateTagType?: string;
  outbackRemark?: string;
  remark?: string;
}

export interface OutformQuery {
  pageNum: number;
  pageSize: number;
  subcId?: number;
  subcNum?: string;
  supId?: number | string;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  state?: number;
  subcDate?: string[];
}

export interface OutformPayload {
  subcId?: number | null;
  subcDate: string;
  subcNum: string;
  supId: number | string;
  subcRemark?: string;
  materId?: number | string;
  materNum?: string;
  number: number;
  state: number;
  remark?: string;
}

export interface OutformBatchPayload {
  header: {
    subcDate: string;
    subcNumPrefix?: string;
    subcNum?: string;
    subcNumNo?: string;
    supId: number | string;
    subcRemark?: string;
  };
  rows: Array<{
    materId?: number | string;
    materNum?: string;
    number: number;
    state?: number;
    remark?: string;
  }>;
}

export interface OutbackQuery {
  pageNum: number;
  pageSize: number;
  id?: number;
  outbackId?: number;
  outbackNum?: string;
  backDate?: string[];
  supId?: number | string;
  outItemId?: number;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  state?: number;
}

export interface OutbackPayload {
  outbackId?: number | null;
  outbackNum: string;
  backDate: string;
  supId: number | string;
  state: number;
  outbackRemark?: string;
  outItemId: number;
  number: number;
  remark?: string;
}

export interface OutbackBatchPayload {
  header: {
    outbackNum: string;
    backDate: string;
    supId: number | string;
    state: number;
    outbackRemark?: string;
  };
  rows: Array<{
    outItemId: number;
    number: number;
    remark?: string;
  }>;
}

export type MaterialInfoLike = Partial<Pick<OutformRecord, "materName" | "materNum">> | Partial<Pick<OutbackRecord, "materName" | "materNum">>;

export const getOutformPageApi = (params: OutformQuery) => {
  return http.post<OutgoingPageData<OutformRecord>>("/outgoing/outform/page", params);
};

export const createOutformApi = (params: OutformPayload) => {
  return http.post<OutformRecord>("/outgoing/outform/create", params);
};

export const updateOutformApi = (id: number, params: OutformPayload) => {
  return http.put<null>("/outgoing/outform/update", { id, ...params });
};

export const deleteOutformApi = (ids: number[]) => {
  return http.post<null>("/outgoing/outform/delete", { ids });
};

export const getRelatedOutbackApi = (outItemId: number) => {
  return http.post<{ outItemId: number; total: number; records: RelatedOutbackRecord[] }>(
    "/outgoing/outform/related-outback",
    { outItemId }
  );
};

export const getOutItemStateApi = () => {
  return http.get<OutgoingStateItem[]>("/outgoing/getOutItem_state", {});
};

export const createOutformBatchApi = (params: OutformBatchPayload) => {
  return http.post<null>("/outgoing/outform/batch-create", params);
};

export const findOutformRecordApi = async (params: {
  id: number;
  subcNum?: string;
  supId?: number | string;
  materId?: number | string;
}) => {
  const buildQuery = (extra: Partial<OutformQuery> = {}) =>
    getOutformPageApi({
      pageNum: 1,
      pageSize: 200,
      subcNum: params.subcNum,
      supId: params.supId,
      materId: params.materId,
      ...extra
    });

  const primary = await unwrapData(buildQuery());
  const directMatched = (primary.records || []).find(item => Number(item.id) === Number(params.id));
  if (directMatched) return directMatched;

  const fallback = await unwrapData(buildQuery({ materId: undefined, subcNum: undefined, pageSize: 500 }));
  return (fallback.records || []).find(item => Number(item.id) === Number(params.id)) || null;
};

export const getOutbackPageApi = (params: OutbackQuery) => {
  return http.post<OutgoingPageData<OutbackRecord>>("/outgoing/outback/page", params);
};

export const createOutbackApi = (params: OutbackPayload) => {
  return http.post<OutbackRecord>("/outgoing/outback/create", params);
};

export const updateOutbackApi = (id: number, params: OutbackPayload) => {
  return http.put<null>("/outgoing/outback/update", { id, ...params });
};

export const deleteOutbackApi = (ids: number[]) => {
  return http.post<null>("/outgoing/outback/delete", { ids });
};

export const getOutbackStateApi = () => {
  return http.get<OutgoingStateItem[]>("/outgoing/getOutback_state", {});
};

export const createOutbackBatchApi = (params: OutbackBatchPayload) => {
  return http.post<null>("/outgoing/outback/batch-create", params);
};

export const formatOutgoingDate = (value?: string | null) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = dayjs(text);
  if (!parsed.isValid()) return text;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
    return parsed.tz("Asia/Shanghai").format("YYYY-MM-DD");
  }

  return parsed.format("YYYY-MM-DD");
};

export const formatMaterialLabel = (record?: MaterialInfoLike | null) => {
  const materName = record?.materName?.trim?.() || "未知物料";
  const materNum = record?.materNum?.trim?.() || "-";
  return `${materName}（${materNum}）`;
};

export const calcProjectedNotbackNumber = (params: {
  currentNotbackNumber?: number | null;
  nextReceiptNumber?: number | null;
  originalReceiptNumber?: number | null;
}) => {
  return Number(params.currentNotbackNumber || 0) + Number(params.originalReceiptNumber || 0) - Number(params.nextReceiptNumber || 0);
};

const normalizeStateValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const num = Number(trimmed);
    return Number.isNaN(num) ? trimmed : num;
  }
  return value;
};

export const mapStateEnum = (list: Array<OutgoingStateItem | Record<string, any>> = []) =>
  list
    .map(item => {
      const source = item as Record<string, any>;
      const stateCode = normalizeStateValue(source.stateCode ?? source.code ?? source.value ?? source.id);
      const stateName = source.stateName ?? source.name ?? source.label ?? "";
      if (stateCode === undefined || stateCode === null || !stateName) return null;
      return {
        label: String(stateName),
        value: stateCode,
        tagType: source.tagType || source.type || "info"
      };
    })
    .filter(Boolean) as Array<{ label: string; value: string | number; tagType: string }>;

export const unwrapData = async <T>(request: Promise<ResultData<T>>) => {
  const response = await request;
  return response.data;
};
