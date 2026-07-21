# 工资明细页面

- 组件路径：`/hr/salary/index`，支持分页、查看、手动编辑、单删、批删及行内修改记录。
- 接口：`/hr/salary/page|get|edit|delete|deleteMany`、`/hr/salary/log/list`。
- 仅工资、补贴、扣款、应发工资和备注可编辑，`changeReason` 必填。
- 后端不会自动重算应发工资；组成项变化但应发工资未变时前端再次确认。
- 表头“计算工资”复用 `ImportExcel` 上传 XLS/XLSX 文件，调用 `POST /hr/salary/calculate`，成功后下载本次工资明细 Excel 并刷新列表。
- 本次不提供工资计算模板和覆盖逻辑；上传弹窗中的对应控件暂时保留。
