# 工资标准页面

- 组件路径：`/hr/salaryNorm/index`，使用 ProTable、右侧编辑抽屉和修改记录弹窗。
- 页面只允许编辑，不提供新增和删除；工资标准随职员新增、恢复、编辑和删除自动联动。
- 员工展示和筛选使用 `dictStore.dictMap["staff"]`，筛选请求参数仍为 `staffId`。
- 编辑时只提交工资字段、备注和审批信息，不提交 `staffId`。
- 修改理由、执行月份、直属主管意见、审批人和审批日期均为必填。
- 金额保留两位小数；执行月份为 `YYYY-MM`，审批日期为 `YYYY-MM-DD`。
- 接口：`/hr/salaryNorm/page|get|edit|changeLog/page|changeLog/list`。
