import http from "@/api";
import { ReqPage,ResultData,ResPage } from "@/api/interface/index";
import type { Salary, SalaryChangeLog, SalaryEditRequest, SalaryNorm, SalaryPageParams, Staff, StaffAttachment } from "@/api/interface/hr";
export const getAll = (params: ReqPage) => {
  return http.get<ResPage<Staff>>("/hr/staff/all", params);
}
export const addStaff = (staff: Staff ) => {
  return http.post<any>("/hr/staff/add", staff);
}
export const deleteMany = (ids: number[] ) => {
  return http.post<any>("/hr/staff/deleteMany", ids);
}
export const deleteStaff = (id: number ) => {
  return http.delete<any>("/hr/staff/deleteStaff",{id});
}
export const getIdMap = () => {
  return http.get<any>("/hr/getIdMap",{ });
}
export const addManyStaff = (params: FormData ) => {
  return http.post<any>("/hr/staff/addMany ", params);
}
export const getModel = () => {
  return http.download("/hr/staff/getModel", {});
}
export const getExcel = () => {
  return http.download("/hr/staff/getExcel", {});
}
export const addManyCheck = (params: FormData ) => {
  return http.post<any>("/file/kaoqin", params);
}//修改了
export const getCheckModel = (num: string) => {
  return http.download("/hr/check/getModel", {});
}
export const editStaff = (data:any) => {
  return http.post("/hr/staff/edit",data)
}
export const getDateDetails = (year:number,month:number) :ResultData =>{
  return http.get("/hr/check/getDateDetails",{year,month});
}
export const getMonths = () =>{
  return http.get("/hr/check/getMonths",{});
}
export const getChecksysMap = () =>{
  return http.get("/hr/checksys/getMap",{})
}
export const getDepartNumber = () =>{
  return http.get("/hr/staff/depart",{})
}
export const getAgeNumber = () =>{
  return http.get("/hr/staff/age",{})
}
export const getNumber = () =>{
  return http.get("/hr/staff/number",{})
}
export const getStaffAttachments = (staffId: number) => {
  return http.get<StaffAttachment[]>(`/hr/staff/${staffId}/attachments`, {});
}
export const uploadStaffAttachment = (staffId: number, params: FormData) => {
  return http.post<StaffAttachment>(`/hr/staff/${staffId}/attachments`, params, { cancel: false });
}
export const deleteStaffAttachment = (id: number) => {
  return http.delete<any>(`/hr/staff/attachments/${id}`, {});
}
export const downloadStaffAttachment = (id: number) => {
  return http.service.get<Blob, Blob>(`/hr/staff/attachments/${id}/download`, {
    responseType: "blob",
    loading: false
  } as any);
}
export const getSalaryNormPage = (params: ReqPage & Partial<SalaryNorm>) => http.post<ResPage<SalaryNorm>>("/hr/salaryNorm/page", params);
export const getSalaryNorm = (id: number) => http.get<SalaryNorm>("/hr/salaryNorm/get", { id });
export const getSalaryNormByStaff = (staffId: number) => http.get<SalaryNorm>("/hr/salaryNorm/getByStaff", { staffId });
export const addSalaryNorm = (data: SalaryNorm) => http.post("/hr/salaryNorm/add", data);
export const editSalaryNorm = (data: SalaryNorm) => http.post("/hr/salaryNorm/edit", data);
export const deleteSalaryNorm = (id: number) => http.delete("/hr/salaryNorm/delete", { id });
export const getSalaryPage = (params: SalaryPageParams) => http.post<ResPage<Salary>>("/hr/salary/page", params);
export const calculateSalary = (params: FormData) => http.download("/hr/salary/calculate", params, { cancel: false });
export const getSalary = (id: number) => http.get<Salary>("/hr/salary/get", { id });
export const editSalary = (data: SalaryEditRequest) => http.post("/hr/salary/edit", data);
export const deleteSalary = (id: number) => http.delete("/hr/salary/delete", { id });
export const deleteSalaryMany = (ids: number[]) => http.post("/hr/salary/deleteMany", ids);
export const getSalaryLogPage = (params: SalaryPageParams) => http.post<ResPage<SalaryChangeLog>>("/hr/salary/log/page", params);
export const getSalaryLogList = (salaryId: number) => http.get<SalaryChangeLog[]>("/hr/salary/log/list", { salaryId });
