import http from "@/api";
import { ReqPage, ResultData } from "@/api/interface/index";
import { Production, ProductionMap } from "@/api/interface/production"; // 需创建对应的接口类型定义

/**
 * 获取生产记录列表（分页）
 * @param params 分页查询参数
 * @returns 生产记录列表及总数
 */
export const getProductionAll = (params: ReqPage) => {
  return http.post<ResultData<Production[]>>("/production/getAll", params);
};

/**
 * 新增生产记录
 * @param production 生产记录数据
 * @returns 操作结果
 */
export const addProduction = (production: Production) => {
  return http.post<any>("/production/add", production);
};

/**
 * 编辑生产记录
 * @param production 生产记录数据（含id）
 * @returns 操作结果
 */
export const editProduction = (production: Production) => {
  return http.put<any>("/production/edit", production);
};

/**
 * 删除单个生产记录
 * @param id 生产记录id
 * @returns 操作结果
 */
export const deleteProduction = (id: number) => {
  return http.delete<any>(`/production/delete/${id}`);
};

/**
 * 批量删除生产记录
 * @param ids 生产记录id数组
 * @returns 操作结果
 */
export const deleteManyProduction = (ids: number[]) => {
  return http.post<any>("/production/deleteBatch", ids);
};

/**
 * 获取生产记录导出模板/数据
 * @param params 筛选参数（可选）
 * @returns 模板文件流或导出数据
 */
export const getProductionModel = (params?: any) => {
  return http.get<any>("/production/exportModel", params, {
    responseType: "blob", // 导出文件需指定响应类型
  });
};

/**
 * 批量导入生产记录
 * @param data 导入数据（通常为FormData）
 * @returns 导入结果
 */
export const addManyProduction = (data: FormData) => {
  return http.post<any>("/production/importBatch", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * 批量添加生产记录
 * @param data 导入数据
 * @returns 导入结果
 */
export const addBatchApi = (data: any) => {
  return http.post<any>("/production/addBatch", data, {});
};

export const addOrder = (order:Order) => {
  return http.post<any>(`/order/addOrder`, order);
};

/**
 * 获取生产记录字典映射（用于下拉选择）
 * @returns 生产记录的id-label映射列表
 */
export const getProductionMap = () => {
  return http.get<ProductionMap[]>("/production/getIdMap", {});
};
