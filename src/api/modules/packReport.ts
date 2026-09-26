import http from "@/api";

export interface PackItem {
  id?: number;
  materId?: number | null;
  materNum?: string;
  materName?: string;
  process: string;
  processDetail?: string | null;
  qty?: number | null;
  defect?: number | null;
  scrap?: number | null;
  remark?: string;
}
export interface PackReport {
  id?: number;
  revision?: number;
  date: string;
  operatorId?: number;
  operatorName?: string;
  hours?: number;
  items: PackItem[];
}
export interface PackProcess {
  label: string;
  details: string[];
  keywords: string;
}
export const getPackReports = (params: Record<string, unknown>) =>
  http.post<{ records: PackReport[]; total: number }>("/packReport/getAll", params);
export const getPackReport = (id: number) => http.get<PackReport>(`/packReport/${id}`);
export const getPackProcesses = () => http.get<PackProcess[]>("/packReport/processes");
export const addPackReport = (data: PackReport) => http.post<number>("/packReport/add", data);
export const editPackReport = (data: PackReport) => http.put<number>("/packReport/edit", data);
export const deletePackReports = (ids: number[]) => http.post("/packReport/deleteBatch", ids);
