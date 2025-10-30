import http from "@/api";
import { supMap,Sup } from "@/api/interface/sup";
import { OutformData, Custs, State } from "@/api/interface/outgoing";
import { ReqPage } from "@/api/interface/index";
export const outFormApi = (params: ReqPage) => {
  return http.get<OutformData[]>(`/outgoing/outform/all`, params);
};
//获得客户详细信息的接口请求
export const custDetailApi = () => {
  return http.get<Custs[]>("/web/getCust_detail", {});
};
//获得供应商和其从属的送货单的接口请求
export const supTreeApi = () => {
  return http.get<Sup[]>("/web/getSup_detail", {});
};
// export const getProductOptionApi = () => {
//   return http.get<Array<Custs>("/web/getCust_detail", {});
// };
//状态的接口请求
export const getStateApi = () => {
  return http.get<State[]>("/outgoing/getSubc_state", {});
};
//获取供应商id和名称的映射接口请求
export const getSupMapApi = () => {
  return http.get<supMap[]>("/sup/getMap", {});
};
//新增送货单的接口请求
export const addOutform = (data: OutformData) => {
  return http.post<OutformData[]>("/outgoing/addOutform", data);
};
//更新送货单的接口请求
export const updateList = (data: OutformData) => {
  return http.post<OutformData[]>("/outgoing/updateList", data);
}
export const edit = (data)=>{
  return http.post("/outgoing/outform/edit",data)
}
//删除送货单的接口请求
export const deleteList = (ids: number[]) => {
  return http.post<any>(`/outgoing/deleteList`, ids);
};
//上传供应商扣款
export const getDeductions = (file) => {
  return http.download(`/outgoing/getDeductions`, file);
};
// //下载供应商扣款模版
// export const getModel = () => {
//   return http.download(`/outgoing/getModel`, {});
// };
export const getModel = () => {
  return http.download("/outgoing/getModel", {});
}
//上传供应商报价
export const supWorkAddAPI = (file) =>{
  return http.post(`/sup/supPrice`, file);
}
//上传供应商扣款
export const getSupWorkAddModel = () => {
  return http.download(`/outgoing/getModel`, {});
};
export const getMessage = () => {
  return http.post(`/outgoing/getMessage`, {});
};
