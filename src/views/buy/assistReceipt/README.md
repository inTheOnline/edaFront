# 辅材回执

- 路由：`/buy/assistReceipt`。
- 一张回执可选择多张采购单，并支持分批、多次回执。
- 保存后通过库存 V2 的 `ASSIST_IN` 流水写入辅材仓。
- 页面复用 `../assistProcurement/AssistDocumentPage.vue`，接口前缀为 `/buy/assist/receipt`。
- 回执数量仅允许非零正整数，状态统一使用语义 Tag 展示。
- 明细列表支持点击整行勾选；顶部汇总所选明细的回执数量，并可一键取消选择。
