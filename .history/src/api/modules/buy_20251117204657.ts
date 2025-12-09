import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";

import { OfficePurchase, OfficePurchaseQuery, OfficePurchasePageResult } from "@/api/interface/buy/officePurchase";

// 分页查询（你后端用的是 POST + PageRequest）
// /officePurchase/getAll
export const getOfficePurchaseList = (params: OfficePurchaseQuery) => {
  return http.post<OfficePurchasePageResult>("/officePurchase/getAll", params);
};

// 新增
export const addOfficePurchase = (data: OfficePurchase) => {
  return http.post("/officePurchase/add", data);
};

// 批量新增
export const addBatchOfficePurchase = (data: OfficePurchase[]) => {
  return http.post("/officePurchase/addBatch", data);
};

// 批量删除
export const deleteBatchOfficePurchase = (ids: number[]) => {
  return http.post("/officePurchase/deleteBatch", ids);
};

// 单个删除
export const deleteOfficePurchase = (id: number) => {
  return http.delete(`/officePurchase/delete/${id}`);
};

// 编辑
export const editOfficePurchase = (data: OfficePurchase) => {
  return http.put("/officePurchase/edit", data);
};

