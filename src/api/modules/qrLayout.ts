import http from "@/api";
import type {
  QrLayoutTemplateCopyParams,
  QrLayoutTemplateCreateParams,
  QrLayoutTemplateListParams,
  QrLayoutTemplatePage,
  QrLayoutTemplateRecord,
  QrLayoutTemplateUpdateParams
} from "@/api/interface/qrLayout";

export const getQrLayoutTemplateList = (params: QrLayoutTemplateListParams = {}) => {
  return http.get<QrLayoutTemplatePage>("/qr-layout-template/list", params);
};

export const getQrLayoutTemplateDetail = (id: number) => {
  return http.get<QrLayoutTemplateRecord>(`/qr-layout-template/detail/${id}`);
};

export const createQrLayoutTemplate = (params: QrLayoutTemplateCreateParams) => {
  return http.post<{ id: number }>("/qr-layout-template/create", params);
};

export const updateQrLayoutTemplate = (id: number, params: QrLayoutTemplateUpdateParams) => {
  return http.put<any>(`/qr-layout-template/update/${id}`, params);
};

export const deleteQrLayoutTemplate = (id: number) => {
  return http.delete<any>(`/qr-layout-template/delete/${id}`);
};

export const publishQrLayoutTemplate = (id: number) => {
  return http.post<any>(`/qr-layout-template/publish/${id}`);
};

export const unpublishQrLayoutTemplate = (id: number) => {
  return http.post<any>(`/qr-layout-template/unpublish/${id}`);
};

export const copyQrLayoutTemplate = (id: number, params: QrLayoutTemplateCopyParams) => {
  return http.post<{ id: number }>(`/qr-layout-template/copy/${id}`, params);
};
