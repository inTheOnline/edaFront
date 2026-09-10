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
export const getWorkDetails = (workId?: number) => http.get<any[]>("/work/detail", { workId });
export const saveWorkDetail = (data: any) => http.post<number>("/work/detail", data);
export const deleteWorkDetail = (id: number) => http.delete<any>(`/work/detail/${id}`);
