<template>
  <el-dialog v-model="dialogVisible" title="修改密码" width="500px" draggable>
    <el-form
      ref="formRef"
      :model="subData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="旧密码" prop="oldPass">
        <el-input v-model="subData.oldPass" type="password" autocomplete="off" />
      </el-form-item>

      <el-form-item label="新密码" prop="newPass">
        <el-input v-model="subData.newPass" type="password" autocomplete="off" />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPass">
        <el-input v-model="subData.confirmPass" type="password" autocomplete="off" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { alterPass } from "@/api/modules/users"
const dialogVisible = ref(false);
const openDialog = () => {
  dialogVisible.value = true;
};
defineExpose({ openDialog });

const formRef = ref<FormInstance>();

const subData = reactive({
  oldPass: "",
  newPass: "",
  confirmPass: ""
});

const rules: FormRules = {
  oldPass: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPass: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPass: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== subData.newPass) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      // 这里提交表单
      await alterPass(subData);
      dialogVisible.value = false;
      location.reload()
    }
  });
};
</script>
