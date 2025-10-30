import http from "@/api";
import { ReqPageT,ResultData,ResPage } from "@/api/interface/index";
import { Order } from "@/api/interface/order";
//params分页请求参数
export const getOrderAll = (params: ReqPageT<any>) => {
  return http.post<any>(`/order/all`, params);
};
export const getModel = () => {
  return http.download(`/order/getModel`,{});
};
export const addManyOrder = (file) => {
  return http.post<any>(`/order/addManyOrder`, file);
};
export const delect = (ids: number[]) => {
  return http.post<any>(`/order/deleteMater`,ids);
};
export const deleteMany = (ids: number[]) => {
  return http.post<any>(`/order/deleteMany`,ids);
};
export const addOrder = (order:Order) => {
  return http.post<any>(`/order/addOrder`, order);
};
export const getOrderMater = (params: ReqPageT<any>) => {
  return http.post<any>(`/order/getOrderMater`, params);
};
export const getAboutById = (id:number) => {
  return http.get<any>(`/order/getOutById`,{id});
};
export const editOrder = (order:Order) => {
  return http.post<any>(`/order/editOrder`, order);
};
export const reset = () => {
  return http.get<any>(`/order/reset`);
};