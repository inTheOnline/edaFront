import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
import { List } from "echarts";

export const getAll = (params: ReqPage) => {
  return http.post<ResultData<any>>("/supWork/getAll", params);
}
export const getModel = () => {
  return http.download("/supWork/getModel");
}
export const addMany = (params: ReqPage) => {
  return http.post<ResultData<any>>("/supWork/addMany", params);
}
export const deleteMany = (ids: number[]) => {
  return http.post<ResultData<any>>("/supWork/deleteMany", ids);
}
export const add = (params: ReqPage) => {
  return http.post<ResultData<any>>("/supWork/add", params);
}
export const edit = (params: ReqPage) => {
  return http.post<ResultData<any>>("/supWork/alter", params);
}
export const deleteById = (id:number) =>{
  return http.delete("supWork/delete/"+id)
}