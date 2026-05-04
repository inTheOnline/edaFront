# godown/raw 原料资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供原料分页查询。
- 支持新增、查看、编辑、批量删除、模板导入、导出。
- 支持按原料编号/名称等条件做列表搜索。

## 技术实现
- 页面结构与物料页、仓库流水页一致，复用 ProTable、UserDrawer、ImportExcel。
- 会加载 mater 字典用于枚举展示。
- 原料接口设计较老，新增/删除中仍有 GET 请求接口，修改接口层时要保持兼容。

## 后端 API
- getAll => POST /raw/getAll
- getModel => DOWNLOAD /raw/getModel
- addMany => GET /raw/addMany
- deleteMany => GET /raw/removes
- add => GET /raw/add
- edit => POST /raw/alter

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
