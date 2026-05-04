# buyForm 联调后端补充修正项（第二轮）

> 说明：本清单是根据当前前端代码与后端实现逐项对照后得到的“建议必改项/高优先级项”。

## 1. 高优先级：采购日期格式兼容

### 现状
- `OfficePurchaseRecord` 与 `OfficePurchaseRecordBatchAddRequest.RecordData` 的 `buyDate` 是 `LocalDateTime`。
- 前端目前已改为发送 `YYYY-MM-DDTHH:mm:ss`（ISO）格式。
- 若后端未来接收到 `YYYY-MM-DD HH:mm:ss`（空格格式），默认 Jackson 可能解析失败。

### 建议
- 给 `buyDate` 增加 `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")`。
- 如果要兼容空格格式，建议统一在 DTO 层做自定义反序列化或补充 `@JsonFormat` 与全局转换器。

---

## 2. 高优先级：删除接口缺少权限/归属校验

### 现状
- `OfficePurchaseService.deleteOne/deleteBatch` 直接删除，没有校验：
  - 是否具备删除权限
  - 是否为请购人/操作人
  - 是否允许删除当前状态

### 风险
- 只要拿到 ID，理论上可删除非本人记录（前端隐藏按钮不能替代后端鉴权）。

### 建议
- 至少补其中一条：
  1. 仅 `apply_user_id == me` 或 `user_id == me` 可删；
  2. 或引入独立权限键（例如 `buy:delete`）后再允许删。
- 并限制状态（例如已完成不允许删）。

---

## 3. 高优先级：采购明细查询缺少归属校验

### 现状
- `OfficePurchaseRecordService.listByPurchaseId` 仅按 `purchaseId` 查明细，无当前用户可见性限制。

### 风险
- 任意登录用户若知道 `purchaseId`，可读取他人采购明细。

### 建议
- 查主单后复用可见性规则：
  - 有 `buy:view:all` -> 可查
  - 无 -> 仅 `apply_user_id = me` 或 `user_id = me` 可查

---

## 4. 中优先级：列表筛选能力与前端字段对齐

### 现状
- `pageQuery` 使用 `QueryWrapperUtil.buildLikeWrapper(queryData)`，对全部字段执行 `like`。
- 数值/状态字段（如 `fast`、`status`）更适合 `eq`，日期区间更适合 `between`。

### 建议
- 对 `status/fast/applyUserId/userId` 使用 `eq`。
- 对 `createdTime`、`expectedDate` 支持区间筛选（前端已有时间筛选入口）。
- 否则前端看起来有筛选控件，但命中效果会不稳定。

---

## 5. 中优先级：待办接口可返回权限标识，减少前端猜测

### 现状
- `/officePurchase/todo` 返回 `auditTodo/purchaseTodo` 两组。

### 建议
- 可附带：
  - `canAudit`
  - `canPurchase`
  - `canViewAll`
- 便于前端一次性决定展示哪些模块，减少二次判断。

---

## 6. 建议验证用例（后端自测）

1. 无 `buy:view:all` 用户：
- `getAll` 仅返回本人相关记录。
- `listByPurchaseId` 无法查看无关记录。

2. 无 `buy:apply:assist` 用户：
- `add/edit` 时强制 `apply_user_id = currentUserId`。

3. 删除接口：
- 非本人或无权限时拒绝。

4. 采购录入：
- `buyDate` 对 `2026-04-28T10:00:00` 能正确解析。

5. 状态流转：
- `已采购 -> 已完成` 允许。
- `已采购/已完成 -> 已取消` 拒绝。

---

## 7. 当前前端已完成的兼容处理（供后端参考）
- 采购日期已统一发送 ISO：`YYYY-MM-DDTHH:mm:ss`。
- 驳回弹窗取消操作已做前端容错，不再抛前端异常。
- 所有新接口路径已接入并可访问（未登录时返回 401，路由存在）。
