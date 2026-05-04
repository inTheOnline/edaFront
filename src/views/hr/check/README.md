# hr/check 考勤月份页与详情页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- index.vue 负责展示可查看的月份按钮列表。
- detail.vue 负责展示指定年月的考勤/工资明细表，并支持导入、导出、查看、编辑。
- 详情页列结构包含固定列和后端返回的动态日期明细列。

## 技术实现
- index.vue 在 onBeforeMount 中调用 getMonths，然后通过 router.push 携带 year/month 跳到 detail。
- detail.vue 使用 useRoute 读取 query 参数，再通过 getDateDetails 获取动态列 details。
- 详情页 ProTable 数据请求仍使用 hr.getAll，说明页面当前有“考勤明细 + 职工表格接口复用”的痕迹。
- 上传考勤文件后，页面会从 addManyCheck 返回的 URL 直接构造 a 标签下载结果文件。
- 该目录是动态列页面，修改前先确认后端返回 details 的结构。

## 后端 API
- getMonths => GET /hr/check/getMonths
- getDateDetails => GET /hr/check/getDateDetails?year=&month=
- getAll => GET /hr/staff/all（详情页当前仍复用职工列表接口）
- addManyCheck => POST /file/kaoqin
- getCheckModel => DOWNLOAD /hr/check/getModel
- getDepartmentApi => GET /department/getMap
- getStateApi => GET /outgoing/getSubc_state

## 代码习惯规范
- 主要使用 script setup + TypeScript，页面逻辑直接写在 index.vue。
- 列表页统一围绕 ProTable 组织，列定义集中在 columns 中，搜索项直接写在列配置里。
- 分页序号通常通过 proTableRef.pageable.pageNum/pageSize 手动计算，不要随意改成另一套写法。
- 新增/查看/编辑通常通过本目录或复用目录下的 Drawer/Dialog 组件完成，父页用 acceptParams 传 title、isView、row、api、getTableList。
- 字典类枚举优先走 dictStore.loadDicts 或接口 enum，不要在页面里重复硬编码。
- 导入导出优先复用 ImportExcel 和 useDownload。
- 删除后通常调用 getTableList 或 reset 刷新表格，保持现有交互一致。
