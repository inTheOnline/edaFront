<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}项目`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="项目编号" prop="num">
        <el-input v-model="drawerProps.row.num" placeholder="请填入编号" clearable></el-input>
      </el-form-item>
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="drawerProps.row.name" placeholder="请填入名称" clearable></el-input>
      </el-form-item>
      <el-form-item label="客户" prop="custId">
        <el-select v-model="drawerProps.row.custId" placeholder="请选择客户" clearable>
          <el-option v-for="item in drawerProps.custMapList" :key="item.custId" :label="item.custName" :value="item.custId" />
        </el-select>
      </el-form-item>
       <!-- 物料明细 -->
        <!-- 
        <el-form-item label="物料明细" prop="maters">
        <div class="mater-detail">
          <h1>物料列表</h1>
          <div v-for="(material, index) in drawerProps.row.maters" :key="index" class="mater-row">
            <el-input v-model="material.mateNum" placeholder="请填入编号" clearable style="width: 60%; margin-left: 20px"></el-input>
            <el-input v-model="material.mateName" placeholder="请填入名称" clearable style="width: 60%; margin:0 20px 0 10px"></el-input>
            <el-button type="danger" icon="Delete" @click="removeMaterial(index)">删除</el-button>
          </div>
          <el-button class="mater-button" type="primary" icon="Plus" @click="addMaterial">添加物料</el-button>
        </div>
      </el-form-item> -->
      <el-form-item label="项目状态" prop="active">
        <el-select v-model="drawerProps.row.active" placeholder="请选择项目状态" clearable>
          <el-option v-for="item in stateMap" :key="item.value" :label="item.label" :value="item.value" />
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
import { ref, reactive, onMounted, onUnmounted,computed} from "vue";
import { ElMessage, FormInstance } from "element-plus";
import { CustMap } from "@/api/interface/cust";
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
// 验证规则
const rules = reactive({
  num: [{ required: true, message: "请填写项目编号" }],
  name: [{ required: true, message: "请填写项目名称" }],
  custId: [{ required: true, message: "请选择项目客户" }],
  active:[{ required: true, message: "请选择状态" }],
  remark: [{ required: false, message: "备注" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    num: "",
    name: "",
    custId: 0,
    remark: "",
    active:0,
    // maters: [],
  }
});
// 计算属性：筛选 value % 10 === 3 的项
const stateMap = computed(() => 
  dictStore.dictMap['state']?.filter(item => item.value % 10 === 3) ?? []
);
// 物料模块
interface DrawerProps {
  title: string;
  isView: boolean;
  row: {
    num: string;
    name: string;
    custId: number;
    remark: string;
    active:number;
    // maters: {
    //   mateName: string;
    //   mateNum: string;
    // }[];
  };
  api?: (params: any) => Promise<any>;
  getTableList?: () => void;
  custMapList?: CustMap[];
}
onMounted(async() => {
  await dictStore.loadDicts(['state']);
})
// 添加物料条目
// const addMaterial = () => {
//   if (!drawerProps.value.row.maters) {
//     drawerProps.value.row.maters = []; // 确保 maters 初始化为数组
//   }
//   drawerProps.value.row.maters.push({mateName: "", mateNum: "X2Y00" });
// };

// 删除物料条目
// const removeMaterial = (index: number) => {
//   if (drawerProps.value.row.maters && index >= 0 && index < drawerProps.value.row.maters.length) {
//     drawerProps.value.row.maters.splice(index, 1);
//   } else {
//     console.warn("删除失败：无效的索引", index);
//   }
// };
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
      ElMessage.success({ message: `${drawerProps.value.title}项目成功！` });
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
