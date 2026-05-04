# AGENTS.md

## 项目位置
- 项目根目录：D:\project\EDA_ERP\Front\Geeker-Admin
- 前端技术栈：Vue 3、TypeScript、Vite 5、Pinia、Vue Router、Element Plus、Naive UI、ECharts
- 当前本地工程默认包管理器按 npm 处理，常用启动命令是 npm run dev

## AI 协作前必须先做的事
- 只要目标目录、当前页面目录、相关组件目录下存在 README.md，先读 README.md，再看代码。
- 修改 src/views 下页面时，优先阅读该页面目录中的 README.md；如果页面复用了其他目录的 drawer/dialog/components，也要一起读。
- 不确定业务含义、字段语义、接口返回时，先问用户，不要自己拍板。

## 当前项目代码习惯
- 注释一定要用中文
- 列表页统一大量使用 ProTable，columns 配置里直接带 search、enum、tag 等声明。
- 页面普遍使用 script setup + TypeScript；业务逻辑常直接保留在 index.vue 中。
- 新增/编辑/查看通常通过右侧抽屉或弹窗组件完成，父页用 acceptParams 注入 api、row、刷新函数和字典数据。
- 字典数据优先来自 dictStore.loadDicts 或专用接口，不要在页面里重复造映射。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 很多页面存在历史复制痕迹，目录名、标题名、实际 API 可能不完全一致；修改前先比对 README 和真实代码。

## views 文档约定
- src/views 下每个页面目录都应维护 README.md。
- README.md 至少描述：功能内容、技术实现、后端 API、当前页面的代码习惯和注意点。
- 后续修改页面后，如果改了接口、组件依赖或业务流程，要同步更新对应 README.md。

## 执行建议
- 先从页面 README.md 了解业务，再打开 index.vue 和 components。
- 涉及接口改动时，同时检查 src/api/modules 和 src/api/interface。
- 涉及菜单/权限时，同时检查 routers、stores/modules/auth、stores/modules/user、system 相关 API。
- 只有在确认 README 已经过时的情况下，才以代码为准并顺手回填文档。
