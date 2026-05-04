# base/user 用户与权限管理页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供系统用户分页查询。
- 支持新增、查看、编辑、删除用户。
- 主页面顶部展示用户管理概览，包括当前页用户数、职位角色数、启用用户数。
- 提供职位权限编辑弹窗，用于维护角色启用状态、路由权限、价格权限、系统权限。
- 权限弹窗支持查看某个角色下的成员，优先调用 `/role/{roleId}/users`，接口不可用时按主页面已加载用户列表中的 `roleId` 兜底匹配。
- 权限弹窗支持添加角色，当前调用 `/role/add` 持久化新增角色。
- 支持按用户名搜索，并展示角色、性别、状态等字段。密码列已隐藏，避免列表直接暴露密码。

## 技术实现
- 页面由 ProTable、UserDrawer、PermissionEditor 三部分组成。
- `index.vue` 的 `onMounted` 同时加载 role 字典、权限树 `getPowerTree` 和角色权限列表 `getRoles`。
- 用户 CRUD 走 `mySystem/users` 模块；角色权限编辑走 `system/role` 与 `system/power` 模块。
- `dataCallback` 会缓存当前页用户到 `currentUserList`，再传给 `PermissionEditor` 做角色成员可视化。
- `extraPermissionGroups` 定义额外权限分类，目前包含 `price` 和 `system`。后续新增权限分类时优先在这里追加配置。
- `PermissionEditor` 内部用 `formMap` 维护每个角色的 `enabled`、`access`、`extraPermissions`。
- 权限保存时只提交当前正在编辑的角色，避免未编辑角色被空权限覆盖；`savePower` 会转换为数组并 POST 到后端。
- 当前角色路由权限为空时会二次确认，避免误清空角色权限。
- 切换角色、切换权限 Tab、保存权限时不能从 `el-tree.getCheckedKeys()` 反读覆盖当前角色；只能在用户真实勾选、全选、清空时更新 `formMap[role].access`，否则父子节点归一化会导致权限数量变化。
- 后端当前已支持 `extraPermissions`，`savePower` 会保留该字段并提交给 `/power/updatePower`。
- 价格权限、系统权限属于业务权限：本页面只负责配置、保存、回显；具体业务页面必须自己使用 `v-auth` 或 `authStore.isExistence` 判断后才会真正限制按钮、字段和操作。
- `PermissionEditor` 中带 `immediate: true` 的监听器必须写在其依赖函数初始化之后，避免 `Cannot access 'initRoleForms' before initialization`。
- 这个页面存在一些历史复制/临时变量残留，修改时要先确认是用户管理还是角色管理逻辑。

## 后端 API
- `getAllUser` => GET `/user/select/all`
- `addUser` => POST `/user/add`
- `editUser` => POST `/user/editUser`
- `deleteUsers` => POST `/user/delete/many`
- `rolesMap` => GET `/role/map`
- `addRole` => POST `/role/add`
- `getRoleUsers` => GET `/role/{roleId}/users`
- `getRoles` => GET `/power/getRolePower`
- `savePower` => POST `/power/updatePower`
- `getPowerTree` => GET `/power/tree`

## 角色权限 API 文档

### 1. 新增角色 API
- 当前状态：已接入后端 `/role/add`，后端返回角色对象后前端会写入弹窗角色列表。
- 接口：POST `/role/add`
- 入参：

```json
{
  "name": "销售主管",
  "remark": "负责销售团队权限"
}
```

- 返回：

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "id": 12,
    "name": "销售主管",
    "remark": "负责销售团队权限",
    "status": "启用"
  }
}
```

- 后续如果要改新增角色字段：
- `src/api/modules/system/role.ts`：调整 `addRole` 入参类型。
- `src/views/base/user/components/PermissionEditor.vue`：调整 `roleForm`、表单项和 `addMockRole` 中提交给 `addRoleApi` 的字段。
- `src/views/base/user/index.vue`：如需保存后立刻全量刷新，继续复用 `reloadData` 中的 `dictStore.loadDicts(['role'])` 和 `getRoles()`。

### 2. 角色成员 API
- 当前状态：已接入后端 `/role/{roleId}/users`；接口未传入时才使用当前页用户列表兜底。
- 接口：GET `/role/{roleId}/users`
- 返回：

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "userName": "admin",
      "name": "管理员",
      "roleId": 1
    }
  ]
}
```

- 后端完成后需要修改：
- `src/api/modules/system/role.ts`：新增 `getRoleUsers(roleId)`。
- `src/views/base/user/components/PermissionEditor.vue`：把 `getRoleUsers` 从本地 `props.userList.filter` 改为按角色请求接口，或由父组件传入完整角色成员 Map。

### 3. 扩展权限保存字段
- 当前状态：前端已把额外权限放入 `extraPermissions`，同时预留兼容读取 `pricePermissions`、`systemPermissions`、`price`、`system`。
- 当前保存 payload 结构：

```json
[
  {
    "id": "1",
    "roleName": "管理员",
    "enabled": true,
    "access": [1, 2, 3],
    "extraPermissions": {
      "price": ["price:view", "price:edit"],
      "system": ["system:config"]
    }
  }
]
```

- 建议后端 `GET /power/getRolePower` 返回同样结构，至少包含：

```json
{
  "id": 1,
  "enabled": true,
  "access": [1, 2, 3],
  "extraPermissions": {
    "price": ["price:view"],
    "system": ["system:log"]
  }
}
```

- 后端完成后需要修改：
- `src/api/interface/role.ts`：给 `RoleDTO` 增加 `extraPermissions?: Record<string, string[]>`。
- `src/api/modules/system/role.ts`：确认 `savePower` 的转换结果符合后端字段要求。

## 业务权限是否生效

- 路由权限：通过菜单/路由数据控制用户能不能看到和进入某个页面。
- 价格权限、系统权限：当前已经能在“职位权限编辑”里勾选、保存到后端、再次打开时回显，并在登录后的 `/web/getInfo` 中进入 `userInfo.powers`。
- 业务权限不会自动控制页面。要让它生效，必须在对应业务页面里主动判断权限。
- 前端控制适合隐藏按钮、隐藏字段、禁用操作；关键写入类接口还需要后端再校验，不能只靠前端隐藏。

## 页面怎么做权限控制

方式一：用全局指令 `v-auth` 控制按钮或元素显示。

```vue
<el-button v-auth="'price:edit'" type="primary">编辑价格</el-button>
<el-button v-auth="'system:config'" type="primary">系统配置</el-button>
```

`v-auth` 支持数组，只要用户拥有其中任意一个权限就显示。

```vue
<el-button v-auth="['purchase:create', 'purchase:approve']">采购操作</el-button>
```

方式二：在 `script setup` 中使用 `authStore.isExistence` 做更细的控制。

```vue
<script lang="ts" setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/modules/auth";

const authStore = useAuthStore();
const canViewPrice = computed(() => authStore.isExistence("price:view"));
const canCreatePurchase = computed(() => authStore.isExistence("purchase:create"));
</script>

<template>
  <span v-if="canViewPrice">{{ row.price }}</span>
  <span v-else>***</span>

  <el-button :disabled="!canCreatePurchase">新增采购单</el-button>
</template>
```

方式三：请求前主动拦截，避免用户绕过禁用按钮触发操作。

```ts
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/modules/auth";

const authStore = useAuthStore();

const submitPurchase = async () => {
  if (!authStore.isExistence("purchase:create")) {
    ElMessage.warning("没有新增采购单权限");
    return;
  }
  await addPurchase(formData);
};
```

注意：前端判断只提升交互体验，不等于安全校验。采购审核、删除、改价等关键接口，后端 Controller 或 Service 也要根据当前登录用户角色校验 `permission_key`。

## 后续新增权限类型怎么改
- 只改前端展示和保存字段：在 `src/views/base/user/index.vue` 的 `extraPermissionGroups` 追加一项。
- 需要后端持久化：当前后端已用 `role_extra_permission` 通用保存 `extraPermissions`，通常不需要改表结构。
- 需要页面生效：在对应业务页面使用 `v-auth` 或 `authStore.isExistence` 判断新权限标识。
- 需要后端强校验：在对应业务接口中按登录用户角色校验 `role_extra_permission.permission_key`。
- 需要独立接口：在 `src/api/modules/system/role.ts` 或对应业务模块新增接口，再在业务页面中接入。

采购权限示例，具体权限点以业务确认为准：

```ts
{
  key: "purchase",
  title: "采购权限",
  summary: "控制采购单查看、创建、审核等操作范围",
  options: [
    { label: "查看采购", value: "purchase:view", description: "允许查看采购单和采购明细" },
    { label: "新增采购", value: "purchase:create", description: "允许创建采购单" },
    { label: "审核采购", value: "purchase:approve", description: "允许审核采购单" }
  ]
}
```

加完配置后，保存角色时会自动提交：

```json
{
  "extraPermissions": {
    "price": ["price:view"],
    "system": ["system:config"],
    "purchase": ["purchase:view", "purchase:create"]
  }
}
```

采购页面使用示例：

```vue
<el-button v-auth="'purchase:create'" type="primary">新增采购单</el-button>
<el-button v-auth="'purchase:approve'" type="warning">审核采购单</el-button>
```

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 `proTableRef.pageable.pageNum/pageSize` 手动计算，不要随意改成另一套写法。
- 新增、查看、编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 `acceptParams` 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 `dictStore.loadDicts` 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
- 注释使用中文。新增或改动业务结构时，要同步更新本 README.md。
