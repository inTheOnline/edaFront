# buy/buyBack 回执列表页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 目录名位于 buy 下，但当前实现实际复用了 outgoing/outform 的回执列表逻辑。
- 功能上是供应商回执/回货回执管理，而不是办公采购回执。
- 支持树形筛选、查看、新增、编辑、删除回执，并展开查看物料明细。

## 技术实现
- 页面使用 TreeFilter + ProTable + outgoing/outform 目录下的 UserDrawer 组件。
- 列表数据由 outFormApi 提供，树节点由 supTreeApi 提供。
- 抽屉打开时会先拉客户明细和供应商映射，再传入 options、supMapList。
- 目录归属与实际组件/API 不完全一致，后续改动要特别注意不要误改采购申请页。

## 后端 API
- outFormApi => GET /outgoing/outform/all
- custDetailApi => GET /web/getCust_detail
- supTreeApi => GET /web/getSup_detail
- getSupMapApi => GET /sup/getMap
- getStateApi => GET /outgoing/getSubc_state
- addOutform => POST /outgoing/addOutform
- deleteList => POST /outgoing/deleteList
- editOutform：页面内已预留，但当前仍是本地占位函数，没有真正落到接口

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
