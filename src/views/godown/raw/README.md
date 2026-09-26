# godown/raw 原料资料页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供原料分页查询。
- 支持新增、查看、编辑、批量删除、模板导入、导出。
- 支持按原料编号/名称等条件做列表搜索。
- 新增抽屉默认填写一条关联产品关系；板料填写每张产出数、张重，卷料填写单件耗重、产品毛重。
- 每行“查看关系”进入 `/godown/rawRelation?rawId=...&rawNum=...`，按原材料 ID 精确筛选。

## 技术实现
- 页面结构与物料页、仓库流水页一致，复用 ProTable、UserDrawer、ImportExcel。
- 会加载 mater 字典用于枚举展示。
- 类别字段 `type` 在列表中按 `1 = 板料`、`2 = 卷料` 显示。
- 新增使用 `addWithRelation`，关联产品必填以生成编号；后端同一事务保存原材料及关系。已有关系只补充缺少的原料类型，保留另一类型配置、毛重、备注。
- 原料类型、编号、名称、规格、单位重量校验绑定实际字段；单位重量对应数据库非空列，必须填写非负数字，未明确的重量单位沿用现有口径。
- 关系选择复用 `mater` 字典；切换板料/卷料清空原类型的关系参数。编辑基础信息仍走原编辑接口，关系在关系页维护。
- 历史导入、删除接口封装仍需单独核对，本次未修改。

## 后端 API
- getAll => POST /raw/getAll
- getModel => DOWNLOAD /raw/getModel
- addMany => GET /raw/addMany
- deleteMany => GET /raw/removes
- addWithRelation => POST /raw/addWithRelation，参数 `{ raw, materialCode, relation }`，返回新原材料 ID
- 原有后端 POST /raw/add 保留兼容，新抽屉不再使用旧 GET 封装
- edit => POST /raw/alter

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。

## 自动编号与公斤口径
- 编号只读预览，后端重新生成：卷料 `RD-材质简称-产品编号`，板料 `RB-材质简称-产品编号`。
- 材质简称自动提取材质中的 ASCII 字母、数字，允许手动修改；关联产品使用 `mater` 字典的编号 `num`。
- 重量输入、列表显示均为 kg，保留四位小数。原料单位重量、关系单件耗重、张重原本已按 kg 存储。
- 产品毛重、废料重历史按 g 存储，接口适配层负责 g/kg 换算，不批量改写历史数据及核算公式。
- 选择产品请求 `/buy/rawPurchase/rawMater/product/{materId}`；已有产品毛重只读显示，新增原料时不重填、不覆盖。
- 新产品没有关系时允许填写公斤毛重；已有关系缺少毛重时去关系页维护。
