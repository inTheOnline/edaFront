# 仓库流水

- 列表、详情及当前页导出显示相关人（relatedPerson）；新增、编辑、批量添加均必填。
- PersonSelect 复用 staff 员工字典，输入至少一个字后联想，只能选择员工姓名。自动流水由后端记录本次操作人姓名。
- 批量添加在流水类型旁统一选择相关人，整批每条流水使用同一个相关人；重新打开弹窗时清空选择。

- POST /stock/v2/flow/page 返回有效流水分页 records/total。入库加、出库减；已删除及修改前版本不进入列表和库存。
- 支持仓库、物料编号/名称、类型、日期和库存类别筛选；统计抽屉按 itemId、qualityStatus 精确查询。
- 汇总卡片和图表放在仓库首页，本页仅保留筛选、操作、明细与分页。
- POST /stock/v2/manual 新增，PUT /stock/v2/manual/{docId} 修改，修改在事务内撤销旧数量并新增有效版本。
- DELETE /stock/v2/flow/{docId} 与 POST /stock/v2/flow/deleteBatch 撤销库存影响并逻辑删除；不产生额外反向流水。
- 业务自动流水可删除，不允许手工编辑；沿用业务停止同步规则。
- ProTable 提供选择、筛选与分页，FlowDrawer 提供新增/查看/编辑；导出仅当前页。
- 复用 SelectionSummary 显示选中条数和数量合计（按 quantity 相加），支持取消选择；刷新、翻页后清空选择及汇总。
- fixedWarehouseCode/fixedItemId/fixedQualityStatus/readOnly/showSwitcher 支持只读对账。
- 库存类别使用标签：未检黄色、已检绿色、普通库存灰色；流水类型复用 GodownTypeEnum 的旧仓库标签配色，未匹配类型沿用默认蓝色。
- 验证：入库1后流水和统计均为1，修改为2后仅新版本计入2，删除后统计归0。
