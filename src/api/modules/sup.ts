import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getAllSup = (params: ReqPage) => {
  return http.post<any>("/sup/getAll", params);
}
export const addSup = (sup: any ) => {
  return http.post<any>("/sup/add", sup);
}
export const delectSups = (ids: number[] ) => {
  return http.post<any>("/sup/delectList", ids);
}
export const alterSup = (sup: any ) => {
    return http.post<any>("/sup/alter", sup);
  }
export const getIdMap = () => {
  return http.get<any>("/sup/getMap",{ });
}
