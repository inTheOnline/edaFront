import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
import { OfficePurchase, OfficePurchaseQuery, OfficePurchasePageResult } from "@/api/interface/buy/officePurchase";

// 分页查询（你后端用的是 POST + PageRequest）
// /officePurchase/getAll
export const getPurchaseList = (params: OfficePurchaseQuery) => {
  return http.post<OfficePurchasePageResult>("/officePurchase/getAll", params);
};

// 新增
export const addPurchase = (data: OfficePurchase) => {
  return http.post<ResultData>("/officePurchase/add", data);
};

// 批量新增
export const addBatchPurchase = (data: OfficePurchase[]) => {
  return http.post<ResultData>("/officePurchase/addBatch", data);
};

// 批量删除
export const deleteBatchOfficePurchase = (ids: number[]) => {
  return http.post<ResultData>("/officePurchase/deleteBatch", ids);
};

// 单个删除
export const deleteOfficePurchase = (id: number) => {
  return http.delete<ResultData>(`/officePurchase/delete/${id}`);
};

// 编辑
export const updatePurchase = (data: OfficePurchase) => {
  return http.put<ResultData>("/officePurchase/edit", data);
};

