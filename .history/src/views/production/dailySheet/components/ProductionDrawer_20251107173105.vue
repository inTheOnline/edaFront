<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="800px" :title="`${drawerProps.title}生产记录`">
    <el-form
      ref="ruleFormRef"
      label-width="120px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="drawerProps.row.date"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          placeholder="选择生产日期"
          :disabled="drawerProps.isView"
        />
      </el-form-item>

      <el-form-item label="产品编号" prop="pId">
        <el-select v-model="drawerProps.row.pId" placeholder="选择产品" :disabled="drawerProps.isView">
          <el-option
            v-for="item in drawerProps.materialList"
            :key="item.value"
            :label="`${item.value}（${item.label}）`"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品名称" prop="pId">
        <el-select v-model="drawerProps.row.pId" placeholder="选择产品" :disabled="drawerProps.isView">
          <el-option
            v-for="item in drawerProps.materialList"
            :key="item.value"
            :label="`${item.value}（${item.label}）`"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="工序名" prop="process">
        <el-input v-model="drawerProps.row.process" placeholder="输入工序名" clearable :disabled="drawerProps.isView" />
      </el-form-item>

      <el-form-item label="机器序号" prop="machine">
        <el-input v-model="drawerProps.row.machine" placeholder="输入机器序号" clearable :disabled="drawerProps.isView" />
      </el-form-item>

      <el-form-item label="操作员" prop="operatorId">
        <el-select v-model="drawerProps.row.operatorId" placeholder="选择操作员（可选）" :disabled="drawerProps.isView">
          <el-option v-for="item in drawerProps.staffList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="生产时间（H）" prop="hours">
        <el-input
          v-model="drawerProps.row.hours"
          type="number"
          min="0"
          step="0.01"
          placeholder="输入生产时间"
          clearable
          :disabled="drawerProps.isView"
        />
      </el-form-item>

      <el-form-item label="生产数量" prop="qty">
        <el-input
          v-model="drawerProps.row.qty"
          type="number"
          min="1"
          placeholder="输入生产数量"
          clearable
          :disabled="drawerProps.isView"
        />
      </el-form-item>

      <el-form-item label="不良品数" prop="defect">
        <el-input
          v-model="drawerProps.row.defect"
          type="number"
          min="0"
          placeholder="输入不良品数（默认0）"
          clearable
          :disabled="drawerProps.isView"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="drawerProps.row.remark"
          type="textarea"
          rows="3"
          placeholder="输入备注信息（可选）"
          :disabled="drawerProps.isView"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit"> 确定 </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="ProductionDrawer">
import { ref, reactive } from "vue";
import { ElMessage, FormInstance } from "element-plus";

// 定义抽屉组件接收的参数类型
interface DrawerProps {
  isView: boolean;
  title: string;
  row: {
    id?: number;
    date: string;
    pId: number | string;
    process: string;
    machine: string;
    operatorId?: number | string;
    hours: number;
    qty: number;
    defect?: number;
    remark?: string;
  };
  materialList: { value: number; label: string;label: string }[];
  staffList: { value: number | string; label: string }[];
  api?: (data: any) => Promise<any>;
  getTableList?: () => void;
}

// 表单验证规则
const rules = reactive({
  date: [{ required: true, message: "请选择生产日期", trigger: "change" }],
  pId: [{ required: true, message: "请选择产品", trigger: "change" }],
  process: [{ required: true, message: "请输入工序名", trigger: "blur" }],
  machine: [{ required: true, message: "请输入机器序号", trigger: "blur" }],
  hours: [
    { required: true, message: "请输入生产时间", trigger: "blur" },
    { type: "number", min: 0, message: "生产时间不能为负数", trigger: "blur" },
  ],
  qty: [
    { required: true, message: "请输入生产数量", trigger: "blur" },
    { type: "number", min: 1, message: "生产数量至少为1", trigger: "blur" },
  ],
  defect: [{ type: "number", min: 0, message: "不良品数不能为负数", trigger: "blur" }],
});

// 抽屉显示状态
const drawerVisible = ref(false);

// 抽屉数据
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    date: "",
    pId: "",
    process: "",
    machine: "",
    hours: 0,
    qty: 1,
    defect: 0,
    remark: "",
  },
  materialList: [],
  staffList: [],
});

// 接收父组件参数
const acceptParams = (params: DrawerProps) => {
  // 处理默认值（新增时）
  if (!params.row.defect) params.row.defect = 0;
  drawerProps.value = params;
  drawerVisible.value = true;
};

// 表单提交
const ruleFormRef = ref<FormInstance>();
const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return;

    try {
      // 调用父组件传递的API（新增/编辑）
      await drawerProps.value.api!(drawerProps.value.row);
      ElMessage.success(`${drawerProps.value.title}生产记录成功！`);
      // 刷新表格数据
      drawerProps.value.getTableList!();
      // 关闭抽屉
      drawerVisible.value = false;
    } catch (error) {
      console.error("提交失败：", error);
      ElMessage.error("操作失败，请重试");
    }
  });
};

// 暴露方法给父组件
defineExpose({
  acceptParams,
});
</script>

<style lang="scss" scoped>
// 可根据需要添加自定义样式
.el-form-item {
  margin-bottom: 16px;
}
.el-textarea {
  width: 100%;
}
</style>
