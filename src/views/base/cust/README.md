# base/cust 客户基础资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供客户分页查询。
- 支持新增、查看、编辑、单个删除客户。
- 支持按客户名称搜索，并显示客户状态、备注等基础字段。

## 技术实现
- 页面核心是 ProTable + UserDrawer 组合。
- 列表请求通过 getAllCust，dataCallback 将后端 records/total 转成表格需要的 list/total。
- onMounted 中会先加载 state 字典，抽屉打开时把 stateEnum 传给子组件。
- 编辑入口已经预留 editCust，但当前实现仍是占位逻辑。

## 后端 API
- getAllCust => GET /cust/getAll
- addCust => POST /cust/add
- delectCusts => POST /cust/delectList（页面里保留了批量删除方法，但表头当前未暴露批量删除按钮）
- deleteCust => DELETE /cust/delete/{id}
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
