# godown/mater 物料资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供物料分页查询。
- 支持新增、查看、编辑、单个删除、批量删除、批量导入、导出。
- 支持价格变更弹窗，并通过权限点控制价格列显示与价格变更入口显示。
- 支持按项目、客户、物料编号、物料名称等字段查询。

## 技术实现
- 页面使用 authStore.isExistence 控制 price:look 权限。
- 物料、客户、项目等下拉依赖 dictStore.loadDicts。
- 新增/编辑走本目录 UserDrawer；批量价格调整走 BatchAddDialog。
- 删除逻辑分为批量删除 deleteMany 和单个删除 deleteMaterById 两套。
- 代码中误引入了 supWork.deleteById 但并未真正使用，修改时不要被误导。

## 后端 API
- getAll => POST /mater/getAll
- getModel => POST /mater/getModel（当前页面拿来做导出/模板）
- addMany => POST /mater/addMany
- addMater => POST /mater/add
- editMater => POST /mater/editMater
- deleteMany => POST /mater/deleteMany
- deleteMaterById => DELETE /mater/remove/{id}
- batchChangePriceApi => POST /mater/batchChangePrice（价格变更相关接口存在，实际由弹窗侧使用）
- getMap / getMapNum / getPriceMap => 物料映射相关接口

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
