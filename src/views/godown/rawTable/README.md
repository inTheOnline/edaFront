# godown/rawTable 原料台账页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供原料台账/表格式原料列表查询。
- 支持查看、新增、编辑、导出模板。
- 页面比 raw 更偏台账视角，接口也走 raw/table 前缀。

## 技术实现
- 页面依旧采用 ProTable + UserDrawer + ImportExcel 的统一表格模式。
- 当前主要依赖 getTable 请求台账数据，导出接口使用 getTableModel。
- 如果以后要把 raw 与 rawTable 合并，先确认后端接口差异。

## 后端 API
- getTable => POST /raw/table/getTable
- getTableModel => DOWNLOAD /raw/table/getTableModel

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
