# AI 助手

## 功能

- 独立会话页面，查询实时业务数据、检索已发布操作文档，展示回答、查询表格和来源。
- 支持会话创建、历史读取、删除、流式回答、澄清候选和停止回答。
- 普通用户使用系统默认模型；超级管理员可选择后端模型目录中已启用的模型、推理强度和支持的 Ultra 模式。
- 超级管理员通过 AI 管理抽屉维护知识文档、模型目录和系统设置；页面不接收或保存模型 API 密钥。

## 接口与入口

- API 封装为 `src/api/modules/ai.ts`；页面组件路径 `/ai/assistant/index`，路由名称 `aiAssistant`。
- 动态路由初始化读取后端 capabilities，按 canUse 展示内置 AI 菜单，无需 menu/meta/power 数据迁移。接口暂不可用时，仅已通过 ERP 身份验证的超级管理员或拥有 `ai:use` 的用户保留入口，进入后显示错误原因；明确拒绝或登录失效不回退。专用 `aiCanUse` 只控制此路径，其他业务沿用原路由授权。
- capabilities 使用 `ready:false/reason` 表示数据库或配置尚未初始化；入口仍可见，页面不请求会话、知识、模型管理，也不能发送提问。`ready` 缺省时兼容已返回完整 settings 的旧版接口。数据库未就绪与 API Key 未配置分别显示提示。
- 页面刷新能力失败时清空旧能力、会话、消息和模型选择，关闭管理抽屉，并在页面顶部显示可重试错误，避免沿用之前的可发送状态。401/403 同时隐藏入口；其他临时故障保留入口。用户切换、权限失效和未就绪响应会使尚未完成的旧历史请求失效，旧用户的能力响应不能写回新用户页面。
- `GET /ai/capabilities` 返回当前用户能力、可用模型和设置，权限判断以后端为准。
- `GET/POST /ai/conversations`、`DELETE /ai/conversations/{id}`、`GET /ai/conversations/{id}/messages` 管理会话。
- `POST /ai/chat` 使用 fetch + token 请求头读取 SSE：start/status/delta/evidence/done/error/clarification。
- `POST /ai/runs/{runId}/cancel` 取消运行；页面离开或登录身份变化时同时取消前端读取，不保留浏览器聊天缓存。
- `GET/POST /ai/documents`、`POST /ai/documents/{id}/publish`、`DELETE /ai/documents/{id}` 管理知识；保存后为草稿，发布后用于检索。
- `GET /ai/documents/{id}/download` 通过带 token 的 fetch 下载 Markdown；禁止把 token 放进链接。
- `GET/PUT /ai/models`、`GET/PUT /ai/settings` 仅供超级管理员管理。

## 组件与约定

- `AnswerEvidence.vue` 展示工具返回的结构化依据及 reference 证据编号；站内来源可跳转，知识下载使用 documentId 或文档 URL，不能把 chunkId 当作文档 ID。回答和依据均以文本渲染，不使用 `v-html`。
- 查询依据显示归一化 filters、页码、每页数量、查询时间和统计口径；常见业务字段使用中文标题。
- `KnowledgeManager.vue` 展示文档管理；权限以标签输入，保存为 `permissionsJson` 数组字符串，留空默认仅管理员，多项标签要求全部满足。
- `AdminPanel.vue` 管理知识、模型目录与系统设置，沿用 Element Plus 配色和表单。
- 文档模块为 base/bom/order/shipping/purchase/office/stock/outgoing/production/hr/report/system。
- `ai:use` 通过用户管理页扩展权限分组分配，业务数据权限仍由后端逐项校验。
- 流式接口不复用普通 Axios JSON 拦截器，支持 UTF-8 分片、CRLF、多行 data、取消、超时、401 和异常中断反馈。
- 新功能验证应拦截并模拟业务 API，避免浏览器测试误用真实账号或数据库。
- 历史列表按服务端当前权限展示，可用“刷新权限与历史”重新读取；来源被下架、权限变更或路径失效时，在原回答下显示明确提示。
- 澄清候选使用 displayName 显示本地名称，点击仅发送 value 中的脱敏代号，避免同名实体反复澄清。
- 单条问题上限为 4000 字；未获 AI 使用权限的 capabilities 可省略 settings。clarification 可直接结束流，error 后仍可接收 done 中的最终状态与消息编号。
