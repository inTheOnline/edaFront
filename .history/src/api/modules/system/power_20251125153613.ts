import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getpowerTree = (params: ReqPage) => {
  return http.get<User[]>("/user/select/all", params);
}