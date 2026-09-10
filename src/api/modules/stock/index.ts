import http from "@/api";
import { ReqPage, ResPage } from "@/api/interface";

export interface StockWarehouse {
  id: number;
  code: string;
  name: string;
  itemType: "PRODUCT" | "RAW" | "ASSIST";
  summaryMode: "DUAL" | "NORMAL";
  flowProfile: string;
  sort: number;
}

export interface StockFlowType {
  code: string;
  name: string;
  direction: "IN" | "OUT";
  color?: string;
}

export interface StockFlowTypeSetting extends StockFlowType {
  id: number;
  warehouseCode: string;
  qualityStatus: string;
  enabled: number;
  frontShow: number;
}
export const getFlowTypeSettings = () => http.get<StockFlowTypeSetting[]>("/stock/v2/flowTypes/settings");
export const updateFlowTypeSettings = (id: number, settings: { enabled?: number; frontShow?: number }) =>
  http.put(`/stock/v2/flowTypes/${id}/settings`, settings);

export interface StockPost {
  relatedPerson: string;
  warehouseCode: string;
  itemType: string;
  sourceItemId: number;
  flowTypeCode: string;
  quantity: number;
  bizDate: string;
  remark?: string;
}

export const getWarehouses = (itemType?: string) => http.get<StockWarehouse[]>("/stock/v2/warehouses", { itemType });
export const getFlowTypes = (warehouseCode: string) =>
  http.get<StockFlowType[]>("/stock/v2/flowTypes", { warehouseCode });
export interface StockFlowSummary {
  qualityStatus: string;
  openingQuantity: number;
  inQuantity: number;
  outQuantity: number;
  netQuantity: number;
  closingQuantity: number;
}
export const qualityName = (quality: string) => ({ READY: "未检", QUALIFIED: "已检", NORMAL: "普通库存" }[quality] || quality);
export const getStockFlow = (params: ReqPage) => http.post<ResPage<any>>("/stock/v2/flow/page", params);
export const checkStock = (warehouseCode: string) => http.get<any[]>("/stock/v2/check", { warehouseCode });
export const getStockTotal = (warehouseCode: string, params: ReqPage) =>
  http.post<ResPage<any>>(`/stock/v2/total/page?warehouseCode=${encodeURIComponent(warehouseCode)}`, params);
export const addStockFlow = (params: StockPost) => http.post("/stock/v2/manual", params);
export const addStockFlowBatch = (params: StockPost[]) => http.post("/stock/v2/manual/batch", params);
export const editStockFlow = (docId: number, params: StockPost) => http.put(`/stock/v2/manual/${docId}`, params);
export const deleteStockFlow = (docId: number) => http.delete(`/stock/v2/flow/${docId}`);
export const deleteStockFlowBatch = (docIds: number[]) => http.post("/stock/v2/flow/deleteBatch", docIds);

export const getRawOptions = () => http.post<ResPage<any>>("/raw/getAll", { pageNum: 1, pageSize: 10000 });
export const getAssistOptions = () => http.post<ResPage<any>>("/assistMater/page", { pageNum: 1, pageSize: 10000 });

export interface StockOverviewData {
  summary: StockFlowSummary[];
  trend: { bizDate: string; inQuantity: number; outQuantity: number }[];
  distribution: { itemId: number; itemCode: string; itemName: string; quantity: number }[];
}
export const getStockOverview = (params: ReqPage & { warehouseCode: string; sourceItemId?: number; qualityStatus?: string; bizDate?: string[] }) =>
  http.post<StockOverviewData>("/stock/v2/overview", params);
