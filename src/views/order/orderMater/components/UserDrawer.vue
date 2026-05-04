<template>
  <el-drawer 
    v-model="drawerVisible" 
    :destroy-on-close="true" 
    size="800px" 
    :title="drawerProps.title"
  >
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=":"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="订单编号" prop="orderNum">
        <el-input v-model="drawerProps.row.orderNum" placeholder="请填入订单编号" clearable></el-input>
      </el-form-item>
      <el-form-item label="客户" prop="custId">
        <el-select
          v-model="drawerProps.row.custId"
          placeholder="请选择客户"
          style="width: 240px"
        >
          <el-option
            v-for="item in dictStore.dictMap['cust'] || []"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="出货明细" prop="maters">
        <Mater
          v-model="drawerProps.row.maters"
          :options="dictStore.dictMap['mater'] || []"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" placeholder="请填入送货备注" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-draw>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive, onMounted } from "vue";
import { ElLoading, ElMessage, FormInstance } from "element-plus";
import Mater from "@/views/components/mater/Maters.vue"
import { useDictStore } from "@/stores/modules/dict"

// ====================== 类型定义（修复报错） ======================
interface DrawerProps {
  isView?: boolean;
  title?: string;
  row?: any;
  api?: (row: any) => Promise<any>;
  getTableList?: () => void;
}

const dictStore = useDictStore()
onMounted(async () => {
  await dictStore.loadDicts(["mater"]);
});

// 验证规则
const rules = reactive({
  maters: [{ required: true, message: "请选择物料" }],
  remark: [{ required: false, message: "请填入送货备注" }],
});

const drawerVisible = ref(false);
// ✅ 初始化默认值
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    orderMaterId: '',
    number: 1,
    remark: "",
    maters: [] // 初始化maters数组，避免报错
  },
});

// 接收父组件参数
const acceptParams = (params: DrawerProps) => {
  if (!params.row) params.row = {};
  // 初始化maters为数组
  if (!Array.isArray(params.row.maters)) {
    params.row.maters = [{ id: '', totalNumber: 1 }];
  }
  drawerProps.value = params;
  drawerVisible.value = true;
};

// 提交
const ruleFormRef = ref<FormInstance>();
const handleSubmit = async () => {
  if (!ruleFormRef.value) return;
  await ruleFormRef.value.validate();
  
  const loading = ElLoading.service({ text: "提交中..." });
  try {
    await drawerProps.value.api?.(drawerProps.value.row);
    ElMessage.success(`${drawerProps.value.title}订单成功！`);
    drawerProps.value.getTableList?.();
    drawerVisible.value = false;
  } catch (error) {
    ElMessage.error("提交失败，请检查数据");
    console.error("Submit failed:", error);
  } finally {
    loading.close();
  }
};

// ✅ 暴露 openDrawer 方法（修复主页面报错）
const openDrawer = (type: string, row?: any) => {
  drawerProps.value = {
    isView: type === '查看',
    title: type,
    row: row || { orderMaterId: '', number: 1, remark: '', maters: [] }
  };
  drawerVisible.value = true;
};

// 只暴露 acceptParams 和 openDrawer
defineExpose({
  acceptParams,
  openDrawer
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