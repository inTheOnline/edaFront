import http from "@/api";
import { ReqPageT, ResultData, ResPage } from "@/api/interface/index";
import { EchartsOption } from "@/api/interface/option";

// 订单模块图表数据
export const getBusiness = () => {
  return http.get<EchartsOption>(`/echarts/business`, {});
};

// 仓库模块图表数据
export const getGodownStats = () => {
  return http.get<EchartsOption>(`/echarts/godown`, {});
};
