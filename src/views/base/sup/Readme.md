# base/sup 供应商基础资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供供应商分页查询。
- 支持新增、查看、编辑、批量删除供应商。
- 支持按供应商名称搜索，并显示状态、备注、工种等基础信息。

## 技术实现
- 页面结构与 base/cust、base/work 一致，属于同一套基础资料表格页风格。
- onMounted 中会加载 work 字典，说明供应商页面会引用岗位/工种类枚举。
- 抽屉组件位于 components/UserDrawer.vue。
- 仓库里原来已有一个 Readme.md，只写了一句概述；后续以当前 README.md 为主维护。

## 后端 API
- getAllSup => POST /sup/getAll
- addSup => POST /sup/add
- delectSups => POST /sup/delectList
- alterSup => POST /sup/alter（接口存在，通常用于编辑）
- getIdMap => GET /sup/getMap
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
