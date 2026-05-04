# buyForm 后端改造说明（请直接按此联调）

## 1. 改造目标
- `office_purchase` 从 `uphold + status` 改为仅 `status` 状态机。
- 用户外键统一改为 `user`：
  - `apply_user_id`：请购对象（给谁请）
  - `user_id`：操作人（谁提交/代请）
- 增加 `fast`（是否加急）与 `reject_reason`（驳回理由）。
- 增加分批采购明细表 `office_purchase_record`。
- 权限和待办由后端统一判断，前端仅展示接口返回结果。

## 2. 已确认业务规则
### 2.1 权限键
- `buy:apply:assist`：代请购
- `buy:purchase`：采购录入
- `buy:audit`：审核
- `buy:view:all`：查看全部请购记录

### 2.2 可见范围
- 有 `buy:view:all`：可看全部。
- 无 `buy:view:all`：仅可看与自己相关记录（`apply_user_id = me` 或 `user_id = me`）。

### 2.3 提交流程
- `apply_user_id` 默认当前用户。
- 无 `buy:apply:assist` 时，后端必须强制 `apply_user_id = currentUserId`。
- `user_id` 始终写当前登录用户 ID。

### 2.4 状态集合
- `待审核`
- `已驳回`
- `待采购`
- `已采购`
- `已完成`
- `已取消`

### 2.5 状态流转
- 新建：
  - 有 `buy:audit` -> `待采购`
  - 无 `buy:audit` -> `待审核`
- 审核通过：`待审核/已驳回 -> 待采购`
- 审核驳回：`待审核/待采购 -> 已驳回`（驳回理由可空）
- 采购录入：新增任意采购记录后，主单改为 `已采购`
- 完成：仅 `已采购 -> 已完成`
- 取消：仅 `待审核/已驳回/待采购 -> 已取消`
- 禁止：`已采购 -> 已取消`、`已完成 -> 已取消`、非 `已采购 -> 已完成`

### 2.6 领取/取消权限
- 仅 `apply_user_id == currentUserId` 或 `user_id == currentUserId` 可以取消或领取。

### 2.7 未审核先采购
- 允许未审核先采购，但操作者必须同时具备：
  - `buy:purchase`
  - `buy:audit`

## 3. 数据库改造建议
> 请先备份 `office_purchase`、`user`、`staff`。

### 3.1 office_purchase 结构调整
- 删除列：`uphold`
- 新增列：
  - `user_id INT NOT NULL`（操作人，外键 user.id）
  - `fast TINYINT(1) NOT NULL DEFAULT 0`（是否加急）
  - `reject_reason VARCHAR(255) NULL`（驳回理由）
- `apply_user_id` 外键从 `staff.id` 改为 `user.id`
- 补索引：`apply_user_id`、`user_id`、`status`、`created_time`

### 3.2 新增采购分批记录表
建议表名：`office_purchase_record`

字段：
- `id` PK
- `office_purchase_id` FK -> `office_purchase.id`
- `platform`（淘宝/京东/拼多多）
- `link`
- `unit_price`
- `number`
- `amount`
- `buy_date`
- `remark`
- `user_id` FK -> `user.id`
- `created_time`

### 3.3 数据迁移注意
- 若历史 `apply_user_id` 来自 `staff.id`，请先做 staff->user 映射后再切换外键。
- `user_id` 历史数据建议先回填为 `apply_user_id` 对应用户。

## 4. SQL 参考（按实际库名/外键名微调）
```sql
-- 1) office_purchase 增字段
ALTER TABLE office_purchase
  ADD COLUMN user_id INT NULL COMMENT '操作人ID(关联user.id)' AFTER apply_user_id,
  ADD COLUMN fast TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否加急:0否1是' AFTER expected_date,
  ADD COLUMN reject_reason VARCHAR(255) NULL COMMENT '驳回理由' AFTER remark;

-- 2) 删除旧外键（按实际名字）
ALTER TABLE office_purchase DROP FOREIGN KEY fk_apply_user;

-- 3) 删除 uphold
ALTER TABLE office_purchase DROP COLUMN uphold;

-- 4) 新增索引
CREATE INDEX idx_office_purchase_apply_user_id ON office_purchase(apply_user_id);
CREATE INDEX idx_office_purchase_user_id ON office_purchase(user_id);
CREATE INDEX idx_office_purchase_status ON office_purchase(status);
CREATE INDEX idx_office_purchase_created_time ON office_purchase(created_time);

-- 5) 新建采购记录表
CREATE TABLE IF NOT EXISTS office_purchase_record (
  id INT NOT NULL AUTO_INCREMENT COMMENT '主键',
  office_purchase_id INT NOT NULL COMMENT '请购主单ID',
  platform VARCHAR(32) NOT NULL COMMENT '平台:淘宝/京东/拼多多',
  link VARCHAR(500) NULL COMMENT '采购链接',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单价',
  number DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '采购数量',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '采购金额',
  buy_date DATETIME NOT NULL COMMENT '采购日期',
  remark VARCHAR(255) NULL COMMENT '备注',
  user_id INT NOT NULL COMMENT '操作人ID(关联user.id)',
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_opr_purchase_id (office_purchase_id),
  KEY idx_opr_user_id (user_id),
  KEY idx_opr_buy_date (buy_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='办公请购采购分批记录表';

-- 6) 回填 user_id（示例）
UPDATE office_purchase SET user_id = apply_user_id WHERE user_id IS NULL;

-- 7) 设非空
ALTER TABLE office_purchase MODIFY COLUMN user_id INT NOT NULL;

-- 8) 重建外键到 user
ALTER TABLE office_purchase
  ADD CONSTRAINT fk_office_purchase_apply_user FOREIGN KEY (apply_user_id) REFERENCES user(id),
  ADD CONSTRAINT fk_office_purchase_user FOREIGN KEY (user_id) REFERENCES user(id);

ALTER TABLE office_purchase_record
  ADD CONSTRAINT fk_opr_purchase FOREIGN KEY (office_purchase_id) REFERENCES office_purchase(id),
  ADD CONSTRAINT fk_opr_user FOREIGN KEY (user_id) REFERENCES user(id);
```

## 5. 后端代码改造点
### 5.1 现有模块改造
- `entity/buy/OfficePurchase.java`
  - 删 `uphold`
  - 加 `userId`、`fast`、`rejectReason`
- `controller/buy/OfficePurchaseController.java`
  - 增审核/取消/领取接口
  - `getAll` 支持权限过滤
- `service/buy/OfficePurchaseService.java`
  - 修复 `add()` 当前未真正 `save` 的问题
  - 统一状态流转校验

### 5.2 新增模块
- `entity/buy/OfficePurchaseRecord.java`
- `mapper/buy/OfficePurchaseRecordMapper.java`
- `service/buy/OfficePurchaseRecordService.java`
- `controller/buy/OfficePurchaseRecordController.java`

## 6. 接口建议
### 6.1 保留并增强
- `POST /officePurchase/getAll`
- `POST /officePurchase/add`
- `PUT /officePurchase/edit`

### 6.2 新增
- `POST /officePurchase/audit/pass`
- `POST /officePurchase/audit/reject`
- `POST /officePurchase/cancel`
- `POST /officePurchase/receive`
- `POST /officePurchaseRecord/add`
- `POST /officePurchaseRecord/addBatchByPurchaseIds`
- `GET /officePurchaseRecord/listByPurchaseId`
- `GET /officePurchase/todo`

## 7. 核心后端校验规则
1. `buy:view:all`
- 有：看全部
- 无：仅 `apply_user_id = me OR user_id = me`

2. `buy:apply:assist`
- 无：强制 `apply_user_id = me`

3. `buy:audit`
- 无：不可审核通过/驳回

4. `buy:purchase`
- 无：不可新增采购记录

5. 未审核先采购
- 必须同时有 `buy:purchase` 和 `buy:audit`

6. 取消/领取操作者
- 仅 `apply_user_id == me` 或 `user_id == me`

## 8. 待办接口口径（后端计算）
- 有 `buy:audit`：返回审核待办（状态 `待审核`）
- 有 `buy:purchase`：返回采购待办（状态 `待采购`）
- 都有：两类都返回，并带分类字段

推荐返回：
```json
{
  "auditTodo": { "count": 3, "records": [] },
  "purchaseTodo": { "count": 5, "records": [] }
}
```

## 9. 旧表清理建议
- `shopping` / `shopping_raw` / `buy` / `buy_need` 如无调用，建议清理。
- 先全局扫描 Controller/Service/Mapper/XML 引用，再执行 drop。

## 10. 联调验收清单
1. 无 `buy:apply:assist` 用户无法代请购（后端强制覆盖）。
2. `buy:view:all` 生效：有权限看全量，无权限仅相关数据。
3. 状态流转严格按规则执行。
4. 新增采购记录后主单自动变 `已采购`。
5. `已采购` 可完成不可取消。
6. `已完成` 不可取消。
7. `待审核/已驳回/待采购` 可取消。
8. 待办接口按权限正确返回。
