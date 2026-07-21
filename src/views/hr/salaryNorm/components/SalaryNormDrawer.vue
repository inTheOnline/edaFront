<template>
  <el-drawer v-model="visible" title="编辑工资标准" size="560px" destroy-on-close>
    <el-form :model="form" label-width="110px">
      <el-form-item label="员工">
        <el-select v-model="form.staffId" disabled style="width: 100%">
          <el-option v-for="item in drawer.staffDict" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-for="item in fields" :key="item.prop" :label="item.label">
        <el-input-number v-model="form[item.prop]" :min="0" :precision="2" :controls="false" style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { SalaryNorm } from "@/api/interface/hr";

const fields = [
  { prop: "basicNorm", label: "工资基数" }, { prop: "overNorm", label: "加班基数" },
  { prop: "nightNorm", label: "夜班补贴基数" }, { prop: "otherNorm", label: "其他补贴" },
  { prop: "postNorm", label: "岗位补贴" }, { prop: "bonus", label: "奖金" },
  { prop: "eatCutpay", label: "餐住扣款" }, { prop: "fixedDeduction", label: "固定扣款" },
  { prop: "social", label: "社保扣款" }
] as const;
const visible = ref(false);
const form = ref<SalaryNorm>({});
const drawer = reactive({ staffDict: [] as { value: string | number; label: string }[], api: undefined as any, refresh: undefined as any });

const acceptParams = (params: any) => {
  Object.assign(drawer, params);
  form.value = { ...params.row };
  visible.value = true;
};
const submit = async () => {
  await drawer.api(form.value);
  ElMessage.success("编辑工资标准成功");
  visible.value = false;
  drawer.refresh?.();
};
defineExpose({ acceptParams });
</script>
