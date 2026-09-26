import http from "@/api";

export interface TrendPoint {
  date: string;
  issueCount: number;
  receiptCount: number;
}

export interface SupplierRank {
  supId: number;
  supName: string;
  pendingQty: number;
}

export interface HomeSummary {
  month: string;
  monthIssueQty: number;
  monthReceiptQty: number;
  pendingQty: number;
  supplierCount: number;
  supplierRank: SupplierRank[];
}

export interface TrendQuery {
  supId: number;
  materId: number;
  startDate: string;
  endDate: string;
  grain: "month" | "day";
}

export const getHomeSummary = () => http.get<HomeSummary>("/outgoing/home/summary");
export const getHomeTrend = (query: TrendQuery) => http.post<TrendPoint[]>("/outgoing/home/trend", query);

export interface HomeOption {
  value: number;
  label: string;
  num?: string;
}

export type OptionsQuery = Omit<TrendQuery, "supId" | "materId"> & Partial<Pick<TrendQuery, "supId" | "materId">>;
export const getHomeOptions = (query: OptionsQuery) =>
  http.post<{ suppliers: HomeOption[]; materials: HomeOption[] }>("/outgoing/home/options", query);
