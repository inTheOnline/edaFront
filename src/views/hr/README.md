# hr 模块主页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 这是人事模块首页，展示在职人数、招聘概况和两张统计图。
- 图表内容分别是部门人员占比、年龄构成。
- 页面承担 hr/staff、hr/check 的概览入口角色。

## 技术实现
- 使用 Naive UI 卡片与统计组件，图表通过 PieChart 渲染。
- onMounted 时会并发请求部门人数、年龄分布、在职总数等接口，再将结果写入 option。
- 当前页面是典型“模块看板页”，适合继续补人事统计，不适合直接写员工 CRUD。

## 后端 API
- getDepartNumber => GET /hr/staff/depart
- getAgeNumber => GET /hr/staff/age
- getNumber => GET /hr/staff/number

## 代码习惯规范
- 这类首页/聚合页主要承担模块入口或看板职责，不要把明细 CRUD 全塞进这里。
- 如果要新增业务，优先拆到下级页面目录，再由当前页做概览、跳转或统计汇总。
- 图表页通常直接在当前文件里组织 option；后续如果图表变复杂，建议再抽 hooks 或组件。
