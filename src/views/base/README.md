# base 模块主页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 当前页面提供“工具箱 → PDF 盖章 / 签名”入口。
- 实际业务都已经拆到了 cust、project、sup、user、work 等子目录。

## 技术实现
- 首页路由为 `/base/index`，名称 `base`；路由管理 `/base/route` 使用独立名称 `routeView`。名称不能重复，否则首页路由会被替换而出现 404。
- index.vue 只负责入口，盖章逻辑放在 `seal/index.vue`，尺寸与页码校验放在 `seal/layout.ts`。
- 不建议在这里直接堆客户、供应商、项目等明细逻辑。

## 后端 API
- 盖章工具使用 `/base/seal/list`、`/base/seal/info`、`/base/seal/preview`、`/base/seal/export`，见 `seal/README.md`。

## 代码习惯规范
- 这类首页/聚合页主要承担模块入口或看板职责，不要把明细 CRUD 全塞进这里。
- 如果要新增业务，优先拆到下级页面目录，再由当前页做概览、跳转或统计汇总。
- 图表页通常直接在当前文件里组织 option；后续如果图表变复杂，建议再抽 hooks 或组件。
