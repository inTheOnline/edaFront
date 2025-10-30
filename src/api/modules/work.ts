import http from "@/api";
import { Work } from "@/api/interface/work";
import { ReqPage } from "@/api/interface/index";
export const getAllWork = (params: ReqPage) => {
  return http.get<Work[]>("/work/getAll", params);
}
export const addWork = (work: Work ) => {
  return http.post<any>("/work/add", work);
}
export const delectWorks = (ids: number[] ) => {
  return http.post<any>("/work/removes", ids);
}
