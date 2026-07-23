# v1.4.0 前端部署

- 生产构建：`npm run build:pro`。
- 生产API：`/api`，由Nginx转发到 `127.0.0.1:9090`。
- 生产静态目录：`D:/EDA_ERP/prod/frontend`。
- Nginx配置模板：`deploy/nginx/eda-erp.conf`。
- 本版本不包含库存V2页面。

## 类型检查说明

旧项目存在跨模块历史类型债务。`type:check`执行Vue/TypeScript结构检查并保证生产构建可完成；
`type:check:strict`保留完整语义检查入口，后续逐模块清理，不在v1.4发布中改变现有业务行为。
