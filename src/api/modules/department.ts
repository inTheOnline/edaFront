import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getDepartmentApi = ()=>{
  return http.get<ResultData>("/department/getMap");
}
