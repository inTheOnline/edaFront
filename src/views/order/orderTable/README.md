# order/orderTable 订单主表页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供订单主表分页查询。
- 支持新增订单、Excel 导入、批量添加、导出、批量删除、查看、编辑、单个删除。
- 支持展开行查看订单下的物料明细。
- 支持按订单编号、客户、创建人等字段筛选。

## 技术实现
- 页面是标准的 ProTable + UserDrawer + ImportExcel + Dialog 组合。
- expand 插槽展示 scope.row.maters，用于查看订单明细。
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

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
