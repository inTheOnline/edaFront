# login 登录页壳层

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 当前目录负责登录页外层布局。
- 实际登录表单逻辑在 components/LoginForm.vue 中。
- 页面提供登录背景、Logo、暗黑模式切换入口。

## 技术实现
- index.vue 只是壳层，真正表单提交、校验、登录状态处理不在这里。
- 页面复用了全局 SwitchDark 组件。
- 如果后续要改登录逻辑，先读 LoginForm.vue 和 api/modules/login.ts，不要只改这个壳层文件。

## 后端 API
- 本页自身无直接接口调用。
- 登录相关接口主要在 api/modules/login.ts：
  - loginApi => POST /web/login
  - getAuthMenuListApi => GET /menu/list
  - getAuthInfoApi => GET /web/getInfo
  - logoutApi => POST /web/unlogin

## 代码习惯规范
- 这类页面更偏静态展示或占位，当前实现很轻，不建议直接往里堆复杂业务。
- 如果后续要扩展成真实业务页，优先补充接口层和局部组件，再决定是否保留当前结构。
- 目录内如果后续新增 README、scss、组件文件，AI 修改前都应先读文档再动代码。
