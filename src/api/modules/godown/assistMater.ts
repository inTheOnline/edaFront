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

export interface PvcRelation {
  enabled?: number;
  id?: number;
  materId?: number;
  assistId?: number;
  materQty?: number;
  assistQty?: number;
  remark?: string;
}
export const getPvcRelations = () => http.get<{ relations: PvcRelation[]; assists: AssistMater[] }>("/assistMater/pvc/relations");
export const savePvcRelation = (data: PvcRelation) => http.post("/assistMater/pvc/relation/save", data);
export const deletePvcRelation = (id: number) => http.delete(`/assistMater/pvc/relation/${id}`);
export const setPvcRelationEnabled = (id: number, enabled: boolean) =>
  http.put(`/assistMater/pvc/relation/${id}/enabled`, {}, { params: { enabled } });
