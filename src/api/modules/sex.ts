import http from "@/api";
import { ReqPage,ResultData } from "@/api/interface/index";
export const getSex = ()=>{
  return http.get<ResultData>("/sex/getMap");
}
