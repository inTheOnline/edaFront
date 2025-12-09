<template>
  <el-dialog
    v-model="visible"
    title="批量添加生产记录"
    width="80%"
    :close-on-click-modal="false"
  >
    <div class="batch-add">
      <el-form :model="form" label-width="100px">
        <el-form-item label="生产日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择生产日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>

      <el-table :data="form.records" border style="width: 100%; margin-top: 10px;">
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column label="产品" prop="pid" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.pid"
              placeholder="请选择产品"
              style="width: 100%;"
            >
              <el-option
                v-for="item in materList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="工序" prop="process" align="center">
          <template #default="{ row }">
            <el-input v-model="row.process" placeholder="输入工序" />
          </template>
        </el-table-column>
        <el-table-column label="机器" prop="machine" align="center">
          <template #default="{ row }">
            <el-input v-model="row.machine" placeholder="输入机器编号" />
          </template>
        </el-table-column>
        <el-table-column label="操作员" prop="operatorId" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.operatorId"
              placeholder="选择操作员"
              style="width: 100%;"
            >
              <el-option
                v-for="item in staffList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-form-item label="操作员" prop="operatorId">

      </el-form-item>
        <el-table-column label="工时(H)" prop="hours" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.hours" :min="0" />
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="qty" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.qty" :min="0" />
          </template>
        </el-table-column>
        <el-table-column label="不良数" prop="defect" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.defect" :min="0" />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" align="center">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="备注" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="actions">
        <el-button type="primary" @click="addRow">添加一行</el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { addManyProduction } from "@/api/modules/production";

const visible = ref(false);
const materList = ref([]);
const staffList = ref([]);
const getTableList = ref<Function | null>(null);

const form = ref({
  date: "",
  records: []
});

const open = (params: any) => {
  visible.value = true;
  materList.value = params.materList || [];
  staffList.value = params.staffList || [];
  getTableList.value = params.getTableList;
  form.value.date = "";
  form.value.records = [];
};

const addRow = () => {
  form.value.records.push({
    pid: "",
    process: "",
    machine: "",
    operatorId: "",
    hours: 0,
    qty: 0,
    defect: 0,
    remark: ""
  });
};

const removeRow = (index: number) => {
  form.value.records.splice(index, 1);
};

const submit = async () => {
  if (!form.value.date) {
    return ElMessage.warning("请选择生产日期");
  }
  if (!form.value.records.length) {
    return ElMessage.warning("请至少添加一条记录");
  }

  // 为每条记录添加日期字段
  const payload = form.value.records.map(r => ({
    ...r,
    date: form.value.date
  }));

  await addManyProduction(payload);
  ElMessage.success("批量添加成功！");
  visible.value = false;
  getTableList.value?.();
};

defineExpose({ open });
</script>

<style scoped>
.batch-add {
  max-height: 70vh;
  overflow: auto;
}
.actions {
  margin-top: 10px;
  text-align: left;
}
</style>
