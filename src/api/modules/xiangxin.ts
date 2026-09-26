import http from "@/api";

export interface XiangxinBatch {
  id: string;
  carton: string;
  cartonStatus: number;
  grns: string[];
  state: "ready" | "running" | "done" | "failed";
  removed: string[];
  message: string;
  remaining: string[] | null;
}

const options = { loading: false, cancel: false, timeout: 120000 };
export const previewXiangxin = (params: { account: string; password: string; carton: string }) =>
  http.post<XiangxinBatch>("/xiangxin/preview", params, options);
export const startXiangxin = (id: string) => http.post<XiangxinBatch>("/xiangxin/start", { id }, options);
export const progressXiangxin = (id: string) => http.get<XiangxinBatch>("/xiangxin/progress", { id }, options);
