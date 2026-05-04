import http from "@/api";
import { ReqPage,ResultData,ResPage } from "@/api/interface/index";
import { c } from "naive-ui";
export const getFlow = (params: ReqPage) => {
  return http.post<ResPage<any>>("/godown/getFlow", params);
}
export const deleteFlowBatch = (params: number[]) => {
  return http.post<ResPage<any>>("/godown/deleteFlowBatch", params);
}

export const addFlow = (params: ReqPage) => {
  return http.post<ResPage<any>>("/godown/addFlow", params);
}
export const addFlowBatchApi = (params: any) => {
  return http.post<ResPage<any>>("/godown/addFlowBatch", params);
}
export const editFlow = (params: ReqPage) => {
  return http.put<ResPage<any>>("/godown/editFlow", params);
}
export const deleteFlow = (params: number) => {
  return http.delete<ResPage<any>>(`/godown/deleteFlow/${params}`);
}
export const getTotal = (params: ReqPage) => {
  return http.post<ResPage<any>>("/godown/getTotal", params);
}