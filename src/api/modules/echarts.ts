import http from "@/api";
import { ReqPageT,ResultData,ResPage } from "@/api/interface/index";
import {EchartsOption} from "@/api/interface/option"
export const getBusiness = () => {
  return http.get<EchartsOption>(`/echarts/business`,{});
};