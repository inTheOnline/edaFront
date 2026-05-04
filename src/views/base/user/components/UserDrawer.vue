<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}用户信息`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="drawerProps.row.userName" placeholder="请输入用户名" clearable></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="drawerProps.row.password" placeholder="请输入密码" clearable></el-input>
      </el-form-item>
      <el-form-item label="职位" prop="roleId">
        <el-select v-model="drawerProps.row.roleId" placeholder="选择职位" style="width: 240px">
          <el-option v-for="item in dictStore.dictMap['role']" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="持有人" prop="name">
        <el-input v-model="drawerProps.row.name" placeholder="请输入姓名" clearable></el-input>
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="drawerProps.row.gender">
          <el-radio :value="1" label="男">男</el-radio>
          <el-radio :value="2" label="女">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="userNotes">
        <el-input v-model="drawerProps.row.userNotes" placeholder="备注" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive,onMounted } from "vue";
import { ElMessage, FormInstance } from "element-plus";
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()

// 本次改动：补齐用户抽屉参数类型，避免当前目录类型检查被历史缺失类型影响。
interface DrawerProps {
  isView: boolean;
  title: string;
  row: {
    workName?: string;
    userName: string;
    password: string;
    name: string;
    gender: number | string;
    roleId: number | string;
    userNotes?: string;
    [key: string]: any;
  };
  api?: (params: any) => Promise<any> | void;
  getTableList?: () => void | Promise<void>;
}

onMounted(async () => {
  await dictStore.loadDicts(['role']);
});
// 验证规则
const rules = reactive({
  avatar: [{ required: false, message: "头像" }],
  userName: [{ required: true, message: "用户名" }],
  password: [{ required: true, message: "密码" }],
  name: [{ required: true, message: "持有人" }],
  gender: [{ required: true, message: "性别" }],
  userNotes: [{ required: false, message: "用户备注" }],
  roleId: [{ required: true, message: "职位" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    workName: "",
    userName: "",
    password: "",
    name: "",
    gender: "",
    roleId: "",
    userNotes: "",
  },
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
      ElMessage.success({ message: `${drawerProps.value.title}用户信息成功！` });
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
