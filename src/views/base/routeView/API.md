# routeView 接口文档

以下接口供前端路由管理页面使用。

## 1. 查询路由树

- 方法：`GET`
- 地址：`/menu/tree`

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 10,
      "parentId": null,
      "routeType": "catalog",
      "path": "/base",
      "redirect": "/base/index",
      "sort": 10,
      "description": "基础管理",
      "meta": {
        "icon": "Tools",
        "title": "基础管理",
        "activeMenu": "",
        "isLink": "",
        "isHide": false,
        "isFull": false,
        "isAffix": false,
        "isKeepAlive": true,
        "roles": "base"
      },
      "children": [
        {
          "id": 101,
          "parentId": 10,
          "routeType": "page",
          "path": "/base/routeView",
          "name": "routeView",
          "component": "/base/routeView/index",
          "sort": 100,
          "description": "路由可视化管理",
          "meta": {
            "icon": "Connection",
            "title": "路由管理",
            "activeMenu": "",
            "isLink": "",
            "isHide": false,
            "isFull": false,
            "isAffix": false,
            "isKeepAlive": true,
            "roles": "routeView"
          }
        }
      ]
    }
  ]
}
```

## 2. 新增路由

- 方法：`POST`
- 地址：`/menu/add`

### 请求体

```json
{
  "parentId": 10,
  "parentPath": "/base",
  "routeType": "page",
  "name": "routeView",
  "path": "/base/routeView",
  "component": "/base/routeView/index",
  "redirect": "",
  "sort": 100,
  "description": "路由可视化管理",
  "meta": {
    "title": "路由管理",
    "icon": "Connection",
    "roles": "routeView",
    "activeMenu": "",
    "isLink": "",
    "isHide": false,
    "isFull": false,
    "isAffix": false,
    "isKeepAlive": true
  }
}
```

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 102,
    "success": true,
    "message": "route created"
  }
}
```

## 3. 编辑路由

- 方法：`POST`
- 地址：`/menu/update`

### 请求体

```json
{
  "id": 102,
  "parentId": 10,
  "parentPath": "/base",
  "routeType": "page",
  "name": "routeView",
  "path": "/base/routeView",
  "component": "/base/routeView/index",
  "redirect": "",
  "sort": 110,
  "description": "路由可视化管理",
  "meta": {
    "title": "路由管理",
    "icon": "Connection",
    "roles": "routeView",
    "activeMenu": "/base/routeView",
    "isLink": "",
    "isHide": false,
    "isFull": false,
    "isAffix": false,
    "isKeepAlive": true
  }
}
```

### 说明

- `id`：必填，当前编辑的路由 id
- 其余字段与新增接口一致
- 如果编辑时修改了 `path`，后端会同步更新它的子路由 `path` 和以旧路径开头的 `activeMenu`
- 如果编辑时修改了 `roles`，后端会自动复用或创建对应的 `menu` 权限记录，并回填 `meta.menu_id`

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "message": "route updated"
  }
}
```

## 4. 移动路由

- 方法：`POST`
- 地址：`/menu/move`

### 请求体

```json
{
  "id": 101,
  "parentId": 10,
  "parentPath": "/base",
  "previousParentId": 1,
  "previousParentPath": "/dashboard",
  "sort": 30,
  "path": "/base/routeView"
}
```

### 说明

- `id`：当前被拖拽移动的路由 id
- `parentId`：拖拽后的新父级 id；如果移动为顶级则传 `null`
- `parentPath`：拖拽后的新父级 path；顶级可空
- `previousParentId`：移动前的父级 id；仅供前端保留上下文，后端当前不依赖该字段
- `previousParentPath`：移动前的父级 path；仅供前端保留上下文，后端当前不依赖该字段
- `sort`：移动后的排序值
- `path`：当前路由移动后的 path；如果未修改可传原值

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "message": "route moved"
  }
}
```

## 5. 删除路由

- 方法：`POST`
- 地址：`/menu/delete`

### 请求体

```json
{
  "id": 102
}
```

### 说明

- `id`：必填，要删除的路由 id
- 当前路由如果还有子路由，后端会直接报错：必须先删子路由
- 删除 `meta` 后，如果没有其他 `meta` 继续使用同一个 `menu_id`，后端会顺带删除对应 `menu`

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "message": "route deleted"
  }
}
```

## 6. 字段说明

- `parentId`：父级路由 id，顶级传 `null`
- `parentPath`：父级路由 path，后端可用来兜底定位父节点
- `routeType`：后端运行时推导，前端新增/编辑时仍需传当前页面类型，支持 `catalog`、`page`
- `name`：页面路由名称；`catalog` 可为空
- `path`：完整路由路径，建议以 `/` 开头
- `component`：页面文件路径，不带 `.vue`；目录路由可为空
- `redirect`：重定向地址，可空
- `sort`：排序值
- `description`：备注
- `meta.title`：菜单标题
- `meta.icon`：菜单图标，使用 `@element-plus/icons-vue` 的组件名
- `meta.roles`：权限标识，对应 `menu.menu_name`
- `meta.activeMenu`：隐藏详情页高亮归属菜单 path，可空
- `meta.isLink`：外链地址，可空
- `meta.isHide`：是否隐藏
- `meta.isFull`：是否全屏路由
- `meta.isAffix`：是否固定标签
- `meta.isKeepAlive`：是否缓存
