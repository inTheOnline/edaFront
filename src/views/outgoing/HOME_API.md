# 委外首页接口

## 当前实现

首页使用真实委外单与回执明细，不再调用 `mock.ts`。供应商、料号通过业务记录联动筛选，接口统一返回 `Result`。

## 总览

`GET /outgoing/home/summary`

返回 `data`：

- `month`：统计月份，`YYYY-MM`。
- `monthIssueQty`：本月有效外发明细数量合计。
- `monthReceiptQty`：按回执日期统计的本月已提交回执数量。
- `pendingQty`：全部有效外发逐条计算 `max(外发数量 - 已提交回执数量, 0)` 后求和。
- `supplierCount`：本月有有效外发记录的供应商数。
- `supplierRank`：未回数量大于零的供应商前 8 名，按 `pendingQty` 倒序；字段为 `supId / supName / pendingQty`。

有效外发排除主表、明细已删除或作废记录。回执必须满足主表与明细未删除、主表状态为 `901`（已提交）；`101` 草稿及 `999` 作废不计入。待回数量直接从有效回执汇总，不使用可能包含草稿的历史 `back_number` 缓存。

卡片与排行不随趋势筛选变化。卡片不再显示模拟环比。没有真实工具日志来源，因此删除模拟工具动态；保留扣款及报价导入功能。

## 供应商 / 物料双向筛选

`POST /outgoing/home/options`

参数使用趋势查询的 `startDate / endDate / grain`，`supId / materId` 均可不传。

- 候选来源：所选期间内有效外发及已提交回执涉及的供应商与物料关系，与趋势图统计范围一致。
- `suppliers` 只按所选 `materId` 和日期过滤，不受当前 `supId` 自身限制。
- `materials` 只按所选 `supId` 和日期过滤，不受当前 `materId` 自身限制。
- 未选择另一项时，列出期间内全部有业务记录的候选；候选去重，无分页截断。
- 返回 `{ suppliers: [{ value, label }], materials: [{ value, label, num }] }`。
- 修改供应商、物料或日期会重新加载候选并清除旧图表；清除一项后恢复按剩余条件筛选。
- 日期变化后已失效的选择自动清空；在途旧响应不会覆盖新条件。加载失败不回退到全量字典，支持重试。

## 外发 / 回执趋势

`POST /outgoing/home/trend`

```json
{
  "supId": 1,
  "materId": 2,
  "grain": "month",
  "startDate": "2026-01-01",
  "endDate": "2026-09-30"
}
```

- 供应商、料号、起止日期必填；`grain` 支持 `month` 或 `day`。
- 按月最多 120 个月，按日最多 366 天。
- 日期范围包含起止日期；按月时首末月只统计所选日期，不自动扩展为整月。
- 外发按 `subcontract.subc_date`，回执按 `outback.back_date`，分别统计当期数量，不是累计数量。
- 回执按实际回执供应商和关联外发明细的料号筛选，不要求外发发生在同一日期范围内。
- 未发生记录的月份或日期补零，按时间升序返回。
- 返回 `data` 数组：`[{ date, issueCount, receiptCount }]`；日期按粒度为 `YYYY-MM` 或 `YYYY-MM-DD`。
- 数量沿用单据录入数量，不做单位换算。

前端默认按月、范围为近 12 个自然月截至今天。先选择供应商和料号再查询；修改筛选条件会清除旧结果，并丢弃在途旧响应。提供加载、错误重试、空状态及统计明细表。

## 实现位置与验证

- 前端：`index.vue`、`home.ts`。
- 后端：`OutHomeController`、`OutHomeService`、`OutHomeMapper.xml`。
- 单元测试：`OutHomeServiceTest`（日期边界、补零、参数校验、双向联动）。
- 本地数据库只读核对：`OutHomeMysqlTest`，需设置 `-Derp.local.readonly=true`，逐条读取真实明细并用 Java 汇总核对 SQL。
