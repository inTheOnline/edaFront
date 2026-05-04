import http from "@/api";
import { ResultData } from "@/api/interface/index";
import {
  OfficePurchase,
  OfficePurchaseQuery,
  OfficePurchasePageResult,
  OfficePurchaseRecord,
  PurchaseTodoResult
} from "@/api/interface/buy/officePurchase";

// 请购分页查询
export const getPurchaseList = (params: OfficePurchaseQuery) => {
  return http.post<OfficePurchasePageResult>("/officePurchase/getAll", params);
};

// 新增请购
export const addPurchase = (data: OfficePurchase) => {
  return http.post<ResultData>("/officePurchase/add", data);
};

// 批量新增请购
export const addBatchPurchase = (data: OfficePurchase[]) => {
  return http.post<ResultData>("/officePurchase/addBatch", data);
};

// 批量删除请购
export const deleteBatchPurchase = (ids: number[]) => {
  return http.post<ResultData>("/officePurchase/deleteBatch", ids);
};

// 删除单条请购
export const deletePurchase = (id: number) => {
  return http.delete<ResultData>(`/officePurchase/delete/${id}`);
};

// 编辑请购
export const updatePurchase = (data: OfficePurchase) => {
  return http.put<ResultData>("/officePurchase/edit", data);
};

// 审核通过
export const passPurchase = (id: number) => {
  return http.post<ResultData>("/officePurchase/audit/pass", { id });
};

// 审核驳回
export const rejectPurchase = (id: number, rejectReason?: string) => {
  return http.post<ResultData>("/officePurchase/audit/reject", { id, rejectReason });
};

// 取消请购
export const cancelPurchase = (id: number) => {
  return http.post<ResultData>("/officePurchase/cancel", { id });
};

// 领取完成
export const receivePurchase = (id: number) => {
  return http.post<ResultData>("/officePurchase/receive", { id });
};

// 新增采购记录（单条）
export const addPurchaseRecord = (data: OfficePurchaseRecord) => {
  return http.post<ResultData>("/officePurchaseRecord/add", data);
};

// 批量采购录入（一次提交多条请购）
export const addBatchPurchaseRecordByPurchaseIds = (payload: {
  purchaseIds: number[];
  record: Omit<OfficePurchaseRecord, "officePurchaseId">;
}) => {
  return http.post<ResultData>("/officePurchaseRecord/addBatchByPurchaseIds", payload);
};

// 查询某条请购的采购明细
export const getPurchaseRecordListByPurchaseId = (purchaseId: number) => {
  return http.get<OfficePurchaseRecord[]>("/officePurchaseRecord/listByPurchaseId", { purchaseId });
};

// 获取采购待办
export const getPurchaseTodo = () => {
  return http.get<PurchaseTodoResult>("/officePurchase/todo");
};
