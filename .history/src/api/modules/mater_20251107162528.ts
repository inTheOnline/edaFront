import http from "@/api";
import mapDate from "@/api";
import { ReqPageT,ResultData,ResPage } from "@/api/interface/index";
//params分页请求参数
export const getAll = (params: ReqPageT<any>) => {
  return http.post<any>(`/mater/getAll`, params);
};
export const getMap = () => {
  return http.get<ResultData>(`/mater/getMap`);
};
export const getMapNum = () => {
  return http.get<ResultData>(`/mater/getMap`);
};
export const getModel = () => {
  return http.post<any>(`/mater/getModel`);
};
export const addMany = (file) => {
  return http.post<any>(`/mater/addMany`, file);
};
export const deleteMany = (ids: number[]) => {
  return http.post<any>(`/mater/deleteMany`,ids);
};
export const addMater = (mater) => {
  return http.post<any>(`/mater/add`, mater);
};
export const getOrderMater = (params: ReqPageT<any>) => {
  return http.post<any>(`/mater/getOrderMater`, params);
};
export const getAboutById = (id:number) => {
  return http.get<any>(`/mater/getOutById`,{id});
};
export const editMater = (row:any) => {
  return http.post<any>(`/mater/editMater`,row );
};
export const delect =(id:number) => {
  return http.delete<any>(`/mater/remove/`+id);
}