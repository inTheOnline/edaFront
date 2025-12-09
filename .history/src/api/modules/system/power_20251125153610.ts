import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
export const powerTree = (params: ReqPage) => {
  return http.get<User[]>("/user/select/all", params);
}