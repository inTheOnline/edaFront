# 辅材采购

- 路由：`/buy/assistPurchase`。
- 从未采购完的辅材请购明细生成采购单，一张采购单对应一个供应商。
- 页面复用 `../assistProcurement/AssistDocumentPage.vue`，接口前缀为 `/buy/assist/purchase`。
- 已产生回执的采购单不可修改或删除。
- 采购数量仅允许非零正整数，状态统一使用语义 Tag 展示。
- 明细列表支持点击整行勾选；顶部汇总所选明细的采购数量、已回执数量和待回数量，并可一键取消选择。
- 主表和明细视图均可按整张采购单打开 PDF 浏览器预览，再使用浏览器工具栏下载或打印；使用 `src/modules/document-pdf` 通用模块。
- PDF 公司抬头读取 `GET /buy/purchase-document/profile`，业务模板位于 `../utils/purchaseDocumentPdf.ts`。
