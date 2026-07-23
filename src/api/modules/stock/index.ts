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

export interface StockPost {
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
export const getStockFlow = (params: ReqPage) => http.post<ResPage<any>>("/stock/v2/flow/page", params);
export const getStockTotal = (warehouseCode: string, params: ReqPage) =>
  http.post<ResPage<any>>(`/stock/v2/total/page?warehouseCode=${encodeURIComponent(warehouseCode)}`, params);
export const addStockFlow = (params: StockPost) => http.post("/stock/v2/manual", params);
export const addStockFlowBatch = (params: StockPost[]) => http.post("/stock/v2/manual/batch", params);
export const editStockFlow = (docId: number, params: StockPost) => http.put(`/stock/v2/manual/${docId}`, params);
export const deleteStockFlow = (docId: number) => http.delete(`/stock/v2/manual/${docId}`);

export const getRawOptions = () => http.post<ResPage<any>>("/raw/getAll", { pageNum: 1, pageSize: 10000 });
export const getAssistOptions = () => http.post<ResPage<any>>("/assistMater/page", { pageNum: 1, pageSize: 10000 });
