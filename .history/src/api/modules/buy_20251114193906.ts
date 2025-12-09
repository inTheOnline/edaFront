import http from "@/api";
import { Cust,CustMap } from "@/api/interface/cust";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getPurchaseList = (params: ReqPage) => {
  return http.get<Cust[]>("/cust/getAll", params);
}
export const deletePurchase = (cust: Cust ) => {
  return http.post<any>("/cust/add", cust);
}
export const deleteManyPurchase = (ids: number[] ) => {
  return http.post<any>("/cust/delectList", ids);
}
export const getIaddPurchasedMap = () => {
  return http.get<CustMap[]>("/cust/getIdMap",{ });
}
