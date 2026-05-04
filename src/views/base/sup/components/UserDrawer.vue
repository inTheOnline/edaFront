<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}供应商`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="供应商名称" prop="supName">
        <el-input v-model="drawerProps.row.supName" placeholder="请填入供应商名称" clearable></el-input>
      </el-form-item>
      <el-form-item label="简称" prop="callName">
        <el-input v-model="drawerProps.row.callName" placeholder="请填入简称" clearable></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <el-select v-model="drawerProps.row.state" placeholder="请选择状态" clearable>
          <el-option v-for="item in stateMap" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="系数" prop="constant">
        <el-input v-model="drawerProps.row.constant" placeholder="请填入系数" clearable></el-input>
      </el-form-item>
      <el-form-item label="供货类型" prop="workId">
        <el-select v-model="drawerProps.row.workId" placeholder="请选择供货类型" clearable>
          <el-option v-for="item in dictStore.dictMap['work']" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive,onMounted} from "vue";
import { ElMessage, FormInstance } from "element-plus";
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
const stateMap = ref();
onMounted(async () => {
  await dictStore.loadDicts(['work','state']);
  console.log(dictStore.dictMap['state'])
  stateMap.value = dictStore.dictMap['state'].filter(item => Math.abs(item.value) % 10 === 2);
});
// 验证规则
const rules = reactive({
  workName: [{ required: true, message: "请填写供应商名称" }],
  remark: [{ required: false, message: "备注" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    supName: "",
    state: 0,
    callName: "",
    constant: 0.0,
    workId: 0,
    remark: "",
  }
});
// 接收父组件传过来的参数
const acceptParams = (params: DrawerProps) => {
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
      ElMessage.success({ message: `${drawerProps.value.title}供应商成功！` });
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
