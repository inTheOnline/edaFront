# order/orderOut 出货单页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供出货单分页查询。
- 支持新增、批量添加、自定义批量弹窗、Excel 导入、Excel 导出、批量删除。
- 支持按送货单号、订单号、产品、创建人、状态等字段筛选。

## 技术实现
- 页面会先加载 order、user、mater 字典。
- 列表请求使用 getOrderOut，批量手工添加通过本目录 BatchAddDialog 打开，自定义导入仍走 ImportExcel。
- 订单/产品字段使用字典映射展示，状态使用 outTypeEnum，而不是从接口临时取值。
- 编辑逻辑目前仍是占位实现，真正编辑流程还需要补全。

## 后端 API
- getOrderOut => POST /orderOut/all
- getModel => DOWNLOAD /orderOut/getModel
- addMany => POST /orderOut/addMany
- deleteMany => POST /orderOut/deleteMany
- addOrderOut => POST /orderOut/addOrder
- addBatchApi => POST /orderOut/addBatchApi（模块接口存在，页面弹窗侧可能会调用）
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
