# godown 模块概览页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 这是仓库模块的概览/分析页。
- 支持按产品筛选，展示入库数量、出库数量、库存总量、物料种类等统计卡片。
- 页面还包含仓库趋势图、库存分布图，以及“批量添加委外记录”的入口。

## 技术实现
- 页面使用 Element Plus 卡片 + ECharts，并集成自定义 BatchAddDialog。
- 物料筛选走 dictStore.dictMap[mater]，统计数据来自 getFlow；批量提交接口走 orderOut.addBatchApi。
- 页面里仍保留 testLocalList 作为本地测试数据，说明该页还处于功能整合阶段。
- 如果继续开发，应先确认它是“仓库看板”还是“委外批量处理入口”，再决定是否拆页。

## 后端 API
- getFlow => POST /godown/getFlow
- getOrderItem => POST /order/getOrderItem
- addBatchApi => POST /orderOut/addBatchApi

## 代码习惯规范
- 这类首页/聚合页主要承担模块入口或看板职责，不要把明细 CRUD 全塞进这里。
- 如果要新增业务，优先拆到下级页面目录，再由当前页做概览、跳转或统计汇总。
- 图表页通常直接在当前文件里组织 option；后续如果图表变复杂，建议再抽 hooks 或组件。
