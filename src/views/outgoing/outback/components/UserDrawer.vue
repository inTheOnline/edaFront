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
      <el-form-item label="外发单号" prop="subcNum">
        <el-input v-model="drawerProps.row.subcNum" placeholder="请填写外发单号" clearable></el-input>
      </el-form-item>
      <el-form-item label="回执日期" prop="subcDate">
        <el-date-picker
          v-model="drawerProps.row.subcDate"
          type="date"
          placeholder="请选择日期"
          :disabled-date="disabledDate"
          :shortcuts="shortcuts"
          size="large"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="supName">
        <el-select v-model="drawerProps.row.supId" placeholder="请选择供应商" clearable>
          <el-option v-for="item in drawerProps.supMapList" :key="item.id" :label="item.supName" :value="item.id" />
        </el-select>
      </el-form-item>
      <!-- 物料明细 -->
      <el-form-item label="物料明细" prop="maters">
        <div class="mater-detail">
          <h1>物料列表</h1>
          <div v-for="(material, index) in drawerProps.row.maters" :key="index" class="mater-row">
            <!-- {{drawerProps.options}} -->
            <el-cascader
              v-model="material.id"
              :options="drawerProps.options"
              placeholder="请选择物料"
              :props="props"
              clearable
              :show-all-levels="false"
              style="width: 60%; margin-right: 20px"
            ></el-cascader>
            <el-input-number v-model="material.number" placeholder="数量" :min="1" style="width: 20%; margin-right: 20px" />
            <el-button type="danger" icon="Delete" @click="removeMaterial(index)">删除</el-button>
          </div>
          <el-button class="mater-button" type="primary" icon="Plus" @click="addMaterial">添加物料</el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive, onMounted} from "vue";
import { ElMessage, FormInstance } from "element-plus";
import { OutformDataAdd } from "@/api/interface/outgoing";
import { supMap } from "@/api/interface/sup";
// 初始化
onMounted(() => {
  //初始化一条物料
  addMaterial();
});
// 验证规则
const rules = reactive({
  subcDate: [{ required: true, message: "请选择外发日期" }],
  subcNum: [{ required: false, message: "请填写外发订单号" }],
  gender: [{ required: true, message: "请选择供应商" }],
  mateName: [{ required: true, message: "请选择物料名称" }],
  number: [{ required: true, message: "请填写数量" }],
  maters: [{ required: true, message: "请填写物料" }],
});
/**
 * 外发日期模块
 */
const disabledDate = (time: Date) => {
  return time.getTime() > Date.now();
};
const shortcuts = [
  {
    text: "今天",
    value: new Date(),
  },
  {
    text: "昨天",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 24);
      return date;
    },
  },
  {
    text: "一周前",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
      return date;
    },
  },
];

// 物料模块
const props = {
  // checkStrictly: true,
  value: 'id', // 数据中的唯一标识字段
  label: 'name', // 数据中的显示名称字段
  emitPath: false, // 只返回选中节点的值，不返回路径
};
interface DrawerProps {
  title: string;
  isView: boolean;
  row: OutformDataAdd;
  api?: (params: any) => Promise<any>;
  getTableList?: () => void;
  options?: [];
  supMapList?: supMap[];
}

const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    subcDate: new Date(),
    supId: 0,
    remark: "",
    maters: [
      { id: 0, number: 1 }, // 默认添加一个物料条目
    ],
  },
  options: [],
  supMapList: [],
});
// 添加物料条目
const addMaterial = () => {
  if (!drawerProps.value.row.maters) {
    drawerProps.value.row.maters = []; // 确保 maters 初始化为数组
  }
  drawerProps.value.row.maters.push({ id: 0, number: 1 });
};

// 删除物料条目
const removeMaterial = (index: number) => {
  if (drawerProps.value.row.maters && index >= 0 && index < drawerProps.value.row.maters.length) {
    drawerProps.value.row.maters.splice(index, 1);
  } else {
    console.warn("删除失败：无效的索引", index);
  }
};
// 物料名称模块
// const props = {
//   expandTrigger: "hover" as const
// };

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
