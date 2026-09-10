# production/dailySheet 生产日报/生产记录页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供生产记录分页查询。
- 支持新增、查看、编辑、单个删除、批量删除、批量导入、批量添加、导出。
- 支持按日期区间、产品、工序、机器、操作员、工时、数量、不良数、备注等字段筛选。
- 支持表格行点击选择、当页全选、取消选择，并实时汇总选中记录的数量与工时总计。

## 技术实现
- 页面核心是 ProTable + ProductionDrawer + BatchAddDialog + ImportExcel。
- 使用 virtualized 和固定 table-height，说明数据量可能较大。
- 通过 computed selectedList 计算 numnberTotal 和 timeTotal，避免 watch 过重。
- 打开抽屉时会把 materialList 和 staffList 一并传入。
- 页面代码质量相对较新，批量操作、总计显示、导入导出组织得比较完整。

## 后端 API
- getProductionAll => POST /production/getAll
- addProduction => POST /production/add
- editProduction => PUT /production/edit
- deleteProduction => DELETE /production/delete/{id}
- deleteManyProduction => POST /production/deleteBatch
- getProductionModel => GET /production/exportModel
- addManyProduction => POST /production/importBatch
- addBatchApi => POST /production/addBatch
- getProductionMap => GET /production/getIdMap
- getMapNum => GET /mater/getMapNum

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。


## 2026-09 生产效率第一版
- 日报后增加效率状态、提示原因；待核实整行标黄，顶部“只看待核实”可快速筛选。
- 原始产量/工时选择合计保持原样，不能用该合计代替效率的有效工时。
- `EffReviewDrawer.vue` 调用 GET `/production/eff/review/{id}` 展示当时依据和版本历史；POST `/production/eff/review` 保存核对无误、更正、无法核实。
- 查看需要view、核实需要review、更正需要correct业务权限；均为 `production:eff:*`。
- 修改时发送revision，服务器拒绝过期版本。待核实/无法核实记录须通过核实抽屉更正。
- 核实和更正仅影响后续参考，已经保存的效率结果及月度建议不改变。
- 效率标签：有效/已核对无误用绿色，历史不足用蓝色，已更正用青绿色，待核实用黄色，无法核实用橙色，基础无效用红色，其余用灰色。只有待核实整行标黄。

- NORMAL显示“有效”，该状态的效率提示原因留空。本人平时/最近参考不足8日时使用现有日期，最近最多8日；任一参考无数据才显示历史不足。标准定标现为至少2人、超过20小时、至少5个生产日期。

- 效率依据展示固定标准速度及记录时间，从日报版本证据读取；当时没有标准的，在后续首次确认时补入，补入后固定。仍无标准显示“暂无已确认标准，后续确认后补入”。补入时间独立展示，各历史版本单独显示其标准快照，历史效率结果不重算。
- 本人平时无数据才逐月向前扩大，最近不足8日则逐月扩大，均最多两年；抽屉显示当次实际参考范围。

- 页面时间统一通过formatEffTime显示为YYYY-MM-DD HH:mm:ss，去掉T和小数秒；不改变原始存储时间及快照。

## 新人参考及模具分组（2026-09-08）
本人有效历史不足5个生产日改用其他员工参考，达到5日才使用本人平时/最近速度；无足够参考时标黄待核实，不作为后续参考。抽屉显示判断来源、本人有效天数、其他员工参考速度/样本/期间及效率分组。其他员工参考须同产品、工序、模具组且排除本人，至少2人、超过20小时、5个日期，前三整月逐月扩展且最多两年。原来“本人有几天就判断”的描述已被本规则替代。本人最近仍最多8个日期。
汇流排12740的P029/P004合为连续模，其余为单冲模；只改变效率分组，不改产品/日报原始字段。已有固定速度与旧效率结果不变。

## 当前判断规则（2026-09-09，替代上方新人规则）
取消其他员工参考与5日切换；本人有几天用几天，两项都有参考时按本人判断，任一缺失则用已确认标准速度，标准也没有才历史不足。抽屉显示“本人平时与最近速度／标准速度（本人参考不足）／暂无参考”，标准兜底时显示本次参考标准速度。历史固定标准不覆盖，汇流排分组保留。历史不足日报已单独重新判断，其他状态保持恢复结果。

## 当前规则更新：最近5日与标准复核
最近最多5个不同生产日期；本人两项都有则同时异常才复核，只有一项就按这一项。本人正常不再查标准；本人异常且有标准时，标准也异常才标黄，无标准直接标黄。本人两项全无才直接按标准判断，标准也无则历史不足。页面新增“本人异常后，标准速度复核”依据，保留本次使用的标准值。此前v6任一参考缺失即用标准的描述不再适用。
