<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}报价`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="供应商" prop="supId">
        <el-select v-model="drawerProps.row.supId" placeholder="请选择供应商" clearable>
          <el-option v-for="item in dictStore.dictMap['sup']" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="工艺" prop="workId">
        <el-select v-model="drawerProps.row.workId" placeholder="请选择工艺" clearable>
          <el-option v-for="item in dictStore.dictMap['work']" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="物料编码" prop="materId">
        <el-select
          v-model="drawerProps.row.materId"
          placeholder="请选择物料"
          clearable
          filterable
          :allow-create="false"
          :default-first-option="true"
        >
          <el-option
            v-for="item in map"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="报价" prop="price">
        <el-input v-model="drawerProps.row.price" type="text" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" />
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
import { supWorkDate } from "@/api/interface/sup/supWork"
import { getMap } from "@/api/modules/mater";
import { supMap } from "@/api/interface/sup";
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
const map =ref()
// 初始化
onMounted(async () => {
  await dictStore.loadDicts(['mater','sup','work']);
  map.value=await getMap();
  map.value = map.value.data
  
});
// 验证规则
const rules = reactive({
  supId: [{ required: true, message: "请选择供应商" }],
  workId: [{ required: true, message: "请填写工艺" }],
  materId: [{ required: true, message: "请选择物料" }],
  price: [{ required: true, message: "不能为空"}],
  remark: [{ required: false, message: "请填写备注" }],
});

interface DrawerProps {
  title: string;
  isView: boolean;
  row: supWorkDate;
  api?: (params: any) => Promise<any>;
  getTableList?: () => void;
  options?: [];
}

const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    supId: 0,
    workId: 0,
    materId:0,
    price:0,
    remark: "",
  },
  options: [],
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
      ElMessage.success({ message: `${drawerProps.value.title}订单成功！` });
      drawerProps.value.getTableList!();
      drawerVisible.value = false;
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
  
</style>
