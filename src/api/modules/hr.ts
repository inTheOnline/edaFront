import http from "@/api";
import { ReqPage,ResultData,ResPage } from "@/api/interface/index";
import { Staff } from "@/api/interface/hr";
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
  return http.post<any>("/file/kaoqin ", params);
}
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
