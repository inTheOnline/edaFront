// 请购状态
export type PurchaseStatus = "待审核" | "已驳回" | "待采购" | "已采购" | "已完成" | "已取消";

// 请购单实体（对应后端 OfficePurchase）
export interface OfficePurchase {
  id?: number;
  purchaseId?: number; // 兼容历史字段

  applyUserId: number;
  userId?: number;

  itemName: string;
  itemSpec?: string;
  itemUnit?: string;
  itemNumber: number;

  itemFileId?: number;
  fileUrl?: string;

  applyReason?: string;
  expectedDate?: string;
  fast?: number;

  status?: PurchaseStatus;
  rejectReason?: string;
  remark?: string;

  createdTime?: string;
  updatedTime?: string;
}

// 请购分页查询参数
export interface OfficePurchaseQuery {
  pageNum: number;
  pageSize: number;
  data?: Partial<OfficePurchase>;
}

// 请购分页结果
export interface OfficePurchasePageResult {
  records: OfficePurchase[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 采购录入实体
export interface OfficePurchaseRecord {
  id?: number;
  officePurchaseId: number;
  platform: string;
  link?: string;
  unitPrice: number;
  number: number;
  amount?: number;
  buyDate: string;
  remark?: string;
  userId?: number;
  createdTime?: string;
}

// 采购待办
export interface PurchaseTodoResult {
  auditTodo: {
    count: number;
    records: OfficePurchase[];
  };
  purchaseTodo: {
    count: number;
    records: OfficePurchase[];
  };
}
