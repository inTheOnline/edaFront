import http from "@/api";
import { ResultData } from "@/api/interface";
import type {
  IncomingBatchPayload,
  OrderItemBatchPayload,
  RawMaterOption,
  RawMaterRelation,
  RawPurchaseIncoming,
  RawPurchaseItem,
  RawPurchaseOption,
  RawPurchasePageResult,
  RawPurchaseQuery,
  RawPurchaseRequisition,
  RequisitionBatchPayload,
} from "@/api/interface/buy/rawPurchase";

export const getRawMaterOptions = () => {
  return http.get<RawMaterOption[]>("/buy/rawPurchase/rawMater/options");
};

// 毛重、废料重历史按 g 存储，页面统一用 kg；其他重量原本就是 kg。
const relationWeight = (row: RawMaterRelation, factor: number): RawMaterRelation => ({
  ...row,
  grossWeight: row.grossWeight == null ? undefined : Number((row.grossWeight * factor).toPrecision(12)),
  utilBadWeight: row.utilBadWeight == null ? undefined : Number((row.utilBadWeight * factor).toPrecision(12)),
});
export const getRawMaterByProduct = async (materId: string | number) => {
  const response = await http.get<RawMaterRelation | null>(`/buy/rawPurchase/rawMater/product/${materId}`);
  return response.data ? relationWeight(response.data, 0.001) : null;
};
export const getRawMaterPage = async (params: RawPurchaseQuery<RawMaterRelation>) => {
  const response = await http.post<RawPurchasePageResult<RawMaterRelation>>("/buy/rawPurchase/rawMater/page", params);
  response.data.records = response.data.records.map((row) => relationWeight(row, 0.001));
  return response;
};
export const addRawMater = (data: RawMaterRelation) => {
  return http.post<ResultData>("/buy/rawPurchase/rawMater/add", relationWeight(data, 1000));
};
export const editRawMater = (data: RawMaterRelation) => {
  return http.put<ResultData>("/buy/rawPurchase/rawMater/edit", relationWeight(data, 1000));
};

export const deleteRawMater = (id: number) => {
  return http.delete<ResultData>(`/buy/rawPurchase/rawMater/delete/${id}`);
};

export const deleteBatchRawMater = (ids: number[]) => {
  return http.post<ResultData>("/buy/rawPurchase/rawMater/deleteBatch", ids);
};

export const getRequisitionPage = (params: RawPurchaseQuery<RawPurchaseRequisition>) => {
  return http.post<RawPurchasePageResult<RawPurchaseRequisition>>("/buy/rawPurchase/requisition/page", params);
};

export const addRequisition = (data: RawPurchaseRequisition) => {
  return http.post<ResultData>("/buy/rawPurchase/requisition/add", data);
};

export const editRequisition = (data: RawPurchaseRequisition) => {
  return http.put<ResultData>("/buy/rawPurchase/requisition/edit", data);
};

export const deleteRequisition = (id: number) => {
  return http.delete<ResultData>(`/buy/rawPurchase/requisition/delete/${id}`);
};

export const deleteBatchRequisition = (ids: number[]) => {
  return http.post<ResultData>("/buy/rawPurchase/requisition/deleteBatch", ids);
};

export const batchCreateRequisition = (data: RequisitionBatchPayload) => {
  return http.post<ResultData>("/buy/rawPurchase/requisition/batch-create", data);
};

export const importRequisition = (data: FormData) => {
  return http.post<ResultData>("/buy/rawPurchase/requisition/import", data);
};

export const getRequisitionModel = () => {
  return http.download("/buy/rawPurchase/requisition/getModel");
};

export const exportRequisition = (params: RawPurchaseQuery<RawPurchaseRequisition>) => {
  return http.download("/buy/rawPurchase/requisition/export", params);
};

export const getRequisitionOptions = () => {
  return http.get<RawPurchaseOption[]>("/buy/rawPurchase/requisition/options");
};

export const getOrderItemPage = (params: RawPurchaseQuery<RawPurchaseItem>) => {
  return http.post<RawPurchasePageResult<RawPurchaseItem>>("/buy/rawPurchase/orderItem/page", params);
};

export const addOrderItem = (data: RawPurchaseItem) => {
  return http.post<ResultData>("/buy/rawPurchase/orderItem/add", data);
};

export const editOrderItem = (data: RawPurchaseItem) => {
  return http.put<ResultData>("/buy/rawPurchase/orderItem/edit", data);
};

export const deleteOrderItem = (id: number) => {
  return http.delete<ResultData>(`/buy/rawPurchase/orderItem/delete/${id}`);
};

export const deleteBatchOrderItem = (ids: number[]) => {
  return http.post<ResultData>("/buy/rawPurchase/orderItem/deleteBatch", ids);
};

export const batchCreateOrderItem = (data: OrderItemBatchPayload) => {
  return http.post<ResultData>("/buy/rawPurchase/orderItem/batch-create", data);
};

export const importOrderItem = (data: FormData) => {
  return http.post<ResultData>("/buy/rawPurchase/orderItem/import", data);
};

export const getOrderItemModel = () => {
  return http.download("/buy/rawPurchase/orderItem/getModel");
};

export const exportOrderItem = (params: RawPurchaseQuery<RawPurchaseItem>) => {
  return http.download("/buy/rawPurchase/orderItem/export", params);
};

export const getOrderItemOptions = () => {
  return http.get<RawPurchaseOption[]>("/buy/rawPurchase/orderItem/options");
};

export const getIncomingPage = (params: RawPurchaseQuery<RawPurchaseIncoming>) => {
  return http.post<RawPurchasePageResult<RawPurchaseIncoming>>("/buy/rawPurchase/incoming/page", params);
};

export const addIncoming = (data: RawPurchaseIncoming) => {
  return http.post<ResultData>("/buy/rawPurchase/incoming/add", data);
};

export const editIncoming = (data: RawPurchaseIncoming) => {
  return http.put<ResultData>("/buy/rawPurchase/incoming/edit", data);
};

export const deleteIncoming = (id: number) => {
  return http.delete<ResultData>(`/buy/rawPurchase/incoming/delete/${id}`);
};

export const deleteBatchIncoming = (ids: number[]) => {
  return http.post<ResultData>("/buy/rawPurchase/incoming/deleteBatch", ids);
};

export const batchCreateIncoming = (data: IncomingBatchPayload) => {
  return http.post<ResultData>("/buy/rawPurchase/incoming/batch-create", data);
};

export const importIncoming = (data: FormData) => {
  return http.post<ResultData>("/buy/rawPurchase/incoming/import", data);
};

export const getIncomingModel = () => {
  return http.download("/buy/rawPurchase/incoming/getModel");
};

export const exportIncoming = (params: RawPurchaseQuery<RawPurchaseIncoming>) => {
  return http.download("/buy/rawPurchase/incoming/export", params);
};
