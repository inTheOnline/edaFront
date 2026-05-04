# order/orderMater 订单物料明细页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 这是订单物料/交付进度页，不是订单主表页。
- 支持按客户、订单编号、物料名称、创建人等维度筛选。
- 支持查看订单出货详情、批量删除订单、导出、批量导入、批量添加。
- 支持显示/隐藏已完成订单，并可重置状态。

## 技术实现
- 页面核心能力是 openWindow：点击订单号或查看按钮后，调用 getAboutById 弹出订单出货详情。
- 页面使用自己的 BatchAddDialog，但复用了 orderTable 目录下的 UserDrawer。
- initParam 是一个 computed，会根据 isShowFinish 动态带上 state 过滤条件。
- 初始化时会自动带上 authStore.defaultInfoGet.custId 作为客户过滤。
- openDrawer 当前把 api 绑定成 getOrderMater，这里有明显历史代码痕迹，后续修改时要谨慎确认新增逻辑。

## 后端 API
- getOrderMater => POST /order/getOrderMater
- getModel => DOWNLOAD /order/getModel
- addManyOrder => POST /order/addManyOrder
- addBatchApi => POST /order/addBatch
- getAboutById => GET /order/getOutById?id=
- deleteMater => POST /order/deleteMater
- reset => GET /order/reset
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
