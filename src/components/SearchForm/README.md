# 搜索表单

所有使用 ProTable 默认搜索栏的页面共用此组件，搜索接口由页面传入，不在组件中直接请求。

## 键盘操作

- 普通输入框按 Enter 搜索。
- 选择控件展开时保持原生键盘行为，Enter 确认选项，不触发表单搜索。
- 已有选中值且下拉收起后，Enter 搜索；不限定供应商字段。
- 多选可连续选择，按 Esc 收起后再按 Enter 搜索。
- 支持 select、select-v2、tree-select、cascader、date-picker、time-picker、time-select。
- 中文输入法组词确认和长按 Enter 不触发搜索。
- 自定义 search.render 保持其自身交互；新增自定义搜索控件时应遵守以上约定。

## 实现

SearchFormItem 在捕获阶段判断展开状态和绑定值，已完成选择时发出 search 事件。选择中的 Enter 在冒泡阶段拦截，避免同一次按键既确认又查询。SearchForm 统一调用传入的 search 方法。
