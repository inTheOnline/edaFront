# 外发首页接口文档

本文档只描述 `src/views/outgoing/index.vue` 外发首页需要的接口，供后端实现看板数据使用。

当前首页包含：
- 顶部 4 个统计卡片
- 近 7 天外发 / 回执趋势折线图
- 供应商待回执排行柱状图
- 工具弹窗里的最近工具动态
- 供应商扣款、供应商报价导入工具入口

## 1. 通用约定

### 1.1 响应格式

所有 JSON 接口统一返回：

```json
{
  "code": "200",
  "message": "success",
  "data": {}
}
```

失败示例：

```json
{
  "code": "500",
  "message": "查询外发首页数据失败",
  "data": null
}
```

### 1.2 日期格式

- 日期：`YYYY-MM-DD`
- 日期时间：`YYYY-MM-DD HH:mm:ss`
- 首页默认按服务器当前日期所在月份统计。

### 1.3 数量字段

- 所有数量返回 `number`。
- 前端展示时会自己格式化，不要返回 `"1,200"` 这种带逗号的字符串。
- `notbackNumber` 含义：待回执数量，计算规则为 `外发数量 - 已回执数量`，小于 0 时按 0 返回。

---

## 2. 首页聚合接口

### 2.1 基本信息

- Method: `POST`
- URL: `/outgoing/home/summary`
- Content-Type: `application/json`
- 用途：一次性返回外发首页所需全部看板数据。

### 2.2 请求参数

```json
{
  "month": "2026-05",
  "trendDays": 7,
  "rankLimit": 8
}
```

字段说明：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `month` | string | 否 | 当前月份 | 顶部统计卡片的统计月份，格式 `YYYY-MM` |
| `trendDays` | number | 否 | 7 | 趋势图天数，当前首页使用 7 |
| `rankLimit` | number | 否 | 8 | 供应商排行数量 |

### 2.3 返回示例

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "cards": [
      {
        "key": "monthIssueQty",
        "label": "本月外发数量",
        "value": 1710,
        "displayValue": "1710",
        "delta": "+12.4%",
        "deltaValue": 12.4,
        "deltaDirection": "up",
        "tone": "blue"
      },
      {
        "key": "monthReceiptQty",
        "label": "本月回执数量",
        "value": 695,
        "displayValue": "695",
        "delta": "+8.1%",
        "deltaValue": 8.1,
        "deltaDirection": "up",
        "tone": "green"
      },
      {
        "key": "pendingReceiptQty",
        "label": "待回执数量",
        "value": 1015,
        "displayValue": "1015",
        "delta": "-5.6%",
        "deltaValue": -5.6,
        "deltaDirection": "down",
        "tone": "orange"
      },
      {
        "key": "activeSupplierCount",
        "label": "活跃供应商",
        "value": 4,
        "displayValue": "4",
        "delta": "+2",
        "deltaValue": 2,
        "deltaDirection": "up",
        "tone": "red"
      }
    ],
    "trend": [
      {
        "date": "05-02",
        "fullDate": "2026-05-02",
        "issueCount": 80,
        "receiptCount": 65
      },
      {
        "date": "05-03",
        "fullDate": "2026-05-03",
        "issueCount": 98,
        "receiptCount": 80
      },
      {
        "date": "05-04",
        "fullDate": "2026-05-04",
        "issueCount": 116,
        "receiptCount": 95
      },
      {
        "date": "05-05",
        "fullDate": "2026-05-05",
        "issueCount": 134,
        "receiptCount": 110
      },
      {
        "date": "05-06",
        "fullDate": "2026-05-06",
        "issueCount": 152,
        "receiptCount": 125
      },
      {
        "date": "05-07",
        "fullDate": "2026-05-07",
        "issueCount": 170,
        "receiptCount": 140
      },
      {
        "date": "05-08",
        "fullDate": "2026-05-08",
        "issueCount": 188,
        "receiptCount": 155
      }
    ],
    "supplierRank": [
      {
        "supId": 1,
        "supName": "华东精密",
        "pendingQty": 740,
        "pendingItemCount": 2,
        "lastSubcDate": "2026-05-08"
      },
      {
        "supId": 2,
        "supName": "诚宇加工",
        "pendingQty": 180,
        "pendingItemCount": 1,
        "lastSubcDate": "2026-05-07"
      },
      {
        "supId": 4,
        "supName": "嘉禄五金",
        "pendingQty": 105,
        "pendingItemCount": 1,
        "lastSubcDate": "2026-05-06"
      },
      {
        "supId": 3,
        "supName": "锐虎机械",
        "pendingQty": 0,
        "pendingItemCount": 0,
        "lastSubcDate": "2026-05-05"
      }
    ],
    "activities": [
      {
        "id": 10001,
        "type": "deductionImport",
        "title": "供应商扣款模板",
        "desc": "最近一次扣款文件处理完成，生成结果文件 1 个",
        "time": "今天 09:30",
        "createdAt": "2026-05-08 09:30:00",
        "status": "已完成",
        "statusTagType": "success"
      },
      {
        "id": 10002,
        "type": "supplierPriceImport",
        "title": "供应商报价导入",
        "desc": "前端入口已预留，等待后端接入真实上传解析",
        "time": "昨天 18:10",
        "createdAt": "2026-05-07 18:10:00",
        "status": "待接入",
        "statusTagType": "info"
      }
    ],
    "todos": []
  }
}
```

### 2.4 字段说明

#### `cards`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | string | 是 | 指标编码，前端可用于稳定排序 |
| `label` | string | 是 | 卡片标题 |
| `value` | number | 是 | 原始数值 |
| `displayValue` | string | 是 | 展示值，建议后端直接返回 `String(value)` |
| `delta` | string | 是 | 环比文案，例如 `+12.4%`、`-5.6%`、`+2` |
| `deltaValue` | number | 是 | 环比原始数值 |
| `deltaDirection` | string | 是 | `up`、`down`、`flat` |
| `tone` | string | 是 | 卡片颜色：`blue`、`green`、`orange`、`red` |

当前首页前端最低依赖字段：`label`、`value`、`delta`、`tone`。

#### `trend`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `date` | string | 是 | x 轴展示日期，格式 `MM-DD` |
| `fullDate` | string | 是 | 完整日期，格式 `YYYY-MM-DD` |
| `issueCount` | number | 是 | 当天外发数量 |
| `receiptCount` | number | 是 | 当天回执数量 |

当前首页前端最低依赖字段：`date`、`issueCount`、`receiptCount`。

#### `supplierRank`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `supId` | number | 是 | 供应商 ID |
| `supName` | string | 是 | 供应商名称 |
| `pendingQty` | number | 是 | 待回执数量 |
| `pendingItemCount` | number | 否 | 待回执外发明细条数 |
| `lastSubcDate` | string | 否 | 最近外发日期 |

当前首页前端最低依赖字段：`supName`、`pendingQty`。

#### `activities`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 否 | 动态 ID |
| `type` | string | 是 | 动态类型 |
| `title` | string | 是 | 动态标题 |
| `desc` | string | 是 | 动态描述 |
| `time` | string | 是 | 展示用时间文案 |
| `createdAt` | string | 否 | 真实创建时间 |
| `status` | string | 是 | 状态文案 |
| `statusTagType` | string | 否 | 标签颜色：`success`、`warning`、`danger`、`info`、`primary` |

当前首页前端最低依赖字段：`title`、`desc`、`time`、`status`。

#### `todos`

当前页面只是预留待办区域，暂不渲染真实待办。后端先返回空数组：

```json
{
  "todos": []
}
```

---

## 3. 统计口径

### 3.1 本月外发数量

统计当前月份有效外发明细数量：

```text
sum(out_item.number)
where out_item.deleted = 0
and subcontract.deleted = 0
and subcontract.subc_date between monthStart and monthEnd
```

返回到：

```json
{
  "key": "monthIssueQty",
  "label": "本月外发数量",
  "value": 1710,
  "tone": "blue"
}
```

### 3.2 本月回执数量

统计当前月份有效回执明细数量：

```text
sum(outback_item.number)
where outback_item.deleted = 0
and outback.deleted = 0
and outback.back_date between monthStart and monthEnd
```

返回到：

```json
{
  "key": "monthReceiptQty",
  "label": "本月回执数量",
  "value": 695,
  "tone": "green"
}
```

### 3.3 待回执数量

统计所有未完成外发明细的待回执数量：

```text
sum(max(out_item.number - out_item.back_number, 0))
where out_item.deleted = 0
and subcontract.deleted = 0
```

返回到：

```json
{
  "key": "pendingReceiptQty",
  "label": "待回执数量",
  "value": 1015,
  "tone": "orange"
}
```

### 3.4 活跃供应商

统计当前月份有有效外发明细的供应商数量：

```text
count(distinct subcontract.sup_id)
where out_item.deleted = 0
and subcontract.deleted = 0
and subcontract.subc_date between monthStart and monthEnd
```

返回到：

```json
{
  "key": "activeSupplierCount",
  "label": "活跃供应商",
  "value": 4,
  "tone": "red"
}
```

### 3.5 环比 `delta`

`delta` 和 `deltaValue` 按上一个自然月同一指标计算：

```text
deltaValue = (currentValue - previousValue) / previousValue * 100
```

规则：
- 百分比指标保留 1 位小数。
- `previousValue = 0` 且 `currentValue > 0` 时，`delta` 返回 `"+100%"`。
- `previousValue = 0` 且 `currentValue = 0` 时，`delta` 返回 `"0%"`，`deltaDirection` 返回 `"flat"`。
- 活跃供应商也可以返回数量差，例如 `+2`，不强制百分比。

---

## 4. 趋势图口径

趋势图按最近 `trendDays` 天补齐日期，没有数据的日期返回 0。

请求：

```json
{
  "month": "2026-05",
  "trendDays": 7,
  "rankLimit": 8
}
```

返回片段：

```json
{
  "trend": [
    {
      "date": "05-02",
      "fullDate": "2026-05-02",
      "issueCount": 80,
      "receiptCount": 65
    },
    {
      "date": "05-03",
      "fullDate": "2026-05-03",
      "issueCount": 0,
      "receiptCount": 20
    }
  ]
}
```

统计规则：

```text
issueCount = sum(out_item.number)
where subcontract.subc_date = 当前日期
and out_item.deleted = 0
and subcontract.deleted = 0

receiptCount = sum(outback_item.number)
where outback.back_date = 当前日期
and outback_item.deleted = 0
and outback.deleted = 0
```

---

## 5. 供应商待回执排行口径

按供应商聚合待回执数量，倒序返回前 `rankLimit` 条。

请求：

```json
{
  "rankLimit": 5
}
```

返回片段：

```json
{
  "supplierRank": [
    {
      "supId": 1,
      "supName": "华东精密",
      "pendingQty": 740,
      "pendingItemCount": 2,
      "lastSubcDate": "2026-05-08"
    },
    {
      "supId": 2,
      "supName": "诚宇加工",
      "pendingQty": 180,
      "pendingItemCount": 1,
      "lastSubcDate": "2026-05-07"
    }
  ]
}
```

统计规则：

```text
pendingQty = sum(max(out_item.number - out_item.back_number, 0))
pendingItemCount = count(out_item.id where out_item.number - out_item.back_number > 0)
lastSubcDate = max(subcontract.subc_date)
group by subcontract.sup_id
order by pendingQty desc
```

---

## 6. 最近工具动态

### 6.1 数据来源

首页工具弹窗展示最近工具动态。后端可以从导入日志表、操作日志表或文件处理记录表读取。

如果当前没有日志表，先返回空数组，不要返回 mock 文案。

空数据示例：

```json
{
  "activities": []
}
```

### 6.2 推荐动态类型

| type | 说明 |
| --- | --- |
| `deductionTemplateDownload` | 供应商扣款模板下载 |
| `deductionImport` | 供应商扣款处理 |
| `supplierPriceTemplateDownload` | 供应商报价模板下载 |
| `supplierPriceImport` | 供应商报价导入 |

示例：

```json
{
  "activities": [
    {
      "id": 10001,
      "type": "deductionImport",
      "title": "供应商扣款处理",
      "desc": "华东精密扣款文件处理完成，成功 36 条，失败 0 条",
      "time": "今天 09:30",
      "createdAt": "2026-05-08 09:30:00",
      "status": "已完成",
      "statusTagType": "success"
    }
  ]
}
```

---

## 7. 首页工具接口

首页工具弹窗已经接入这些接口。后端如果已有实现，保持路径兼容即可。

### 7.1 下载供应商扣款模板

- Method: `POST`
- URL: `/outgoing/getModel`
- Response-Type: `blob`
- 返回：Excel 文件流。

请求示例：

```json
{}
```

失败时如果不能返回文件流，返回 JSON：

```json
{
  "code": "500",
  "message": "供应商扣款模板下载失败",
  "data": null
}
```

### 7.2 上传供应商扣款并下载处理结果

- Method: `POST`
- URL: `/outgoing/getDeductions`
- Content-Type: `multipart/form-data`
- Response-Type: `blob`
- 返回：处理后的 Excel 文件流。

请求表单字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | file | 是 | Excel 文件 |
| `isCover` | boolean | 否 | 是否覆盖 |

前端文件名校验规则：

```text
文件名必须包含“扣款”，并且“扣款”前面的文字必须等于供应商名称。
示例：华东精密扣款202605.xlsx
```

失败 JSON 示例：

```json
{
  "code": "400",
  "message": "文件名不符合要求，扣款前必须是供应商名字",
  "data": null
}
```

### 7.3 上传供应商报价

- Method: `POST`
- URL: `/sup/supPrice`
- Content-Type: `multipart/form-data`

请求表单字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | file | 是 | Excel 文件 |
| `isCover` | boolean | 否 | 是否覆盖 |

成功返回示例：

```json
{
  "code": "200",
  "message": "供应商报价导入成功",
  "data": {
    "total": 30,
    "success": 29,
    "fail": 1,
    "failRows": [
      {
        "rowIndex": 12,
        "reason": "供应商不存在"
      }
    ]
  }
}
```

失败返回示例：

```json
{
  "code": "400",
  "message": "Excel 文件解析失败",
  "data": {
    "total": 0,
    "success": 0,
    "fail": 0,
    "failRows": []
  }
}
```

---

## 8. 前端接入要求

后端完成 `/outgoing/home/summary` 后，前端会把当前首页的 `getDashboardStats()` mock 替换为真实接口。

字段最低兼容要求：

```json
{
  "cards": [
    {
      "label": "本月外发数量",
      "value": "1710",
      "delta": "+12.4%",
      "tone": "blue"
    }
  ],
  "trend": [
    {
      "date": "05-08",
      "issueCount": 188,
      "receiptCount": 155
    }
  ],
  "supplierRank": [
    {
      "supName": "华东精密",
      "pendingQty": 740
    }
  ],
  "activities": [
    {
      "title": "供应商扣款处理",
      "desc": "处理完成",
      "time": "今天 09:30",
      "status": "已完成"
    }
  ]
}
```

推荐后端按本文档完整返回，前端会兼容额外字段。
