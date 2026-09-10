import http from "@/api";
import { ReqPage, ResultData } from "@/api/interface/index";

export interface PriceHistoryRecord {
  id: number;
  materId: number;
  materNum: string;
  materName: string;
  oldPrice: number | null;
  price: number;
  diffPrice: number | null;
  changeRate: number | null;
  batchName: string;
  effectiveDate: string;
  changeReason: string;
  changeBy: string;
  createTime: string;
}

export const getAll = (params: ReqPage & Partial<PriceHistoryRecord>) => {
  return http.post<ResultData>("/priceHistory/getAll", params);
};
