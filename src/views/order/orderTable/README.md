# order/orderTable 订单主表页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供订单主表分页查询。
- 支持新增订单、Excel 导入、批量添加、导出、批量删除、查看、编辑、单个删除。
- 支持展开行查看订单下的物料明细。
- 快速请购会排除插件产品；选择已维护关系的主产品时，自动按相同数量和损耗计算插件原材料，不计算插件辅材。
- 支持按订单编号、客户、创建人等字段筛选。
- 顶部“快速请购”支持按产品或订单 Item 展开 BOM，并在一次确认中分别生成原材料、辅材请购单。
- 导出当前筛选条件下的全部订单数据，不受列表分页限制；Excel 使用列表中文列名。
- 列表支持点击整行勾选；顶部汇总所选订单明细的订单数量、已交数量和未交数量，并可一键取消选择。
- 顶部含税金额按所选订单各明细的含税单价 × 未交数量累加，仅 `price:view` 可见；保留两位小数，未选择显示 0.00，存在缺价或缺数量的明细时显示“—”。

## 技术实现
- 页面是标准的 ProTable + UserDrawer + ImportExcel + Dialog 组合。
- expand 插槽展示 scope.row.maters，用于查看订单明细。
- 订单物料明细中的价格字段通过 price:view 权限控制显示。
- 字典依赖 cust、user、mater。
- 导入导出均通过 useDownload/ImportExcel 统一处理。
- 当前页面标题、部分变量名仍保留旧的 Outgoing-Form 痕迹，属于历史复制代码的一部分。

## 后端 API
- getOrderAll => POST /order/all
- getModel => DOWNLOAD /order/getModel
- addManyOrder => POST /order/addManyOrder
- deleteMany => POST /order/deleteMany
- addOrder => POST /order/addOrder
- editOrder => POST /order/editOrder
- delect => POST /order/deleteMater
- getDepartmentApi => GET /department/getMap
- getStateApi => GET /outgoing/getSubc_state
- previewQuickRequisition => POST /buy/quick-requisition/preview
- confirmQuickRequisition => POST /buy/quick-requisition/confirm

## 快速请购

- 入口位于订单主表顶部工具栏，弹框组件为 `components/QuickRequisitionDialog.vue`。
- 原材料在上、辅材在下；相同采购物料合并，数量和备注可调整。
- 原材料只在同一产品内部合并，不跨产品合并；生成的请购明细写入并展示产品物料编号和名称。
- 产品、原材料、辅材三个表格分别显示独立序号；产品默认损耗为 2%，先向上取整损耗后生产数再展开 BOM。
- 预览明细允许移除；移除项不生成请购明细，但其订单 Item 来源仍记录为已请购。
- 订单 Item 模式只识别快速请购来源记录，不读取上线前历史请购单。
- 已覆盖当前全部原材和辅材关系的 Item 再次请购时，必须确认并手工填写产品数量。
- 缺少某类 BOM 时跳过该类别并显示警告；两类均无有效明细时不能提交。

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。

## 订单行价格
- 新增、查看、编辑抽屉使用本目录 `OrderLines.vue`，含税单价保留四位小数，手动新增默认读取物料售价。
- `price:view` 控制价格与金额可见，`price:edit` 控制可修改；无改价权限时请求不发送价格覆盖值。
- “导入订单”复用 `orderMater/components/BatchAddDialog` 的客户订单转入模式，选择具体客户订单产品行并传 `custOrderItemId`，不是只选择客户订单主表。
- Excel 导出追加“订单产品”明细页，价格列沿用查看权限。客户订单详情的金额、单价及系统核价备注同样按查看权限处理。

## 验证边界（2026-09-19）
- 本次前端改动执行定向 ESLint、与既有基线比较的类型检查及正式 Vite 构建。已有历史类型错误保留，不视为本次新增错误。
- 未使用真实订单进行浏览器保存；订单价格来源及动态关联价格由后端回归验证，正式数据修改须另行验收。
