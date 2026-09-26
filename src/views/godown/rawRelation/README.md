# 产品原材料关系

## 功能内容

- 仓库系统下的独立关系维护页面，统一维护产品对应的张料、卷料及 BOM 换算字段。
- 支持分页查询、新增、查看、编辑、单条删除和批量删除。
- 一条有效关系绑定一个产品，可同时配置张料和卷料，但至少配置一种。
- 可从原材料信息表的“查看关系”进入，显示当前原料编号并提供返回原材料按钮。

## 技术实现

- 列表使用 `ProTable`，新增、编辑和查看使用右侧抽屉。
- 产品选项来自 `mater` 字典；原材料选项来自 `/raw/getAll`。
- 张料必须填写原料、每张产出数、张重；卷料必须填写原料、单件耗重、产品毛重。
- 路由 `rawId` 传入分页接口的 `data.rawId`，后端按 `sheet_raw_id = rawId OR roll_raw_id = rawId` 分组精确过滤，并与其他搜索条件共同生效。
- 分页、搜索和重置始终保留当前原料过滤；切换原料 ID 时重建表格，防止沿用上一原料的页码和选择项。

## 后端 API

- `POST /buy/rawPurchase/rawMater/page`
- `POST /buy/rawPurchase/rawMater/add`
- `PUT /buy/rawPurchase/rawMater/edit`
- `DELETE /buy/rawPurchase/rawMater/delete/{id}`
- `POST /buy/rawPurchase/rawMater/deleteBatch`

## 重量单位
- 页面所有重量显示 kg，保留四位小数。
- `api/modules/buy/rawPurchase.ts` 在关系分页、产品关系读取和关系新增/编辑处换算历史 g 字段（毛重、废料重）；单件耗重和张重保持原 kg 口径。
- 新原料合并到已有产品关系时，不覆盖产品毛重、另一原料类型、备注。
