import http from "@/api";
import type { OutbackRecord } from "../service";

export interface ExceptionFlow {
  docId: number; lineId: number; docNo: string; quantity: number; bizDate: string;
  flowName: string; relatedPerson?: string; remark?: string;
}
export interface ExceptionOptions {
  item: OutbackRecord;
  incoming: ExceptionFlow[];
  picking: ExceptionFlow[];
  boundInDocId?: number;
  boundPickDocId?: number;
}
export interface ExceptionRow {
  itemId: number; kind: "SHORT" | "MIX"; foundDate: string;
  quantity?: number; expectedNumber: number; mixedMaterId?: number; mixedNumber?: number;
  inDocId?: number; pickDocId?: number; photos: string[]; remark: string;
}
export interface ExceptionHistory {
  id: number; itemId: number; addedItemId?: number; kind: string; foundDate: string;
  quantity: number; beforeNumber: number; afterNumber: number;
  mixedMaterId?: number; mixedNumber?: number; photosJson: string; remark?: string;
}
const base = "/outgoing/outback/exception";
export const exceptionOptions = (id: number) => http.get<ExceptionOptions>(`${base}/options/${id}`);
export const exceptionHistory = (id: number) => http.get<ExceptionHistory[]>(`${base}/history/${id}`);
export const saveException = (requestId: string, rows: ExceptionRow[]) => http.post(base, { requestId, rows });
export const uploadEvidence = (id: number, file: File) => {
  const data = new FormData();
  data.append("file", file);
  return http.post<string>(`${base}/photo/${id}`, data, { loading: false, cancel: false });
};
export const evidencePhoto = (id: number, path: string) => http.download(`${base}/photo/${id}/preview`, { path }, { loading: false });
