# base/project 项目基础资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供项目分页查询。
- 支持新增、查看、编辑、批量删除、单个删除项目。
- 支持展开行查看项目关联的物料清单。
- 支持按项目名称、客户进行搜索。

## 技术实现
- 页面使用 ProTable 的 expand 插槽展示 scope.row.maters。
- 客户下拉通过 getIdMap 提供 enum，状态通过 getStateApi 显示标签。
- 打开抽屉时会把客户映射 custMapList 传给子组件。
- 当前 editProject 仍是占位实现，真实编辑依赖抽屉 api 注入。

## 后端 API
- getAllProject => POST /project/getAll
- addProject => POST /project/add
- delectProjects => POST /project/removes
- getMaters => POST /project/getMasters/Byid（模块接口已存在，当前页主要使用后端返回的 maters 展开字段）
- getIdMap => GET /cust/getIdMap
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
