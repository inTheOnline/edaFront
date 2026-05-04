<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}客户`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="客户简称" prop="custNum">
        <el-input v-model="drawerProps.row.custNum" placeholder="请填入客户简称" clearable></el-input>
      </el-form-item>
      <el-form-item label="客户名称" prop="custName">
        <el-input v-model="drawerProps.row.custName" placeholder="请填入客户名称" clearable></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="active">
        <el-select 
          v-model="drawerProps.row.active" 
          placeholder="请选择状态" 
          clearable
          style="width: 100%;"
        >
          <!-- 循环渲染状态选项 -->
          <el-option
            v-for="item in drawerProps.stateEnum"
            :key="item.value"  
            :label="item.label"
            :value="item.value" 
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" placeholder="备注" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive} from "vue";
import { ElMessage, FormInstance } from "element-plus";
import { c } from "naive-ui";
// 验证规则
const rules = reactive({
  custName: [{ required: true, message: "请填写客户名称" }],
  custNum: [{ required: true, message: "请填写客户简称" }],
  remark: [{ required: false, message: "备注" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<any>({
  isView: false,
  title: "",
  row: {
    custNum: "",
    custName: "",
    remark: "",
  }
});
// 接收父组件传过来的参数
const acceptParams = async (params: any) => {
  // 过滤状态选项，满足条件的才显示在下拉框中
  params.stateEnum = params.stateEnum.filter(item => {
    // 条件1：value < 100
    // 条件2：value 除以10余2（item.value % 10 === 2）
    return item.value < 100 && item.value % 10 === 2;
  });
  drawerProps.value = params;
  drawerVisible.value = true;
};

// 提交数据（新增/编辑）
const ruleFormRef = ref<FormInstance>();
const handleSubmit = () => {
  ruleFormRef.value!.validate(async valid => {
    if (!valid) return;
    try {
      await drawerProps.value.api!(drawerProps.value.row);
      ElMessage.success({ message: `${drawerProps.value.title}客户成功！` });
      drawerProps.value.getTableList!();
      drawerVisible.value = false;
      console.log(drawerProps.value.row);
    } catch (error) {
      console.log(error);
    }
  });
};

defineExpose({
  acceptParams
});
</script>

<style lang="scss" scoped>
h1 {
  margin: 10px auto;
  font-size: 24px;
  font-weight: bold;
  color: #888888;
  text-align: center;
}
.mater-detail {
  width: 100%;
  padding: 10px;
  border: 2px solid #f2f2f2;
  border-radius: 10px;
  box-shadow: 2px 2px rgba(0, 0, 0, 0.3);
}
.mater-button {
  display: flex;
  justify-content: center; /* 水平居中 */
  width: 100px;
  padding: 10px;
  margin: 20px auto 0;
}
.mater-row {
  display: flex;
  justify-content: center; /* 水平居中 */
  padding: 5px;
}
</style>
