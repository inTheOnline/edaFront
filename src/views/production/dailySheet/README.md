# production/dailySheet 生产日报/生产记录页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供生产记录分页查询。
- 支持新增、查看、编辑、单个删除、批量删除、批量导入、批量添加、导出。
- 支持按日期区间、产品、工序、机器、操作员、工时、数量、不良数、备注等字段筛选。
- 支持表格行点击选择、当页全选、取消选择，并实时汇总选中记录的数量与工时总计。

## 技术实现
- 页面核心是 ProTable + ProductionDrawer + BatchAddDialog + ImportExcel。
- 使用 virtualized 和固定 table-height，说明数据量可能较大。
- 通过 computed selectedList 计算 numnberTotal 和 timeTotal，避免 watch 过重。
- 打开抽屉时会把 materialList 和 staffList 一并传入。
- 页面代码质量相对较新，批量操作、总计显示、导入导出组织得比较完整。

## 后端 API
- getProductionAll => POST /production/getAll
- addProduction => POST /production/add
- editProduction => PUT /production/edit
- deleteProduction => DELETE /production/delete/{id}
- deleteManyProduction => POST /production/deleteBatch
- getProductionModel => GET /production/exportModel
- addManyProduction => POST /production/importBatch
- addBatchApi => POST /production/addBatch
- getProductionMap => GET /production/getIdMap
- getMapNum => GET /mater/getMapNum

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
