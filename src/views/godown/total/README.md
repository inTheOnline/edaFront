# godown/total 库存汇总页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 展示仓库库存汇总列表。
- 支持新增、查看、编辑、导出等操作入口。
- 支持按客户、用户、物料、项目等字典信息筛选或显示。

## 技术实现
- 页面数据来源是 godown/flow 模块中的 getTotal，而不是单独的 total 模块。
- 页面模式与 flow、mater 等列表页一致。
- 如果后续要扩展库存预警、周转天数等能力，可继续在这个目录内演进。

## 后端 API
- getTotal => POST /godown/getTotal
- getModel => 如果从页面导出逻辑延伸，实际仍复用 flow/godown 相关导出方式

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
