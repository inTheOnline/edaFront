<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}原材料`">
    <el-form
      ref="ruleFormRef"
      label-width="150px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="编号" prop="rawNum">
        <el-input v-model="drawerProps.row.rawNum" placeholder="请填入物料编码" clearable></el-input>
      </el-form-item>
      <el-form-item label="材质" prop="essence">
        <el-input v-model="drawerProps.row.essence" placeholder="请填入材质" clearable></el-input>
      </el-form-item>
      <el-form-item label="规格" prop="rawSpecs">
        <el-input v-model="drawerProps.row.rawSpecs" placeholder="请输入规格" clearable></el-input>
      </el-form-item>
      <el-form-item label="单条重量" prop="utilWeight">
        <el-input v-model="drawerProps.row.utilWeight" placeholder="请输入单条重量" clearable></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" placeholder="请输入备注" clearable></el-input>
      </el-form-item>
      <el-form-item label="材料类型" prop="type">
        <el-input v-model="drawerProps.row.type" placeholder="材料类型" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, FormInstance } from "element-plus";
import { de } from "element-plus/es/locale";
import { useAuthStore } from "@/stores/modules/auth";
import { useDictStore } from "@/stores/modules/dict";
const authStore = useAuthStore();
const dictStore = useDictStore();
onMounted(async () => {
  await dictStore.loadDicts(["cust"]);
});
// 验证规则
const rules = reactive({
  mateNum: [{ required: true, message: "请填入物料编码" }],
  mateName: [{ required: true, message: "请填入物料名称" }],
  finalSpecs: [{ required: false, message: "请输入终端客户物料编号" }],
  weight: [{ required: false, message: "请输入实际重量" }],
  s: [{ required: false, message: "请输入表面积" }],
  theoryWeight: [{ required: false, message: "请填入理论重量" }],
  price: [{ required: false, message: "请输入价格信息" }],
  custId: [{ required: false, message: "请选择客户" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {},
});
// 接收父组件传过来的参数
const acceptParams = (params: DrawerProps) => {
  drawerProps.value = params;
  drawerVisible.value = true;
};

// 提交数据（新增/编辑）
const ruleFormRef = ref<FormInstance>();
const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return;
    try {
      await drawerProps.value.api!(drawerProps.value.row);
      ElMessage.success({ message: `${drawerProps.value.title}原材料成功！` });
      drawerProps.value.getTableList!();
      drawerVisible.value = false;
      console.log(drawerProps.value.row);
    } catch (error) {
      console.log(error);
    }
  });
};

defineExpose({
  acceptParams,
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
