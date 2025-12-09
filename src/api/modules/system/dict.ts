import http from "@/api";
import { ReqPageT,ResultData,ResPage } from "@/api/interface/index";
export const getDictData = (type :string) => {
  return http.get<any>(`/info/dict/${type}`, {type},{ loading: true });
};