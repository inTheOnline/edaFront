# outgoing/outback 外发回货页

## 阅读顺序
- 先看 `index.vue`
- 再看 `components/UserDrawer.vue`、`components/BatchAddDialog.vue`、`components/OutItemSelector.vue`
- 接口定义在上级目录 `../service.ts`

## 当前功能
- 外发回货分页查询
- 单条新增、编辑、删除
- 批量新增
- 按当前筛选条件导出全部回执数据为 Excel，不受列表分页限制
- 录入时先选择外发明细 `outItemId`

## 导出约定
- Excel 表头使用列表中文列名，不导出选择、序号和操作列
- 导出列为：回执日期、回执单号、对应外发单、供应商、物料编码、物料名称、回执数量、状态、整单备注、行备注

## 当前交互约定
- 列表页支持点击整行勾选当前项，行为与勾选框同步
- 列表头部显示已勾选记录的 `number` 求和，样式参考 `production/dailySheet`
- 列表头部提供“取消选择”，可一键清空当前已勾选记录
- 单条表单里的“外发明细”区域支持整块点击打开选择器
- 选择器表格支持整行点击选中

## 批量选择规则
- `批量增加 -> 选择外发明细` 支持多选
- 一次确认可将多条外发明细批量带回到批量新增表格
- 自动去重已选项（按 `outItemId`）
- 首次选中外发明细后，表头供应商自动锁定为该明细所属供应商
- 锁定后再次打开选择器时，只展示该供应商的外发明细
- 批量新增明细行包含 `仓库同步` 开关，默认开启；提交时每条 `rows` 明细会携带 `syncWarehouse`

## 数量提醒
- 单条新增、单条编辑、批量新增回执时，若提交后 `未回数量 < 0`，保存前弹出二次确认
- 确认文案按 `物料名（料号）` 展示

## 相关接口
- `/outgoing/outback/page`
- `/outgoing/outback/create`
- `/outgoing/outback/update`
- `/outgoing/outback/delete`
- `/outgoing/outback/batch-create`
