# outgoing/outform 外发表页

## 阅读顺序
- 先看 `index.vue`
- 再看 `components/UserDrawer.vue`、`components/BatchAddDialog.vue`、`components/OutbackDetailDialog.vue`
- 接口定义在上级目录 `../service.ts`

## 当前功能
- 外发表分页查询
- 单条新增、编辑、删除
- 批量新增
- 批量删除前展示“关联回货明细”并二次确认
- 操作列“查看”使用详情弹窗展示当前 item 的回货明细

## 当前交互约定
- 列表页支持点击整行勾选当前项，行为与勾选框同步
- 列表头部紧凑显示已勾选记录的 `number/backNumber/notbackNumber` 三项求和，样式参考 `production/dailySheet`
- 单条表单中的供应商、物料、状态选择支持整块点击展开

## 批量新增规则
- 表头拆分为：
- `外发前缀`：只读，随供应商自动带出
- `外发单号`：手输
- 实际提交单号：`外发前缀 + 外发单号`
- 行明细包含 `materId/number/state/remark`

## 未回数量展示
- 列表页 `未回货数量` 使用胶囊样式展示
- 当 `未回货数量 < 0` 时，单元格高亮，便于识别异常委外单

## 相关接口
- `/outgoing/outform/page`
- `/outgoing/outform/create`
- `/outgoing/outform/update`
- `/outgoing/outform/delete`
- `/outgoing/outform/related-outback`
- `/outgoing/outform/batch-create`

## 2026-04 前缀来源修正
- 批量新增弹窗中的 `外发前缀` 读取 `/sup/getAll` 返回的 `callName`
- 不再使用前端本地硬编码前缀映射
