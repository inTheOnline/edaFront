# 正常速度

## 功能
查看每月建议、人数/工时/天数、变动幅度、当前执行速度、计算依据及审核历史。支持单项确认、勾选确认、跨全部分页一键确认。

## 技术与接口
复用 ProTable 与 `api/modules/efficiency.ts`。
- GET `/production/eff/standard/batches`：月份列表。
- POST `/production/eff/standard/page`：支持 batchId、current、status、keyword、process。
- GET `/production/eff/standard/{id}/history`：当时的样本和已审批历史。
- POST `/production/eff/standard/confirm`：batchId、ids 或 all=true。只有最新批次可确认。

## 规则与权限
查看需要 `production:eff:view`，确认需要 `production:eff:confirm`。样本不足及无变化项不能确认；一键确认仅处理本月待确认项。确认立即生效，旧效率结果不变；没有新批准速度时继续使用此前批准的速度。原型与页面均不自动审批。

## 逐月扩展参考范围
样本达标须同时满足：至少2名员工、总工时严格超过20小时、至少5个不同生产日期。本人最近速度取最多8个生产日期的规则不变。
每个产品工序独立从前3个完整月开始，不足则按整月逐月增加，无时间上限，首次达到人数、工时、日期三个条件即停止。无效与待核实记录始终排除。实际起止日期和月数随建议证据保存，列表及依据抽屉展示；旧建议回退显示原批次范围。标黄参考规则不变。

- 页面时间统一通过formatEffTime显示为YYYY-MM-DD HH:mm:ss，去掉T和小数秒；不改变原始存储时间及快照。

## 汇流排12740模具分组
9000005918的P029/P004合为“汇流排12740－连续模”，其余为“汇流排12740－单冲模”。每组、每工序独立建议和审批。产品名称列显示分组名称，旧未分组标准显示过渡说明；没有新组批准标准时仍沿用旧标准。标准历史按machine_group隔离。历史重查后新增4项分组建议，因缺少人工确认的起始参考，目前样本不足。

- 依据抽屉的员工姓名通过 dictStore 加载 staff 字典，并复用 getLabel 按 operatorId 显示；字典未匹配时沿用编号兜底。通常速度仍使用历史依据中的 rate。
