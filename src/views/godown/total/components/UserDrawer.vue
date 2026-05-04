<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}物料`">
    <el-form
      ref="ruleFormRef"
      label-width="150px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="产品编号" prop="materId">
        <el-select 
          v-model="drawerProps.row.materId" 
          popper-class="short-select-dropdown"
          placeholder="选择或输入产品" 
          :disabled="drawerProps.isView"
          filterable  
          allow-create   
          default-first-option 
        >
          <el-option 
            v-for="item in drawerProps.materialList" 
            :key="item.value" 
            :label="`${item.num}（${item.label}）`" 
            :value="item.value" 
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="流水类型" prop="flowType" >
        <el-input v-model="drawerProps.row.flowType" placeholder="请输入流水类型" clearable filterable></el-input>
      </el-form-item>
      <el-form-item label="数量(pcs)" prop="number">
        <el-input v-model="drawerProps.row.number" placeholder="请输入数量(pcs)" clearable></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" placeholder="请输入备注" clearable></el-input>
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
import { de } from "element-plus/es/locale";
import {useAuthStore} from '@/stores/modules/auth'
import {useDictStore} from '@/stores/modules/dict'
const authStore = useAuthStore();
const dictStore = useDictStore();
onMounted(async () => {
  await dictStore.loadDicts(['cust','project']);
  
});
// 验证规则
const rules = reactive({
  materId: [{ required: true, message: "请选择物料" }],
  flowType: [{ required: true, message: "请填入流水类型" }],
  number: [{ required: true, message: "请填入数量(pcs)" }],
  remark: [{ required: false, message: "请输入备注" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  materialList: [],
  title: "",
  row: {
    
  },
});
// 接收父组件传过来的参数
const acceptParams = (params: DrawerProps) => {
  drawerProps.value.materialList = params.materialList;
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
      ElMessage.success({ message: `${drawerProps.value.title}物料成功！` });
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

<style lang="scss" >
.short-select-dropdown {
  max-width: 330px !important; /* 改成你想要的最大宽度 */
}
h1 {
  margin: 10px auto;
  font-size: 24px;
  font-weight: bold;
  color: #888888;
  text-align: center;
}
</style>
