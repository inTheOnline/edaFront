# outgoing 接口文档（拟定版，确认后再落代码）

本文件用于前后端对齐。当前以本文件为后续实现目标。  
本次先更新文档，不改后端实现代码。

## 1. 通用约定

1. 状态码统一为数字型 `number`。  
2. 委外状态：
- `101`：初始状态
- `201`：部分完成
- `901`：完成状态
- `999`：作废状态
3. 回执状态：
- `101`：草稿
- `901`：已提交
- `999`：已作废
4. 响应统一包裹在 `Result.data`。  
5. 逻辑删除一律改 `deleted` 字段，不使用“置 999”表示删除。  
6. 主键命名统一 `id`，外键统一 `xxx_id`，Java 使用驼峰。

---

## 2. 外发表 `outform`（一行 = 一条 `out_item`）

### 2.1 业务定义

- `outform` 每条记录对应 `out_item` 一条行数据。
- `state` 使用 `out_item.state`。
- 页面只展示行备注 `remark`。
- 新增/编辑支持两个备注：
- `subcRemark`：委外单备注（`subcontract.remark`）
- `remark`：行备注（`out_item.remark`）
- 删除时如果存在关联回执，前端先提示，用户确认后再调用删除接口。
- 一旦调用删除接口，后端执行联动逻辑删除（见 `2.6`）。

### 2.2 列表分页

- Method: `POST`
- URL: `/outgoing/outform/page`

请求示例：

```json
{
  "pageNum": 1,
  "pageSize": 20,
  "subcId": 1001,
  "subcNum": "WF2026042301",
  "supId": 1,
  "materId": 11,
  "materNum": "M-001",
  "materName": "连接片",
  "state": 101,
  "subcDate": ["2026-04-01", "2026-04-30"]
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "records": [
      {
        "id": 5001,
        "subcId": 1001,
        "subcDate": "2026-04-23",
        "subcNum": "WF2026042301",
        "supId": 1,
        "supName": "华东精密",
        "materId": 11,
        "materNum": "M-001",
        "materName": "连接片",
        "number": 260.0,
        "backNumber": 120.0,
        "notbackNumber": 140.0,
        "state": 201,
        "stateLabel": "部分回执",
        "stateTagType": "warning",
        "subcRemark": "整单备注",
        "remark": "行备注"
      }
    ],
    "total": 1,
    "size": 20,
    "current": 1
  }
}
```

### 2.3 新增

- Method: `POST`
- URL: `/outgoing/outform/create`

请求示例：

```json
{
  "subcId": null,
  "subcDate": "2026-04-23",
  "subcNum": "WF2026042301",
  "supId": 1,
  "subcRemark": "整单备注",
  "materId": 11,
  "materNum": "M-001",
  "number": 200.0,
  "state": 101,
  "remark": "行备注"
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "id": 5008,
    "subcId": 1003,
    "subcDate": "2026-04-23",
    "subcNum": "WF2026042301",
    "supId": 1,
    "supName": "华东精密",
    "materId": 11,
    "materNum": "M-001",
    "materName": "连接片",
    "number": 200.0,
    "backNumber": 0.0,
    "notbackNumber": 200.0,
    "state": 101,
    "stateLabel": "初始状态",
    "stateTagType": "info",
    "subcRemark": "整单备注",
    "remark": "行备注"
  }
}
```

规则：

- 若未传 `subcId`，后端先创建 `subcontract`，再创建 `out_item`。
- `materId`、`materNum` 至少传一个。
- 两者都传时优先 `materId`。

### 2.4 编辑

- Method: `PUT`
- URL: `/outgoing/outform/update`

请求示例：

```json
{
  "id": 5008,
  "subcId": 1003,
  "subcDate": "2026-04-24",
  "subcNum": "WF2026042301",
  "supId": 1,
  "subcRemark": "整单备注-更新",
  "materId": 11,
  "number": 220.0,
  "state": 201,
  "remark": "行备注-更新"
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": null
}
```

规则：

- `id` 必传，且是 `out_item.id`。
- 若编辑时改了 `subcDate/subcNum/supId/subcRemark`，后端同步更新所属 `subcontract` 表头。
- `state` 写入 `out_item.state`。

### 2.5 删除前查询关联回执（新增）

- Method: `POST`
- URL: `/outgoing/outform/related-outback`

用途：

- 前端删除 `outform` 前先调用本接口，提示用户“该外发 item 关联了哪些回执明细”。

请求示例：

```json
{
  "outItemId": 5001
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "outItemId": 5001,
    "total": 2,
    "records": [
      {
        "outbackItemId": 9001,
        "outbackId": 8001,
        "outbackNum": "OB2026042301",
        "backDate": "2026-04-23",
        "number": 40.0,
        "state": 901,
        "stateLabel": "已提交",
        "remark": "首批回执"
      },
      {
        "outbackItemId": 9007,
        "outbackId": 8002,
        "outbackNum": "OB2026042401",
        "backDate": "2026-04-24",
        "number": 80.0,
        "state": 101,
        "stateLabel": "草稿",
        "remark": "补单"
      }
    ]
  }
}
```

### 2.6 删除（确认后执行联动）

- Method: `POST`
- URL: `/outgoing/outform/delete`

请求示例：

```json
{
  "ids": [5001, 5002]
}
```

返回示例：

```json
{
  "code": "200",
  "message": "删除成功",
  "data": null
}
```

删除规则：

- `ids` 为 `out_item.id` 列表。
- 逻辑删除对应 `out_item`：`deleted = 1`。
- 若某个 `out_item` 有关联 `outback_item`：
- 联动逻辑删除这些 `outback_item`：`deleted = 1`。
- 若对应 `outback` 删除后无有效明细，联动逻辑删除该 `outback`：`deleted = 1`。
- 若某个 `subcontract` 删除后无有效 `out_item`，联动逻辑删除该 `subcontract`：`deleted = 1`。
- 涉及回执数量变化时，必须调用 `OutService.renewNumber` 刷新对应 `out_item.backNumber`。

### 2.7 状态字典

- Method: `GET`
- URL: `/outgoing/getOutItem_state`

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "stateCode": 101,
      "stateName": "初始状态",
      "tagType": "info"
    },
    {
      "stateCode": 201,
      "stateName": "部分完成",
      "tagType": "warning"
    },
    {
      "stateCode": 901,
      "stateName": "完成状态",
      "tagType": "success"
    },
    {
      "stateCode": 999,
      "stateName": "作废状态",
      "tagType": "danger"
    }
  ]
}
```

---

## 3. 外发回执 `outback`（一行 = 一条 `outback_item`）

### 3.1 业务定义

- `outback` 与 `outform` 同结构思路：列表每行是 `outback_item`。
- 回执表头在 `outback`，明细在 `outback_item`。
- `state` 使用 `outback.state`。
- 行备注使用 `outback_item.remark`。
- 表头备注使用 `outback.remark`（DTO 命名为 `outbackRemark`）。
- 所有引起回执数量变动的操作（新增/编辑/删除）都必须调用 `OutService.renewNumber`。

### 3.2 列表分页（新增）

- Method: `POST`
- URL: `/outgoing/outback/page`

请求示例：

```json
{
  "pageNum": 1,
  "pageSize": 20,
  "id": 9001,
  "outbackId": 8001,
  "outbackNum": "OB2026042301",
  "backDate": ["2026-04-01", "2026-04-30"],
  "supId": 1,
  "outItemId": 5001,
  "materId": 11,
  "materNum": "M-001",
  "materName": "连接片",
  "state": 901
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "records": [
      {
        "id": 9001,
        "outbackId": 8001,
        "outbackNum": "OB2026042301",
        "backDate": "2026-04-23",
        "supId": 1,
        "supName": "华东精密",
        "outItemId": 5001,
        "subcId": 1001,
        "subcNum": "WF2026042301",
        "materId": 11,
        "materNum": "M-001",
        "materName": "连接片",
        "number": 40.0,
        "state": 901,
        "stateLabel": "已提交",
        "stateTagType": "success",
        "outbackRemark": "整单回执备注",
        "remark": "行备注"
      }
    ],
    "total": 1,
    "size": 20,
    "current": 1
  }
}
```

### 3.3 新增（新增）

- Method: `POST`
- URL: `/outgoing/outback/create`

请求示例：

```json
{
  "outbackId": null,
  "outbackNum": "OB2026042501",
  "backDate": "2026-04-25",
  "supId": 1,
  "state": 101,
  "outbackRemark": "整单回执备注",
  "outItemId": 5008,
  "number": 50.0,
  "remark": "回执行备注"
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "id": 9012,
    "outbackId": 8010,
    "outbackNum": "OB2026042501",
    "backDate": "2026-04-25",
    "supId": 1,
    "supName": "华东精密",
    "outItemId": 5008,
    "subcId": 1003,
    "subcNum": "WF2026042301",
    "materId": 11,
    "materNum": "M-001",
    "materName": "连接片",
    "number": 50.0,
    "state": 101,
    "stateLabel": "草稿",
    "stateTagType": "info",
    "outbackRemark": "整单回执备注",
    "remark": "回执行备注"
  }
}
```

规则：

- `outItemId` 必传。
- 若未传 `outbackId`，后端先创建 `outback`，再创建 `outback_item`。
- 若传了 `outbackId`，直接挂载到已有 `outback`。
- 新增成功后，调用 `OutService.renewNumber(outItemId)`。

### 3.4 编辑（新增）

- Method: `PUT`
- URL: `/outgoing/outback/update`

请求示例：

```json
{
  "id": 9012,
  "outbackId": 8010,
  "outbackNum": "OB2026042501",
  "backDate": "2026-04-26",
  "supId": 1,
  "state": 901,
  "outbackRemark": "整单回执备注-更新",
  "outItemId": 5008,
  "number": 55.0,
  "remark": "回执行备注-更新"
}
```

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": null
}
```

规则：

- `id` 必传，且是 `outback_item.id`。
- 若编辑中改了 `outbackNum/backDate/supId/outbackRemark/state`，后端同步更新所属 `outback`。
- 若改了 `outItemId/number`，需要对新旧 `outItemId` 都执行 `renewNumber`。

### 3.5 删除（新增）

- Method: `POST`
- URL: `/outgoing/outback/delete`

请求示例：

```json
{
  "ids": [9012, 9013]
}
```

返回示例：

```json
{
  "code": "200",
  "message": "删除成功",
  "data": null
}
```

删除规则：

- `ids` 为 `outback_item.id` 列表。
- 逻辑删除对应 `outback_item`：`deleted = 1`。
- 若某个 `outback` 删除后无有效明细，逻辑删除该 `outback`：`deleted = 1`。
- 对受影响 `out_item` 调用 `renewNumber`。

### 3.6 状态字典（新增）

- Method: `GET`
- URL: `/outgoing/getOutback_state`

返回示例：

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "stateCode": 101,
      "stateName": "草稿",
      "tagType": "info"
    },
    {
      "stateCode": 901,
      "stateName": "已提交",
      "tagType": "success"
    },
    {
      "stateCode": 999,
      "stateName": "已作废",
      "tagType": "danger"
    }
  ]
}
```

---

## 4. 数量刷新规则 `renewNumber`（新增约定）

### 4.1 位置

- 方法名：`renewNumber`
- 所属：`OutService`

### 4.2 作用

- 根据 `outback_item` 实时重算并回写 `out_item.back_number`。
- `notbackNumber` 不落库，在查询时计算：`out_item.number - out_item.back_number`。

### 4.3 触发点

- `outback/create`
- `outback/update`
- `outback/delete`
- `outform/delete` 中联动删除 `outback_item` 时

---

## 5. 兼容旧接口（保留）

当前已存在的兼容路由继续保留：

- `POST /outgoing/addOutform` = `/outgoing/outform/create`
- `POST /outgoing/outform/edit` = `/outgoing/outform/update`
- `POST /outgoing/deleteList` = `/outgoing/outform/delete`
- `GET /outgoing/outform/all` = 老分页入口

---

## 6. 数据可视化说明

本次不改数据可视化接口，保持现状。
