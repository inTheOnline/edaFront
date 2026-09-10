export type RawPurchaseStatus = "待采购" | "部分采购" | "已采购" | "已取消";

export interface RawPurchaseOption {
  label: string;
  value: string | number;
  [key: string]: any;
}

export type RawUseType = "sheet" | "roll";

export interface RawMaterOption {
  relationId: number | string;
  useType: RawUseType;
  materId: number | string;
  materNum?: string;
  materName?: string;
  rawId: number | string;
  rawNum: string;
  rawSpecs: string;
  sheetOutputNumber?: number;
  rollUnitWeight?: number;
  grossWeight?: number;
  sheetWeight?: number;
  label?: string;
  value?: string;
}

export interface RawMaterRelation {
  id?: number;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  sheetRawId?: number | string;
  sheetRawNum?: string;
  sheetRawSpecs?: string;
  sheetOutputNumber?: number;
  rollRawId?: number | string;
  rollRawNum?: string;
  rollRawSpecs?: string;
  rollUnitWeight?: number;
  grossWeight?: number;
  sheetWeight?: number;
  utilBadWeight?: number;
  remark?: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface RawPurchasePageResult<T> {
  records: T[];
  total: number;
  size?: number;
  current?: number;
  pages?: number;
}

export interface RawPurchaseRequisition {
  id?: number;
  requisitionDate: string;
  applyUserId?: number | string;
  custOrderId?: number | string;
  custOrderNum?: string;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  rawId?: number | string;
  rawNum: string;
  rawSpecs: string;
  relationId?: number | string;
  useType?: RawUseType;
  sheetOutputNumber?: number;
  rollUnitWeight?: number;
  requisitionNumber?: number | null;
  requisitionWeight?: number | null;
  purchasedNumber?: number;
  purchasedWeight?: number;
  notPurchaseNumber?: number;
  status?: RawPurchaseStatus;
  remark?: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface RawPurchaseItem {
  id?: number;
  requisitionId?: number | string | null;
  purchaseDate: string;
  purchaseOrderId?: number | string;
  purchaseOrderNum: string;
  custOrderId?: number | string;
  custOrderNum?: string;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  rawId?: number | string;
  rawNum: string;
  rawSpecs: string;
  relationId?: number | string;
  useType?: RawUseType;
  sheetOutputNumber?: number;
  rollUnitWeight?: number;
  orderNumber: number;
  purchaseNumber: number;
  purchaseWeight: number;
  incomingNumber?: number;
  incomingWeight?: number;
  notbackNumber?: number;
  unitPrice: number;
  supId?: number | string;
  supName?: string;
  remark?: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface RawPurchaseIncoming {
  id?: number;
  rawPurchaseItemId: number | string;
  incomingDate: string;
  incomingNumber: number;
  incomingWeight: number;
  purchaseOrderNum?: string;
  custOrderNum?: string;
  materId?: number | string;
  materNum?: string;
  materName?: string;
  rawId?: number | string;
  rawNum?: string;
  rawSpecs?: string;
  supId?: number | string;
  supName?: string;
  remark?: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface RawPurchaseQuery<T> {
  pageNum: number;
  pageSize: number;
  data?: Partial<T>;
}

export interface RequisitionBatchPayload {
  header: {
    requisitionDate: string;
    applyUserId?: number | string;
    remark?: string;
  };
  autoCreatePurchase?: boolean;
  purchaseHeader?: {
    purchaseDate: string;
    purchaseOrderId?: number | string;
    purchaseOrderNum?: string;
    supId?: number | string;
    supName?: string;
    unitPrice?: number;
    remark?: string;
  };
  rows: Array<
    Pick<
      RawPurchaseRequisition,
      | "custOrderId"
      | "custOrderNum"
      | "materId"
      | "materNum"
      | "materName"
      | "rawId"
      | "rawNum"
      | "rawSpecs"
      | "relationId"
      | "useType"
      | "sheetOutputNumber"
      | "rollUnitWeight"
      | "requisitionNumber"
      | "requisitionWeight"
      | "remark"
    >
  >;
}

export interface OrderItemBatchPayload {
  mode: "withRequisition" | "withoutRequisition";
  header: {
    purchaseDate: string;
    purchaseOrderId?: number | string;
    purchaseOrderNum: string;
    supId?: number | string;
    supName?: string;
    remark?: string;
  };
  rows: Array<
    Pick<
      RawPurchaseItem,
      | "requisitionId"
      | "custOrderId"
      | "custOrderNum"
      | "materId"
      | "materNum"
      | "materName"
      | "rawId"
      | "rawNum"
      | "rawSpecs"
      | "relationId"
      | "useType"
      | "sheetOutputNumber"
      | "rollUnitWeight"
      | "orderNumber"
      | "purchaseNumber"
      | "purchaseWeight"
      | "unitPrice"
      | "remark"
    >
  >;
}

export interface IncomingBatchPayload {
  header: {
    incomingDate: string;
    supId?: number | string;
    supName?: string;
    remark?: string;
  };
  rows: Array<Pick<RawPurchaseIncoming, "rawPurchaseItemId" | "incomingNumber" | "incomingWeight" | "remark">>;
}
