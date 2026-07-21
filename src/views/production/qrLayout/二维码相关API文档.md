# 二维码相关 API 文档

## 1. 业务目标

二维码打印页面当前模板只保存在浏览器 `localStorage`，不能跨账号、跨电脑使用。

后端需要新增二维码模板保存能力：

- 模板保存到数据库。
- 支持“我的模板”和“公开模板”。
- 公开范围为系统内所有账号可见、可使用。
- 公开模板不允许其他人直接修改。
- 其他人需要使用公开模板时，只能复制成自己的模板后再编辑。

## 2. 数据库表设计

表名建议：`qr_layout_template`

```sql
CREATE TABLE qr_layout_template (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '模板ID',
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  template_json LONGTEXT NOT NULL COMMENT '模板JSON内容',
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' COMMENT '可见范围：private私有，public公开',
  owner_user_id BIGINT NOT NULL COMMENT '创建人用户ID',
  owner_user_name VARCHAR(100) DEFAULT NULL COMMENT '创建人名称',
  remark VARCHAR(255) DEFAULT NULL COMMENT '备注',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除：0否，1是',

  INDEX idx_owner_user_id (owner_user_id),
  INDEX idx_visibility (visibility),
  INDEX idx_create_time (create_time)
) COMMENT='二维码打印模板表';
```

字段说明：

- `template_json` 保存前端完整模板 JSON，后端不需要解析业务字段。
- `visibility = private` 表示只有创建人可见。
- `visibility = public` 表示所有账号可见。
- `deleted` 用于软删除。

同一个用户下模板名建议不重复：

```sql
CREATE UNIQUE INDEX uk_owner_name_deleted
ON qr_layout_template(owner_user_id, name, deleted);
```

## 3. 权限规则

查询规则：

- 我的模板：`owner_user_id = 当前登录用户`
- 公开模板：`visibility = public`
- 模板列表默认返回：我的模板 + 公开模板

修改规则：

- 只有模板创建人或管理员可以修改模板。
- 只有模板创建人或管理员可以删除模板。
- 只有模板创建人或管理员可以公开、取消公开模板。
- 所有登录用户都可以复制公开模板。

复制公开模板后：

- 新模板 `owner_user_id = 当前登录用户`。
- 新模板 `visibility = private`。
- `template_json` 内容复制原模板。
- 模板名建议默认：`原模板名_副本`。

## 4. 通用返回格式

如果项目已有统一返回格式，以项目现有格式为准。

建议格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 5. 接口列表

### 5.1 查询模板列表

`GET /api/qr-layout-template/list`

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| scope | string | 否 | `all` 全部、`mine` 我的、`public` 公开，默认 `all` |
| keyword | string | 否 | 按模板名称模糊查询 |
| pageNum | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 50 |

查询规则：

- `scope=mine` 只查当前用户创建的模板。
- `scope=public` 只查公开模板。
- `scope=all` 查当前用户创建的模板 + 公开模板。

返回示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "name": "50x30 汇流排标签",
        "visibility": "public",
        "ownerUserId": 1001,
        "ownerUserName": "张三",
        "remark": "",
        "createTime": "2026-05-07 10:00:00",
        "updateTime": "2026-05-07 10:30:00",
        "editable": true
      }
    ],
    "total": 1
  }
}
```

`editable` 由后端返回，前端用来判断是否显示编辑、删除、取消公开按钮。

### 5.2 查询模板详情

`GET /api/qr-layout-template/detail/{id}`

返回示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "50x30 汇流排标签",
    "templateJson": "{...}",
    "visibility": "public",
    "ownerUserId": 1001,
    "ownerUserName": "张三",
    "remark": "",
    "createTime": "2026-05-07 10:00:00",
    "updateTime": "2026-05-07 10:30:00",
    "editable": true
  }
}
```

### 5.3 新增模板

`POST /api/qr-layout-template/create`

请求体：

```json
{
  "name": "50x30 汇流排标签",
  "templateJson": "{...}",
  "visibility": "private",
  "remark": ""
}
```

说明：

- `visibility` 只允许 `private` 或 `public`。
- 如果不传，默认 `private`。
- `owner_user_id` 从当前登录用户获取，不允许前端传。

### 5.4 更新模板

`PUT /api/qr-layout-template/update/{id}`

请求体：

```json
{
  "name": "50x30 汇流排标签",
  "templateJson": "{...}",
  "remark": ""
}
```

权限：

- 只有创建人或管理员可以更新。

注意：

- 普通更新接口不建议修改 `visibility`。
- 公开和取消公开单独走接口。

### 5.5 删除模板

`DELETE /api/qr-layout-template/delete/{id}`

权限：

- 只有创建人或管理员可以删除。

处理方式：

```sql
UPDATE qr_layout_template SET deleted = 1 WHERE id = ?;
```

### 5.6 公开模板

`POST /api/qr-layout-template/publish/{id}`

权限：

- 只有创建人或管理员可以操作。

处理方式：

```sql
UPDATE qr_layout_template
SET visibility = 'public'
WHERE id = ?;
```

### 5.7 取消公开

`POST /api/qr-layout-template/unpublish/{id}`

权限：

- 只有创建人或管理员可以操作。

处理方式：

```sql
UPDATE qr_layout_template
SET visibility = 'private'
WHERE id = ?;
```

### 5.8 复制模板

`POST /api/qr-layout-template/copy/{id}`

请求体：

```json
{
  "name": "50x30 汇流排标签_副本"
}
```

规则：

- 可以复制公开模板。
- 可以复制自己的私有模板。
- 不允许复制别人的私有模板。
- 复制后的模板归当前登录用户。
- 复制后的模板固定为私有模板。

返回示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 2
  }
}
```

## 6. templateJson 内容说明

`templateJson` 保存前端完整 JSON 字符串，后端不需要解析。

示例结构：

```json
{
  "version": "2.0.0",
  "name": "企业二维码标签",
  "paper": {
    "name": "50 x 30",
    "width": 50,
    "height": 30
  },
  "elements": []
}
```

后端只负责保存、读取和权限控制。
