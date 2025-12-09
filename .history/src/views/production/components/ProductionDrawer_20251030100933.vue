<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="800px" :title="`${drawerProps.title}订单`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <!-- {{ drawerProps.row.maters }} -->
      <el-form-item label="订单编号" prop="orderNum">
        <el-input v-model="drawerProps.row.orderNum" placeholder="请填入订单编号" clearable></el-input>
      </el-form-item>
      <el-form-item label="客户" prop="custId">
        <el-select v-model="drawerProps.row.custId" placeholder="请选择客户" style="width: 240px">
          <el-option v-for="item in dictStore.dictMap['cust']" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="物料明细" prop="maters">
        <Mater v-model="drawerProps.row.maters" :options="dictStore.dictMap['mater']" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" placeholder="请填入订单备注" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, FormInstance } from "element-plus";
import Mater from "@/views/components/mater/Maters.vue";
import { de } from "element-plus/es/locale";
import { useDictStore } from "@/stores/modules/dict";
const dictStore = useDictStore();
onMounted(async () => {
  await dictStore.loadDicts(["mater"]);
});
// 验证规则
const rules = reactive({
  orderNum: [{ required: true, message: "请填入订单编号" }],
  custId: [{ required: true, message: "请选择客户" }],
  maters: [{ required: true, message: "请选择物料" }],
  remark: [{ required: false, message: "请填入订单备注" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    orderNum: "",
    custId: "",
    custName: "",
    createUserName: "",
    stateKey: "",
    maters: [{ id: "", totalNumber: 1 }],
    remark: "",
  },
  departmentMap: [],
  stateMap: [],
});
// 物料模块
const props = {
  // checkStrictly: true,
  value: "value", // 数据中的唯一标识字段
  label: "label", // 数据中的显示名称字段
  emitPath: false, // 只返回选中节点的值，不返回路径
};
// 接收父组件传过来的参数
const acceptParams = (params: DrawerProps) => {
  if (!Array.isArray(params.row.maters)) {
    params.row.maters = [{ id: "", totalNumber: 1 }];
  }
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
