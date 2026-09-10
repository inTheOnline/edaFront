# 1.5 前端发布

- 版本：1.5.0，前版本：1.4.0。
- 构建：npm run build:pro；API 为 /api，由 Nginx 转发到生产后端 9090。
- 生产静态目录：D:/EDA_ERP/prod/frontend。
- 版本信息：/version.json；更新日志：/CHANGELOG.md。
- 功能更新见根目录 CHANGELOG.md，包括库存 V2、采购单据、生产效率及人事工资等。
- 沿用 1.4 的 type:check 发布检查方式；type:check:strict 保留完整语义检查入口，当前仍有历史类型错误。
