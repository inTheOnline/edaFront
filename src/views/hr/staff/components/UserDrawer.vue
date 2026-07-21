<template>
  <el-drawer v-model="drawerVisible" :destroy-on-close="true" size="500px" :title="`${drawerProps.title}职工`">
    <el-form
      ref="ruleFormRef"
      label-width="100px"
      label-suffix=" :"
      :rules="rules"
      :disabled="drawerProps.isView"
      :model="drawerProps.row"
      :hide-required-asterisk="drawerProps.isView"
    >
      <el-form-item label="职工姓名" prop="name">
        <el-input v-model="drawerProps.row.name" placeholder="请填入职工姓名" clearable></el-input>
      </el-form-item>
      <el-form-item label="身份证号" prop="idCard">
        <el-input v-model="drawerProps.row.idCard" placeholder="请填入身份证号" clearable></el-input>
      </el-form-item>
      <el-form-item label="部门" prop="departmentId">
        <el-select v-model="drawerProps.row.departmentId" placeholder="请选择部门" clearable>
          <el-option v-for="item in drawerProps.departmentMap" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="宿舍号" prop="live">
        <el-input v-model="drawerProps.row.live" placeholder="宿舍号" clearable></el-input>
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="drawerProps.row.phone" placeholder="请填入手机号" clearable></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <el-select v-model="drawerProps.row.state" placeholder="请选择状态" clearable>
          <el-option v-for="item in drawerProps.stateMap" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="受教育程度" prop="edu">
        <el-input v-model="drawerProps.row.edu" placeholder="请填入教育程度" clearable></el-input>
      </el-form-item>
      <el-form-item label="考勤制度" prop="checksysId">
        <el-select v-model="drawerProps.row.checksysId" placeholder="请选择考勤制度" clearable>
          <el-option v-for="item in drawerProps.checksysMap" :key="item.value" :label="item.checksys" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="入职时间" prop="entryTime">
      <!-- 日期选择器，支持选择日期+时间（也可仅选日期） -->
      <el-date-picker
        v-model="drawerProps.row.createTime"
        type="date"  
        placeholder="请选择入职时间"
        format="YYYY-MM-DD" 
        value-format="YYYY-MM-DD"
        style="width: 100%;"
        :disabled-date="(date) => date.getTime() > Date.now()"
      ></el-date-picker>
      </el-form-item>
      <el-form-item label="合同截止" prop="contractDate">
      <!-- 日期选择器，支持选择日期+时间（也可仅选日期） -->
      <el-date-picker
        v-model="drawerProps.row.contractDate"
        type="date"  
        placeholder="请选择劳动合同截止日期"
        format="YYYY-MM-DD" 
        value-format="YYYY-MM-DD"
        style="width: 100%;"
        :disabled-date="(date) => date.getTime() < Date.now()"
      ></el-date-picker>
      </el-form-item>
      <el-form-item label="购买社保" prop="social">
        <el-select v-model="drawerProps.row.social" placeholder="请选择是否购买社保" clearable>
          <el-option label="深圳一档" :value="1" />
          <el-option label="深圳2档" :value="2" />
          <el-option label="深圳三档" :value="3" />
          <el-option label="否" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="银行卡号" prop="bankCard">
        <el-input v-model="drawerProps.row.bankCard" placeholder="请填入银行卡号" clearable></el-input>
      </el-form-item>
      <el-form-item label="开户银行" prop="bankBranch">
        <el-input v-model="drawerProps.row.bankBranch" placeholder="请填入开户银行" clearable></el-input>
      </el-form-item>
      <el-form-item label="支行详情" prop="bankDetail">
        <el-input v-model="drawerProps.row.bankDetail" placeholder="请填入开户支行详情" clearable></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="drawerProps.row.remark" type="textarea" :rows="3" placeholder="备注" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button v-show="!drawerProps.isView" type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { ref, reactive} from "vue";
import { ElMessage, FormInstance } from "element-plus";
import { de } from "element-plus/es/locale";
// 验证规则
const rules = reactive({
  name: [{ required: true, message: "请填写职工名称" }],
  departmentId: [{ required: true, message: "请填写部门" }],
  idCard: [{ required: true, message: "请填写身份证号" }],
  state: [{ required: true, message: "请填写状态" }],
  live: [{ required: true, message: "请填写宿舍号" }],
  phone: [{ required: true, message: "请填写手机号" }],
  edu: [{ required: false, message: "请填写学历" }],
  checksys: [{ required: true, message: "请输入考勤制度" }],
  social: [{ required: false, message: "请选择是否购买社保" }],
  bankCard: [{ required: false, message: "请填写银行卡号" }],
  bankBranch: [{ required: false, message: "请填写开户银行" }],
  bankDetail: [{ required: false, message: "请填写开户支行详情" }],
  remark: [{ required: false, message: "备注" }],
});
const drawerVisible = ref(false);
const drawerProps = ref<DrawerProps>({
  isView: false,
  title: "",
  row: {
    
  },
  departmentMap:[],
  stateMap:[],
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
      ElMessage.success({ message: `${drawerProps.value.title}职工成功！` });
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
