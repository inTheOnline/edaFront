import http from "@/api";
import { ReqPageT,ResultData,ResPage } from "@/api/interface/index";
import { Order } from "@/api/interface/order";
export const getModel = () => {
  return http.download(`/orderOut/getModel`,{});
};
export const addMany = (file) => {
  return http.post<any>(`/orderOut/addMany`, file);
};
export const deleteMany = (ids: number[]) => {
  return http.post<any>(`/orderOut/deleteMany`,ids);
};
export const addOrderOut = (order:Order) => {
  return http.post<any>(`/orderOut/addOrder`, order);
};
//params分页请求参数
export const getOrderOut = (params: ReqPageT<any>) => {
  return http.post<any>(`/orderOut/all`, params);
};