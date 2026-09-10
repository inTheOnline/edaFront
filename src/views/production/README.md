# 生产首页

## 功能
生产系统首个子路由 `/production/home`，对应 `production/index.vue`。展示待核实、当前标准、无法核实及基础无效记录数量，并提供日报、正常速度、员工效率入口。

## 技术与接口
- Vue 3、Element Plus，复用现有主题与动态菜单；激活页面时刷新。
- `GET /production/eff/overview`，展示实际数据库统计，不计算效率、不审核标准。
- 查看权限 `production:eff:view`。角色权限仍在“基础管理—业务权限”配置。
- 生产首页、正常速度、员工效率、生产日报表、二维码打印依次排序。

## 注意
- 计算规则与待解决项见后端 `service/production/README.md`。
- 用户未确认任何标准前，“当前速度”为0；先进入正常速度审核，不自动替用户批准。
