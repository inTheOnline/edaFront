# 办公用品库存与领用

## 业务范围
- 页面仍使用原 buy/buyForm 路由，保留 ERP 公共菜单、头部、标签栏及底部。
- 使用系统 `--el-color-primary` 等主题变量，默认青绿色 #009688；不为用品添加装饰图标。
- 四个业务标签：用品库存、请购管理、采购入库、领用记录。
- 旧 office_purchase / office_purchase_record 都是测试数据；本次不删除、不迁入新库存，页面改用独立台账。

## 业务规则
- 行政统一采购，员工领用。一张请购或采购单可以包含多种用品。
- 直接发放：填写领取人、用途和用品数量；关联请购单选填。
- 关联发放：服务端以请购单确定领取人、用途和允许发放的用品；不允许超出剩余申请数量。
- 请购提交、标记待领取、采购下单都不改变、不预留库存。
- 实际到货入库才增加库存，实际确认发放才扣库存，支持分批入库、部分发放。
- 所有库存变动生成不可直接编辑或删除的流水，保留经办人、领取人、用途、数量、变动后库存及关联单据。
- 入库登记支持期初等无采购单入库，必须填写说明；正常采购到货从采购单进入登记。
- 请购可取消剩余数量，已发放记录和库存不回退。
- 已发生出入库的用品允许改名；规格和单位不可修改。历史记录关联用品 ID，统一显示最新名称。分类、位置和最低库存可以调整。

## 权限与通知
- 沿用 `buy:purchase` 作为行政采购、用品档案、入库、发放权限；前后端均校验。
- 普通员工可以查看用品库存，提交自己的请购，只能查看自己的请购和领用流水，不能查询采购金额。
- 页面待办和全局提醒共用 `officeNotice` store。App 挂载无布局的 OfficeNotice，公共导航外观不变。
- 已登录且具备采购权限的人员，每30秒获取待处理请购；可见页面收到新单时使用站内通知提醒，点击进入请购标签。
- 页面隐藏时暂停查询，退出登录时停止。通知仅为站内提示，不发送短信、邮件或外部消息。

## 文件与 API
- `index.vue`：ProTable 分页列表、功能标签、查询与操作入口。
- `components/SupplyDrawer.vue`：用品档案、请购、采购、入库及统一发放抽屉。
- `components/OfficeNotice.vue`：跨页面请领通知，不输出可见布局元素。
- `src/api/modules/buy/officeSupply.ts`：接口及类型。
- 后端：OfficeSupplyController / OfficeSupplyService，MyBatis-Plus Mapper，独立六张 office_* 表。
- `GET /officeSupply/options`、`GET /officeSupply/stock`、`POST /officeSupply/supply`。
- `GET /officeSupply/requests`、`POST /officeSupply/request`、`GET /officeSupply/request/{id}`。
- `POST /officeSupply/request/{id}/ready`、`POST /officeSupply/request/{id}/cancel`。
- `GET /officeSupply/orders`、`POST /officeSupply/order`、`GET /officeSupply/order/{id}`。
- `POST /officeSupply/receipt`、`POST /officeSupply/issue`、`GET /officeSupply/flows`。
- 所有分页保留后端总数，每页最多100条，不能用当前页长度替代总数。

## 上线顺序与验证
1. 在目标数据库执行后端 `sql/buy/20260911_office_supply.sql`，只创建新表。
2. 发布新后端，再发布前端。仅修改源码不会让已经运行的旧 jar 自动提供新接口。
3. 新增用品，通过实际期初入库建立库存，不根据旧测试单推算。
4. 核对人事角色已有 `buy:purchase` 权限以及原办公用品页面权限。
- 后端测试：`mvn -Dtest=OfficeSupplyMysqlTest -Doffice.mysql=true test`。仅限配置指向本机 MySQL；自动创建、清理隔离测试库，不写入 eda_erp 库。
- 覆盖直接与关联发放、部分发放、分批入库、超量拒绝、权限、分页总数、事务回滚和并发防超发。
- 前端：Vite 打包、vue-tsc 检查；仓库其他模块已有类型错误需单独处理。
- `tmp/office-preview` 为使用真实页面组件和示例接口的独立交互验证工具，不是业务数据，也不是生产入口。

- 请购管理和采购入库的状态搜索支持多选，通过逗号分隔状态请求后端 IN 查询。

## 2026-09-15 调整
- 采购列表“更多”提供编辑、删除，仅待入库单据显示；后端同步禁止部分入库和已入库单据编辑、删除。删除有确认提示，保留数据库记录。
- 接口：`POST /officeSupply/order/{id}/edit`、`POST /officeSupply/order/{id}/delete`。编辑复用采购抽屉。
- 采购单价支持三位小数，明细金额、合计及列表金额统一显示三位小数。
- 新建请购的用品选择和数量并排一行；办公用品抽屉所有数字输入移除加减按钮，数字右对齐。
- 先执行后端 `sql/buy/20260915_office_supply.sql`，再发布前后端。
