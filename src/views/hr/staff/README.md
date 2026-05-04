# hr/staff 职工管理页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供职工分页查询。
- 支持新增、查看、编辑、单个删除、批量导入、导出。
- 支持按姓名、部门、状态等字段筛选。
- 展示工号、姓名、年龄、性别、部门、状态、身份证、手机号、学历、考勤制度等字段。

## 技术实现
- 页面会先加载部门字典和考勤制度映射 getChecksysMap。
- 表格列中的部门和性别通过 enum/dict 方式显示。
- 抽屉打开时会额外传入 departmentMap、checksysMap、stateMap。
- 导入导出均走 hr 模块接口，属于当前项目比较标准的人员资料列表页。

## 后端 API
- getAll => GET /hr/staff/all
- addStaff => POST /hr/staff/add
- editStaff => POST /hr/staff/edit
- deleteStaff => DELETE /hr/staff/deleteStaff?id=
- deleteMany => POST /hr/staff/deleteMany（模块接口存在，当前页单个删除更常用）
- addManyStaff => POST /hr/staff/addMany
- getModel => DOWNLOAD /hr/staff/getModel
- getExcel => DOWNLOAD /hr/staff/getExcel
- getChecksysMap => GET /hr/checksys/getMap
- getDepartmentApi => GET /department/getMap
- getSex => 性别枚举接口
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
