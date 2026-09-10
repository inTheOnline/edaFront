export const stockSourceMap: Record<string, string> = {
  ASSIST_RECEIPT_ITEM: "辅材采购回执",
  RAW_RECEIPT_ITEM: "原材料采购回执",
  MANUAL_STOCK: "手工录入",
  OUTBACK_ITEM: "外发回执",
  ORDER_OUT: "订单送货",
  RAW_PURCHASE_INCOMING: "原材料来料",
  LEGACY_GODOWN_FLOW: "历史仓库流水",
  LEGACY_DELETED_FLOW: "已删除历史流水",
  LEGACY_RAW_OPENING: "原材料期初"
};

export const getStockSourceName = (source?: string) =>
  source ? stockSourceMap[source] ?? source : "未知来源";
