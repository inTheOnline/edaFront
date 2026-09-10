import http from "@/api";
import type { ReqPage } from "@/api/interface";

export type AssistMaterType = "pvc" | "box" | "spacer" | "nut";

export interface AssistMater {
  id?: number;
  type: AssistMaterType;
  code: string;
  name?: string;
  spec?: string;
  gridNumber?: number;
  remark?: string;
}

export const getAssistMaterPage = (type: AssistMaterType, params: ReqPage) => http.post(`/assistMater/${type}/page`, params);

export const saveAssistMater = (data: AssistMater) => http.post("/assistMater/save", data);

export const deleteAssistMater = (id: number) => http.delete(`/assistMater/delete/${id}`);
