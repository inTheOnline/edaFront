# 辅材请购

- 路由：`/buy/assistRequisition`。
- 一张请购单支持添加多种 `assist_mater` 辅材。
- 页面复用 `../assistProcurement/AssistDocumentPage.vue`，接口前缀为 `/buy/assist/requisition`。
- 已产生采购记录的请购单不可修改或删除。
- 辅材选项显示中文类别；数量仅允许非零正整数。
- 状态按 `待处理 → 部分采购 → 已采购 → 部分回执 → 已完成` 流转，已有回执时优先显示回执状态。
