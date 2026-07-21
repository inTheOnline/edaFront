# buy/buyForm 办公用品请购页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供办公用品请购单分页查询与状态跟踪。
- 页面视觉升级为「请购记录工作台」：支持卡片视图和列表视图切换，卡片视图包含顶部统计、状态看板、待办项和最近动态，列表视图保留 ProTable 明细表。
- 支持申请请购、编辑、查看、审核通过、驳回、采购录入（单条/批量）、领取完成、取消。
- 卡片视图内每条记录也提供与列表一致的操作按钮，并支持本页多选、批量采购录入和批量删除。
- 支持加急请购（fast），驳回理由展示（rejectReason）。
- 按业务权限控制按钮显示：
  - `buy:apply:assist` 代请购
  - `buy:purchase` 采购录入
  - `buy:audit` 审核
  - `buy:view:all` 查看全部

## 技术实现
- 页面核心：`ProTable + PurchaseDrawer + PurchaseRecordDialog + BatchPurchaseDialog`。
- `PurchaseDrawer` 新增 `fast` 并隐藏 `userId`，提交时由前端强制写当前登录用户。
- 无代请购权限时，前端锁定 `applyUserId=当前用户`。
- 列表状态统一使用：`待审核/已驳回/待采购/已采购/已完成/已取消`。
- 看板、统计、时间轴都基于当前表格数据回调生成；待办项优先读取 `getPurchaseTodo`，接口异常时用当前列表数据兜底。
- 最近动态和状态看板统一按请购状态显示颜色。

## 后端 API
- 现有：
  - `getPurchaseList` => `POST /officePurchase/getAll`
  - `addPurchase` => `POST /officePurchase/add`
  - `updatePurchase` => `PUT /officePurchase/edit`
  - `deleteBatchPurchase` => `POST /officePurchase/deleteBatch`
  - `deletePurchase` => `DELETE /officePurchase/delete/{id}`
- 新增联调（待后端提供）：
  - `passPurchase` => `POST /officePurchase/audit/pass`
  - `rejectPurchase` => `POST /officePurchase/audit/reject`
  - `cancelPurchase` => `POST /officePurchase/cancel`
  - `receivePurchase` => `POST /officePurchase/receive`
  - `addPurchaseRecord` => `POST /officePurchaseRecord/add`
  - `addBatchPurchaseRecordByPurchaseIds` => `POST /officePurchaseRecord/addBatchByPurchaseIds`
  - `getPurchaseTodo` => `GET /officePurchase/todo`

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中。
- 新增/查看/编辑通过抽屉，采购录入通过弹窗。
- 字典数据优先走 `dictStore.loadDicts`，本页申请人与操作人都按 `user` 字典映射。
- 两种视图需要保持功能独立，新增操作按钮时要同步评估卡片视图和列表视图。
- 修改后如变更接口、状态流转、权限点，需同步更新本 README。
