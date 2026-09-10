import http from "@/api";

export type DocKind = "requisition" | "purchase" | "receipt";
export interface PageData<T> {
  records: T[];
  total: number;
}
export interface RawItem {
  id?: number;
  tableId?: number;
  rawId?: number;
  rawNum?: string;
  rawSpecs?: string;
  materId?: number;
  materNum?: string;
  materName?: string;
  relationId?: number;
  useType?: "sheet" | "roll";
  sheetOutputNumber?: number;
  rollUnitWeight?: number;
  requisitionItemId?: number;
  purchaseItemId?: number;
  productionNumber?: number;
  requisitionNumber?: number;
  requisitionWeight?: number;
  notPurchaseWeight?: number;
  purchaseNumber?: number;
  purchaseWeight?: number;
  incomingProductionNumber?: number;
  notbackProductionNumber?: number;
  incomingWeight?: number;
  notbackWeight?: number;
  receiptNumber?: number;
  receiptWeight?: number;
  unitPrice?: number;
  incomingNumber?: number;
  notbackNumber?: number;
  supName?: string;
  status?: string;
  remark?: string;
}
export interface RawTable {
  id?: number;
  requisitionNum?: string;
  requisitionDate?: string;
  applyUserId?: number;
  purchaseNum?: string;
  purchaseDate?: string;
  receiptNum?: string;
  receiptDate?: string;
  purchaseTableId?: number;
  purchaseTableIds?: number[];
  supId?: number;
  supName?: string;
  supplierAddress?: string;
  supplierContactName?: string;
  supplierContactPhone?: string;
  status?: string;
  totalAmount?: number;
  remark?: string;
  items?: RawItem[];
}

export const tablePage = (kind: DocKind, params: any) => http.post<PageData<RawTable>>(`/buy/raw/${kind}/table/page`, params);
export const itemPage = (kind: DocKind, params: any) => http.post<PageData<RawItem>>(`/buy/raw/${kind}/item/page`, params);
export const getDocument = (kind: DocKind, id: number) => http.get<RawTable>(`/buy/raw/${kind}/${id}`, {});
export const saveDocument = (kind: DocKind, data: RawTable) =>
  data.id ? http.put<RawTable>(`/buy/raw/${kind}`, data) : http.post<RawTable>(`/buy/raw/${kind}`, data);
export const deleteDocument = (kind: DocKind, id: number) => http.delete(`/buy/raw/${kind}/${id}`);
export const getRawOptions = () => http.get<any[]>("/buy/raw/mater/options", {});
export const getSupplierOptions = () => http.get<any[]>("/buy/raw/supplier/options", {});

export const unwrap = async <T>(promise: Promise<any>): Promise<T> => {
  const response = await promise;
  return (response?.data?.data ?? response?.data ?? response) as T;
};
