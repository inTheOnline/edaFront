/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-04-10 22:08:43
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-04-19 15:47:51
 * @FilePath: \Geeker-Admin\src\api\modules\outback.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import http from "@/api";
import { supMap,Sup } from "@/api/interface/sup";
import { OutformData, Custs, SubcState } from "@/api/interface/outgoing";
import { ReqPage } from "@/api/interface/index";
//获取整个列表的接口请求
export const outFormApi = (params: ReqPage) => {
  return http.get<OutformData[]>(`/outgoing/outback/all`, params);
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
  return http.get<SubcState[]>("/outgoing/getSubc_state", {});
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
//删除送货单的接口请求
export const deleteList = (ids: number[]) => {
  return http.post<any>(`/outgoing/deleteList`, ids);
};
