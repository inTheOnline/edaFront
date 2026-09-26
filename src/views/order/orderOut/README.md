# order/orderOut 出货单页

## 工具箱与客户对账单（2026-09-26）

- 原“Excel导出”移入“工具箱”下拉，保留原有当前筛选全部数据导出；新增“导出对账单”，由 `StatementDialog.vue` 负责客户、月份、附加内容与材料录入。
- 对账单仅 `price:view` 可用，服务端再次鉴权。客户与月份确定全部导出范围，不使用当前勾选/筛选/分页。精型按自然月，其余三家按上月25日至本月25日（前开后闭）；窗口明确显示实际纳入日期。
- 精型“精型项目”与“精型来料加工”两sheet，其他项目归入来料加工；源科昱1个sheet；广州祥鑫3个sheet；东莞祥鑫5个sheet。其他客户的默认模板暂未设计，显示提示并禁用导出按钮。
- `GET /orderOut/statement/options` 返回实际账期及材料选项；`POST /orderOut/statement/export` 使用 `http.download` 及 `useDownload`，识别业务错误Blob，不能把错误JSON保存成Excel。
- 广州/东莞固定材料下拉分别1款/5款，东莞双向包材可选LH35、LH7、木卡板、胶卡板、铁笼。规格与单位随材料带出，原材料填未税价、包材填含税价。前端不计算财务结果，历史材料数量和价格不默认带入。
- 附加内容选填，未填项导出空白；所有填写仅用于本次文件。切换客户或月份清空附加内容与材料，防止串入其他账期；请求序号丢弃过期的模板响应，加载失败禁用导出。
- 东莞应实收＝成品－原材料＋改模款－扣款；源科昱采购/财务核对额、未付款、未开票及扣款说明单独填写。材料行数量/单价不完整时对应合计留空；没有材料行则原材料sheet为空。
- 2026-09-26验证：隔离Vite页面挂载正式弹窗，Edge/Playwright验证材料下拉、附加金额请求、Excel下载、业务错误、切换客户清空和默认模板禁用。1500px与700px视觉检查；接口为样例数据，不代表正式账号端到端测试。全项目vue-tsc存在既有错误，本次新增文件无类型错误。

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供出货单分页查询。
- 支持新增、批量添加、自定义批量弹窗、Excel 导入、Excel 导出、批量删除；批量添加可选择是否同步库存，默认同步。
- 批量添加的送货数量支持加减乘除和括号（例如 `1+1`、`(10+5)*2`），失焦或回车后计算；保存前也会计算并校验，无效公式或除零禁止提交，保留原有数量上限校验。
- 支持按送货单号、订单号、产品、创建人、状态等字段筛选。
- 导出当前筛选条件下的全部订单出货数据，不受列表分页限制；Excel 使用列表中文列名。
- 列表支持点击整行勾选；顶部汇总所选记录的送货数量，并可一键取消选择。
- 顶部含税金额累加所选记录的 `amount`，退货负数参与抵扣，仅 `price:view` 可见；保留两位小数，未选择显示 0.00，存在空金额时显示“—”。
- 顶部“退货”打开独立 `ReturnDialog`：手动录入退货单号（必填，最多20字符）、日期、产品、正数退货数量、备注，订单明细可选。
- 选择订单后自动带出产品；前后端均禁止退货数量超过该条目的已出货数。未关联订单时不修改订单数量。
- 同步库存默认开启，使用不良品仓 `BAD` 的 `BAD_IN` 入库，备注自动包含“客户退货”；关闭后不变更库存。
- 退货记录以负数数量保存到出货表，状态为“客户退货”（2），使用手动填写的退货单号，列表和导出保留负数以反映净出货数量。
- 删除退货会撤销对应库存流水并重新汇总订单出货数；删除普通出货后若会使订单净出货数小于零则禁止删除。

## 技术实现
- 页面与表格容器使用固定可用高度的弹性布局，复用 ProTable 内部滚动；数据增加时不撑高页面，分页保留在底部。
- 页面会先加载 order、user、mater 字典。
- 列表请求使用 getOrderOut，批量手工添加通过本目录 BatchAddDialog 打开，自定义导入仍走 ImportExcel。
- 订单/产品字段使用字典映射展示，状态使用 outTypeEnum，而不是从接口临时取值。
- 出货和退货统一使用 `EditDialog` 完整编辑；退货数量以正数编辑，后台保存原业务方向。原库存同步方式保留，保存时由后端同步调整原流水。

## 后端 API
- getOrderOut => POST /orderOut/all
- addOrderReturn => POST /orderOut/return（`num` 必填、`orderMaterId` 可选、`materId`、`number` 正数、`time`、`remark`、`syncStock` 默认 true）
- getModel => DOWNLOAD /orderOut/getModel
- addMany => POST /orderOut/addMany
- deleteMany => POST /orderOut/deleteMany
- addOrderOut => POST /orderOut/addOrder
- addBatchApi => POST /orderOut/addBatchApi?syncStock=true（`syncStock` 可选，默认 `true`）
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

- editReturnNum => POST /orderOut/return/{id}/num（id 为出库明细 ID，请求体为 num）。
- 列表与导出统一按日期倒序、同日明细 ID 倒序。

## 价格、客户与完整编辑
- 关联订单的价格动态取订单产品行单价，出货表单只读；游离记录初始化物料售价后可按 `price:edit` 修改。价格及金额展示、导出按 `price:view` 控制。
- 新增游离记录自动带出物料客户，允许更正并保存独立客户；换绑订单必须同原客户，换产品不能跨客户。解绑当次保留客户，保存解绑后可在游离编辑中更正。
- `GET /orderOut/editInfo?id=` 获取编辑详情、`headerLineCount` 及原库存同步状态；`PUT /orderOut/edit` 保存完整表单，解绑必须传 `orderMaterId:null`。
- 仅当单号或日期实际变化且同单有其他行时，选择“仅改此项”（`scope:ITEM`）或“确认修改整单”（`scope:DOCUMENT`）；只改数量、备注、产品等不提示整单修改。
- 订单选择器携带 `returnMode`；退货可以选择已全部交付但仍有净已交数量的订单。
- 缓存标签重新激活时刷新列表，订单改价后切回可看到新的动态价格；首次激活不重复请求。

## 验证边界（2026-09-19）
- 独立 Vite 页面挂载正式 `EditDialog`、订单选择器与价格权限逻辑，使用示例接口数据，经本机 Edge / Playwright 验证：只改数量无整单提示、`ITEM` / `DOCUMENT` 分支、解绑保留价格和客户、授权改价、无查看权限隐藏、仅查看禁改、退货正数编辑、换产品跨客户或加载失败时回退产品及配套价格。
- 上述浏览器验证不连接业务数据库，不执行真实出货或库存记账。服务端权限、库存事务与并发约束由对应后端测试单独验证；上线后的真实账号端到端保存仍需在授权测试数据上验收。
