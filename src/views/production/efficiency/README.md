# 员工效率

## 功能
按日期范围生成并保存独立计算结果，按员工查看效率、参与工时、应用工时及未参与数量；逐条核对日报版本、当时标准、计算原因。查看旧结果不重算。

## 技术与接口
Vue 3、ProTable、Element Plus抽屉；API定义在 `api/modules/efficiency.ts`。
- POST `/production/eff/result`：startDate、endDate、requestKey，可选operatorId。最长一年。
- POST `/production/eff/result/page`：历史结果分页。
- GET `/production/eff/result/{id}`：保存时的员工汇总。
- POST `/production/eff/result/{id}/detail`：明细分页，支持员工与是否参与筛选。

## 注意
全部接口要求 `production:eff:view`。每次明确点击计算才保存新结果，不覆盖旧结果。请求失败重试使用原requestKey，成功后才生成下次标识。没有有效工时显示“未参与”，不显示0%冒充低效率。此版仅计算效率，不涉及奖金金额。

- 页面时间统一通过formatEffTime显示为YYYY-MM-DD HH:mm:ss，去掉T和小数秒；不改变原始存储时间及快照。

- 已保存结果的员工汇总按效率从高到低展示，同效率保持原顺序，“未参与”排在末尾；排序不修改保存数据。

- 日报计算明细增加“明细效率”：使用该条已保存的应用工时÷实际工时×100%，保留两位小数；未参与记录显示“未参与”，缺少应用工时或实际工时非正数显示“—”。使用快照字段，不读取最新标准。
