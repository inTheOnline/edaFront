import http from "@/api";
import { ReqPageT, ResultData, ResPage } from "@/api/interface/index";
import { Order } from "@/api/interface/order";
export interface StatementMaterial {
  code: string;
  name: string;
  specs: string;
  kind: string;
  unit: string;
  productCode: string;
  productName: string;
}
export interface StatementOptions {
  customer: string;
  supported: boolean;
  period: { start: string; end: string };
  periodLabel: string;
  sections: { key: string; label: string; options: StatementMaterial[] }[];
}
export interface StatementMaterialLine {
  section: string;
  code: string;
  date?: string;
  doc?: string;
  orderNum?: string;
  factory?: string;
  productCode?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  remark?: string;
}
export interface StatementRequest {
  custId?: number;
  month: string;
  extra: Record<string, string | number | undefined>;
  materials: StatementMaterialLine[];
}
export const getStatementOptions = (custId: number, month: string) =>
  http.get<StatementOptions>("/orderOut/statement/options", { custId, month });
export const exportStatement = (params: StatementRequest) => http.download("/orderOut/statement/export", params);
export interface OrderReturn {
  num: string;
  orderMaterId?: number;
  materId?: number | string;
  number: number;
  time: string;
  remark: string;
  syncStock: boolean;
  custId?: number | string | null;
  price?: number | null;
}
export interface OrderOutEdit {
  id: number;
  orderOutId?: number;
  orderMaterId: number | null;
  materId: number | string;
  custId: number | string | null;
  num: string;
  time: string;
  number: number;
  remark: string;
  price?: number | null;
  amount?: number | null;
  status?: number;
  orderNum?: string;
  materName?: string;
  headerLineCount?: number;
  syncStock?: boolean;
  scope?: "ITEM" | "DOCUMENT";
}
export const getOrderOutEditInfo = (id: number) => http.get<OrderOutEdit>("/orderOut/editInfo", { id });
export const editOrderOut = (data: OrderOutEdit) => http.put<any>("/orderOut/edit", data);
export const addOrderReturn = (params: OrderReturn) => http.post<any>("/orderOut/return", params);
export const editReturnNum = (id: number, num: string) => http.post<any>(`/orderOut/return/${id}/num`, { num });
export const getModel = () => {
  return http.download(`/orderOut/getModel`, {});
};
export const addMany = (file) => {
  return http.post<any>(`/orderOut/addMany`, file);
};
export const deleteMany = (ids: number[]) => {
  return http.post<any>(`/orderOut/deleteMany`, ids);
};
export const addOrderOut = (order: Order) => {
  return http.post<any>(`/orderOut/addOrder`, order);
};
//params分页请求参数
export const getOrderOut = (params: ReqPageT<any>) => {
  return http.post<any>(`/orderOut/all`, params);
};
export const addBatchApi = (params: Array<any>, syncStock = true) => {
  return http.post<any>(`/orderOut/addBatchApi`, params, { params: { syncStock } });
};
