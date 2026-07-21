# buy/rawPurchase 原材料采购页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 批量添加交互优先参考订单表批量添加，但字段规则以本页为准。
- 涉及接口字段时，同时检查 `src/api/modules/buy/rawPurchase.ts` 和 `src/api/interface/buy/rawPurchase.ts`。

## 功能内容
- 页面在采购系统下，菜单路径 `/buy/rawPurchase`。
- 页面使用 Tabs 展示三张明细表：请购明细、采购订单明细、来料明细。
- 三张表支持新增、查看、编辑、删除、批量删除、批量添加、导入、导出。
- 请购批量添加支持当前账号默认申请人。
- 请购批量添加支持绑定客户订单或不绑定客户订单。
- 请购批量添加的绑定订单模式实际选择订单物料明细 Item/条目，数据源复用 `POST /order/getOrderMater`。
- 绑定订单模式选择订单物料明细后，会按 `relationId/useType/rawId/rawNum/materId/materNum/materName` 尝试自动带出产品/原材料关系；只按物料匹配到多条关系时默认填第一条，并允许手动调整。
- 请购批量添加的产品/原材料下拉不展示原材料料号，只展示产品、用料类型和原材料型号。
- 请购批量添加的不绑定订单模式不显示、不填写、不提交客户订单字段。
- 请购批量添加支持“同步生成采购”开关，默认关闭。
- 同步生成采购时，前端只填写采购日期、供应商、单价、采购备注；采购单号由后端生成。

## 原材料关系
- 产品和原材料关系来自后端 `GET /buy/rawPurchase/rawMater/options`。
- 后端关系表 `raw_mater_relation` 一行绑定一个产品，只保存外键和换算字段：
  - `mater_id`
  - `sheet_raw_id`
  - `sheet_output_number`
  - `roll_raw_id`
  - `roll_unit_weight`
  - `remark`
- 关系表不保存 `mater_num/mater_name/raw_num/raw_specs` 这类冗余展示字段。
- 前端展示所需的产品编号、品名、原材料号、原材料规格，由后端查询 `material` 和 `raw` 后返回。
- 后端会把一行关系拆成张料、卷料两条 options，前端下拉直接使用返回结果。

## 字段约定
- 产品/品名字段：`materId/materNum/materName`。
- 原材料字段：`rawId/rawNum/rawSpecs`。
- 产品原料关系字段：`relationId/useType/sheetOutputNumber/rollUnitWeight`。
- `useType` 取值：
  - `sheet`：张料
  - `roll`：卷料
- 请购数量和请购重量允许二选一填写；未填字段保持 `null`，不要前端补 `0`。
- 同步生成采购时，后端按 `YCG + yyMMdd + 3位序列` 生成采购订单号，例如 `YCG260624001`。
- 前端不计算汇总字段，只展示后端返回：
  - 请购表：`purchasedNumber/purchasedWeight/notPurchaseNumber/status`
  - 采购表：`incomingNumber/incomingWeight/notbackNumber`

## 后端 API
- 产品原料关系：
  - `POST /buy/rawPurchase/rawMater/page`
  - `POST /buy/rawPurchase/rawMater/add`
  - `PUT /buy/rawPurchase/rawMater/edit`
  - `DELETE /buy/rawPurchase/rawMater/delete/{id}`
  - `POST /buy/rawPurchase/rawMater/deleteBatch`
  - `GET /buy/rawPurchase/rawMater/options`
- 请购明细：
  - `POST /buy/rawPurchase/requisition/page`
  - `POST /buy/rawPurchase/requisition/add`
  - `PUT /buy/rawPurchase/requisition/edit`
  - `DELETE /buy/rawPurchase/requisition/delete/{id}`
  - `POST /buy/rawPurchase/requisition/deleteBatch`
  - `POST /buy/rawPurchase/requisition/batch-create`
  - `POST /buy/rawPurchase/requisition/import`
  - `POST /buy/rawPurchase/requisition/getModel`
  - `POST /buy/rawPurchase/requisition/export`
  - `GET /buy/rawPurchase/requisition/options`
- 采购订单明细：
  - `POST /buy/rawPurchase/orderItem/page`
  - `POST /buy/rawPurchase/orderItem/add`
  - `PUT /buy/rawPurchase/orderItem/edit`
  - `DELETE /buy/rawPurchase/orderItem/delete/{id}`
  - `POST /buy/rawPurchase/orderItem/deleteBatch`
  - `POST /buy/rawPurchase/orderItem/batch-create`
  - `POST /buy/rawPurchase/orderItem/import`
  - `POST /buy/rawPurchase/orderItem/getModel`
  - `POST /buy/rawPurchase/orderItem/export`
  - `GET /buy/rawPurchase/orderItem/options`
- 来料明细：
  - `POST /buy/rawPurchase/incoming/page`
  - `POST /buy/rawPurchase/incoming/add`
  - `PUT /buy/rawPurchase/incoming/edit`
  - `DELETE /buy/rawPurchase/incoming/delete/{id}`
  - `POST /buy/rawPurchase/incoming/deleteBatch`
  - `POST /buy/rawPurchase/incoming/batch-create`
  - `POST /buy/rawPurchase/incoming/import`
  - `POST /buy/rawPurchase/incoming/getModel`
  - `POST /buy/rawPurchase/incoming/export`

## 注意点
- 真实菜单来自后端 `/menu/list`，本地 `authMenuList.json` 只作 fallback。
- 一个采购 ITEM 最多绑定一条请购；一条请购允许拆分到多个采购 ITEM。
- 采购/来料新增、编辑、删除后，后端负责回算请购和采购订单汇总。
- 绑定订单模式下，前端沿用 `custOrderId/custOrderNum` 字段；其中 `custOrderId` 承载所选订单物料明细 Item 的 `id`，`custOrderNum` 承载 `orderNum`。
