import http from "@/api";

export interface Supply {
  id: number;
  name: string;
  spec: string;
  unit: string;
  category: string;
  location: string;
  stock: number;
  minimum: number;
}
export interface SupplyLine {
  supplyId?: number;
  quantity: number;
  unitPrice?: number;
  issued?: number;
  received?: number;
}
export interface SupplyRequest {
  lines?: SupplyLine[];
  id: number;
  userId: number;
  purpose: string;
  status: string;
  note?: string;
  createdTime: string;
}
export interface SupplyOrder {
  lines?: SupplyLine[];
  id: number;
  supplier: string;
  buyDate: string;
  remark?: string;
  userId: number;
  status: string;
  createdTime: string;
}
export interface SupplyFlow {
  id: number;
  supplyId: number;
  kind: string;
  quantity: number;
  balance: number;
  requestId?: number;
  orderId?: number;
  recipientId?: number;
  purpose: string;
  userId: number;
  createdTime: string;
}
export interface SupplyPage<T> {
  records: T[];
  total: number;
}
export interface SupplyDetail<T> {
  header: T;
  lines: SupplyLine[];
}
export interface SupplyCommand {
  token: string;
  lines: SupplyLine[];
  purpose?: string;
  requestId?: number;
  orderId?: number;
  recipientId?: number;
  supplier?: string;
  buyDate?: string;
  remark?: string;
}

const base = "/officeSupply";
export const supplyApi = {
  options: () => http.get<Supply[]>(`${base}/options`),
  stock: (params: object) => http.get<SupplyPage<Supply>>(`${base}/stock`, params),
  save: (data: Partial<Supply>) => http.post<number>(`${base}/supply`, data),
  requests: (params: object) => http.get<SupplyPage<SupplyRequest>>(`${base}/requests`, params, { loading: false }),
  request: (id: number) => http.get<SupplyDetail<SupplyRequest>>(`${base}/request/${id}`),
  orders: (params: object) => http.get<SupplyPage<SupplyOrder>>(`${base}/orders`, params),
  order: (id: number) => http.get<SupplyDetail<SupplyOrder>>(`${base}/order/${id}`),
  editOrder: (id: number, data: SupplyCommand) => http.post(`${base}/order/${id}/edit`, data),
  deleteOrder: (id: number) => http.post(`${base}/order/${id}/delete`),
  flows: (params: object) => http.get<SupplyPage<SupplyFlow>>(`${base}/flows`, params),
  todo: () => http.get<number>(`${base}/todo`, {}, { loading: false }),
  submit: (kind: "request" | "order" | "issue" | "receipt", data: SupplyCommand) => http.post(`${base}/${kind}`, data),
  ready: (id: number) => http.post(`${base}/request/${id}/ready`, { note: "已线下通知领取" }),
  cancel: (id: number, note: string) => http.post(`${base}/request/${id}/cancel`, { note }),
};
