# 辅材采购单据共用页面

## 功能

- 请购单、采购单、回执单共用 `AssistDocumentPage.vue`。
- 从其他缓存标签页返回时重新读取当前列表，及时展示采购、回执删除后的数量与状态；首次显示沿用 ProTable 的初始化请求。
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

- 回执单号手填且必填；回执日期、回执单号、采购单号依次显示，顶部字段桌面一行排列。已完成采购单不再出现在新增回执下拉，编辑保留已关联单。增减采购单保留已有明细和备注。采购列表在采购单号前显示采购日期，状态搜索支持多选。

- 普通新增和跨模块快速请购统一记录新建时的登录用户为请购人；编辑保持原请购人，历史空值不补填。请购主表和明细在状态后显示请购人姓名。
