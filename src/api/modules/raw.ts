import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";

export const getAll = (params: ReqPage) => {
  return http.post<ResultData<any>>("/raw/getAll", params);
}
export const getModel = () => {
  return http.download("/raw/getModel");
}
export const addMany = (params: ReqPage) => {
  return http.get<ResultData<any>>("/raw/addMany", params);
}
export const deleteMany = (params: ReqPage) => {
  return http.get<ResultData<any>>("/raw/removes", params);
}
export const add = (params: ReqPage) => {
  return http.get<ResultData<any>>("/raw/add", params);
}
export const edit = (params: ReqPage) => {
  return http.post<ResultData<any>>("/raw/alter", params);
}

//table
export const getTableModel = () =>{
  return http.download("/raw/table/getTableModel");
}
export const getTable = (params: ReqPage) =>{
  return http.post<ResultData<any>>("/raw/table/getTable", params);
}