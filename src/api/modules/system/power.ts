import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getPowerTree = () => {
  return http.get<ResultData>("/power/tree");
}