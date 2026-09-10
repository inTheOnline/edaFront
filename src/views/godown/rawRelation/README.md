# 产品原材料关系

## 功能内容

- 仓库系统下的独立关系维护页面，统一维护产品对应的张料、卷料及 BOM 换算字段。
- 支持分页查询、新增、查看、编辑、单条删除和批量删除。
- 一条有效关系绑定一个产品，可同时配置张料和卷料，但至少配置一种。

## 技术实现

- 列表使用 `ProTable`，新增、编辑和查看使用右侧抽屉。
- 产品选项来自 `mater` 字典；原材料选项来自 `/raw/getAll`。
- 张料必须同时填写原料和每张产出数；卷料必须同时填写原料和单件耗重。

## 后端 API

- `POST /buy/rawPurchase/rawMater/page`
- `POST /buy/rawPurchase/rawMater/add`
- `PUT /buy/rawPurchase/rawMater/edit`
- `DELETE /buy/rawPurchase/rawMater/delete/{id}`
- `POST /buy/rawPurchase/rawMater/deleteBatch`
