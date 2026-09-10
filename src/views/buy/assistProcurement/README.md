# 辅材采购单据共用页面

## 功能

- 请购单、采购单、回执单共用 `AssistDocumentPage.vue`。
- 请购明细展示辅材编码、名称、规格、数量、单位、状态和备注。
- 订单主表“快速请购”按照 `mater_assist` 的产品数量与辅材数量比例生成辅材请购预览。
- 快速请购与原材料请购在后端同一事务内创建；缺失辅材关系时只警告并跳过辅材类别。
- 辅材采购明细支持点击整行勾选，汇总所选明细的采购、已回执和待回数量，并可一键取消选择。
- 辅材回执明细支持点击整行勾选，汇总所选明细的回执数量，并可一键取消选择。
- 请购单与采购单统一使用 `src/modules/document-pdf` 在浏览器中生成 PDF，业务模板位于 `../utils/requisitionDocumentPdf.ts` 和 `../utils/purchaseDocumentPdf.ts`。

## 后端接口

- `/buy/assist/{kind}/table/page`
- `/buy/assist/{kind}/item/page`
- `/buy/assist/{kind}/{id}`
- `/buy/assist/mater/options`
- `/buy/quick-requisition/preview`
- `/buy/quick-requisition/confirm`
