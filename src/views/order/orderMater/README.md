# order/orderMater 订单物料明细页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 这是订单物料/交付进度页，不是订单主表页。
- 支持按客户、订单编号、物料、创建人等维度筛选；物料搜索框通过 openTheDog 参数同时模糊匹配物料编号或物料名称，匹配任一字段即可。
- 支持查看订单出货详情、批量删除订单、导出、批量导入、批量添加。
- 支持显示/隐藏已完成订单，并可重置状态。
- 批量添加的“有订单”选择器只显示胜蓝客户 2026-06-01 起且非“不予处理”的客户订单，并按下单日期倒序排列。
- 选择器会核对客户订单条目单价与物料表售价；不一致时订单状态为“单价异常”，详情备注记录系统单价和本次下单价，价格恢复一致后自动恢复为“未处理”。
- 顶部提供“快速请购”入口，与订单主表复用同一个快速请购弹框，默认按订单 Item 添加。
- 导出当前筛选条件及“显示/隐藏已完成”状态下的全部数据，不受列表分页限制；Excel 使用列表中文列名。
- 列表支持点击整行勾选；顶部汇总所选物料明细的订单数量、已交数量和未交数量，并可一键取消选择。

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
