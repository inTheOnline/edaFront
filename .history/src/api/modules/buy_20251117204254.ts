import request from "@/utils/request";
import { OfficePurchase, OfficePurchaseQuery, OfficePurchasePageResult } from "@/types/officePurchase";

// 分页查询（你后端用的是 POST + PageRequest）
// /officePurchase/getAll
export const getOfficePurchaseList = (params: OfficePurchaseQuery) => {
  return request.post<OfficePurchasePageResult>("/officePurchase/getAll", params);
};

// 新增
export const addOfficePurchase = (data: OfficePurchase) => {
  return request.post("/officePurchase/add", data);
};

// 批量新增
export const addBatchOfficePurchase = (data: OfficePurchase[]) => {
  return request.post("/officePurchase/addBatch", data);
};

// 批量删除
export const deleteBatchOfficePurchase = (ids: number[]) => {
  return request.post("/officePurchase/deleteBatch", ids);
};

// 单个删除
export const deleteOfficePurchase = (id: number) => {
  return request.delete(`/officePurchase/delete/${id}`);
};

// 编辑
export const editOfficePurchase = (data: OfficePurchase) => {
  return request.put("/officePurchase/edit", data);
};
