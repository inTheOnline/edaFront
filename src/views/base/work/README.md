# base/work 工种基础资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供工种/岗位基础资料分页查询。
- 支持新增、查看、编辑、批量删除。
- 页面字段相对简单，主要用于下游模块字典引用。

## 技术实现
- 页面结构与客户、供应商基础资料页一致。
- 列表请求使用 getAllWork，抽屉组件负责表单录入。
- 编辑和新增都依赖 acceptParams 传入 api。

## 后端 API
- getAllWork => GET /work/getAll
- addWork => POST /work/add
- delectWorks => POST /work/removes

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
