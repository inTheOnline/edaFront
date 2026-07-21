# hr/staff 职工管理页

## 阅读顺序
- 修改本目录代码前，先读本 README.md。
- 如果本目录下还有 components、config、drawer、dialog 等文件，先读这些实现再改动。
- 当前目录被上层页面复用时，也要顺手检查调用方传入的参数。

## 功能内容
- 提供职工分页查询。
- 支持新增、查看、编辑、单个删除、批量导入、导出。
- 支持维护每个职工的人事资料附件。
- 支持按姓名、部门、状态等字段筛选。
- 展示工号、姓名、年龄、性别、部门、状态、身份证、手机号、学历、考勤制度、是否购买社保、银行卡号、开户银行、开户支行详情、备注等字段。

## 技术实现
- 页面会先加载部门字典和考勤制度映射 getChecksysMap。
- 表格列中的部门和性别通过 enum/dict 方式显示。
- 抽屉打开时会额外传入 departmentMap、checksysMap、stateMap。
- 职工资料新增/编辑支持 `social` 和 `remark`：`social` 取值 `1` 表示深圳一档，`2` 表示深圳2档，`3` 表示深圳三档，`0` 表示否。
- 职工资料新增/编辑支持 `bankCard` 银行卡号、`bankBranch` 开户银行、`bankDetail` 开户支行详情。
- 职工列表操作列中的“资料”按钮打开 `StaffAttachmentDialog`，支持上传、预览、下载、删除人事资料。
- 人事资料默认类型为身份证、劳动合同、入职资料、银行卡、其他，前端允许用户自定义类型。
- 人事资料仅支持 PDF、Word、Excel、JPG、PNG，单个文件最大 30MB。
- 导入导出均走 hr 模块接口，属于当前项目比较标准的人员资料列表页。
- 单个新增和批量导入职员时，后端自动创建全零工资标准。
- 单删和批删职员时，职员与工资标准在同一事务内逻辑删除。
- 重新新增相同身份证的已删除职员时恢复原 ID、更新职员资料，并恢复原工资标准。

## 后端 API
- getAll => GET /hr/staff/all
- addStaff => POST /hr/staff/add
- editStaff => POST /hr/staff/edit
- deleteStaff => DELETE /hr/staff/deleteStaff?id=
- deleteMany => POST /hr/staff/deleteMany（模块接口存在，当前页单个删除更常用）
- addManyStaff => POST /hr/staff/addMany
- getModel => DOWNLOAD /hr/staff/getModel
- getExcel => DOWNLOAD /hr/staff/getExcel
- getStaffAttachments => GET /hr/staff/{staffId}/attachments
- uploadStaffAttachment => POST /hr/staff/{staffId}/attachments
- deleteStaffAttachment => DELETE /hr/staff/attachments/{id}
- downloadStaffAttachment => GET /hr/staff/attachments/{id}/download
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
