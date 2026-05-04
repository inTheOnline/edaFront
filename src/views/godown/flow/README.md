# godown/flow 仓库流水页

## 阅读顺序
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供仓库流水分页查询。
- 支持新增、查看、编辑、单个删除、批量删除；单个删除与批量删除都需要二次确认后才会真正提交删除。
- 支持导入、导出、批量添加等典型仓库流水维护动作。
- 页面可加载客户、用户、物料、项目等字典后进行筛选显示。

## 技术实现
- 页面是典型 ProTable + UserDrawer + ImportExcel 组合。
- 使用 computed 读取 selectedList，并直接调用 ProTable 内部 element 进行选中控制。
- dataCallback 统一把 records/total 适配给表格。
- 批量导入和导出分别走 ImportExcel 与 useDownload。

## 后端 API
- getFlow => POST /godown/getFlow
- addFlow => POST /godown/addFlow
- editFlow => PUT /godown/editFlow
- deleteFlow => DELETE /godown/deleteFlow/{id}
- deleteFlowBatch => POST /godown/deleteFlowBatch
- addFlowBatchApi => POST /godown/addFlowBatch（模块接口存在，页面侧当前主要通过本地弹窗批量处理）
- getTotal => POST /godown/getTotal（仓库总览页会用到）
- getDepartmentApi => GET /department/getMap
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 reset 刷新表格，保持现有交互一致。
