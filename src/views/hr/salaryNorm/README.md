# 工资标准页面

- 组件路径：`/hr/salaryNorm/index`，使用 ProTable 和右侧编辑抽屉。
- 页面只允许编辑，不提供新增和删除；工资标准随职员新增、恢复和删除自动联动。
- 员工展示和筛选使用 `dictStore.dictMap["staff"]`，筛选请求参数仍为 `staffId`。
- 金额输入框不显示增减控件，允许直接输入非负小数。
- 接口：`/hr/salaryNorm/page|get|edit`。
