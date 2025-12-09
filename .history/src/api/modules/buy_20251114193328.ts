import http from "@/api";
import { Cust,CustMap } from "@/api/interface/cust";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getPurchaseList = (params: ReqPage) => {
  return http.get<Cust[]>("/cust/getAll", params);
}
export const addCust = (cust: Cust ) => {
  return http.post<any>("/cust/add", cust);
}
export const delectCusts = (ids: number[] ) => {
  return http.post<any>("/cust/delectList", ids);
}
export const getIdMap = () => {
  return http.get<CustMap[]>("/cust/getIdMap",{ });
}
