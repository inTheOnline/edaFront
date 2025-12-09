// 单条记录实体（对应后端 OfficePurchase）
export interface OfficePurchase {
  id?: number;

  applyUserId: number;

  itemName: string;
  itemSpec?: string;
  itemUnit?: string;

  itemNumber: number;

  itemFileId?: number;

  applyReason?: string;

  expectedDate?: string;

  uphold?: number;  // 是否审核：0未审核 1已审核

  status?: string;  // 状态：待采购/已采购/已入库/已取消

  remark?: string;

  createdTime?: string;
  updatedTime?: string;
}

// 分页查询参数，你后端 PageRequest<T> 的结构
export interface OfficePurchaseQuery {
  pageNum: number;
  pageSize: number;
  data?: Partial<OfficePurchase>; // 可以传入 itemName、applyUserId 等作为搜索条件
}

// 后端分页返回结构
export interface OfficePurchasePageResult {
  records: OfficePurchase[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
