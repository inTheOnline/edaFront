# 辅材基础信息

- 分类型维护吸塑、纸箱、螺母、隔板档案。
- 吸塑页“新增吸塑”右侧的“物料关系维护”按钮打开关系弹窗，支持搜索、新增、编辑、删除。
- 物料选项复用 mater 字典，吸塑选项来自有效吸塑档案。“物料数量”显示为“吸塑格数”，必须大于 0；吸塑数量不在列表、表单显示，编辑保留原值，新建默认 1。
- 每行“是否启用”开关立即保存，失败保留原状态；停用关系不参与快速请购预览和来源记录。编辑、导入不重置开关状态。
- 上线前执行后端 sql/godown/20260918_mater_assist_enabled.sql，已有及新增关系默认启用。
- 同一物料与吸塑不能重复绑定，允许一个物料关联不同吸塑。删除只逻辑删除关系。
- 新增关系默认使用场景为 default，编辑保留原使用场景；不改变导入流程。
- 组件：components/PvcRelationDialog.vue，使用 Element Plus 表单校验、保存状态及删除确认。
- API：GET /assistMater/pvc/relations、POST /assistMater/pvc/relation/save、DELETE /assistMater/pvc/relation/{id}。
- 启停接口：PUT /assistMater/pvc/relation/{id}/enabled?enabled=true|false。
- 档案接口：POST /assistMater/{type}/page、POST /assistMater/save、DELETE /assistMater/delete/{id}。
