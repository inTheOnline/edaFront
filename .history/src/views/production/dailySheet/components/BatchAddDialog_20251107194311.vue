<template>
  <el-dialog
    v-model="visible"
    title="批量添加生产记录"
    width="80%"
    :close-on-click-modal="false"
  >
    <div class="batch-add">
      <!-- 生产日期 -->
      <el-form :model="form" label-width="100px">
        <el-form-item label="生产日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择生产日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledFutureDate"
          />
        </el-form-item>
      </el-form>

      <!-- 批量表格 -->
      <el-table :data="form.records" border style="width: 100%; margin-top: 10px;">
        <el-table-column type="index" label="#" width="50" align="center" />
        
        <!-- 产品 -->
        <el-table-column label="产品" prop="pid" align="center" width="220">
          <template #default="{ row }">
            <el-select
              v-model="row.pid"
              placeholder="请选择产品"
              filterable
              default-first-option
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

        <!-- 工序 -->
        <el-table-column label="工序" prop="process" align="center" width="120">
          <template #default="{ row }">
            <el-input v-model="row.process" placeholder="输入工序" />
          </template>
        </el-table-column>

        <!-- 机器 -->
        <el-table-column label="机器" prop="machine" align="center" width="120">
          <template #default="{ row }">
            <el-input v-model="row.machine" placeholder="输入机器编号" />
          </template>
        </el-table-column>

        <!-- 操作员 -->
        <el-table-column label="操作员" prop="operatorId" align="center" width="150">
          <template #default="{ row }">
            <el-select
              v-model="row.operatorId"
              placeholder="选择操作员"
              filterable
              default-first-option
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

        <!-- 工时 -->
        <el-table-column label="工时(H)" prop="hours" align="center" width="100">
          <template #default="{ row }">
            <el-input v-model="row.hours" type="number" placeholder="0" />
          </template>
        </el-table-column>

        <!-- 数量 -->
        <el-table-column label="数量" prop="qty" align="center" width="100">
          <template #default="{ row }">
            <el-input v-model="row.qty" type="number" placeholder="0" />
          </template>
        </el-table-column>

        <!-- 不良品数 -->
        <el-table-column label="不良数" prop="defect" align="center" width="100">
          <template #default="{ row }">
            <el-input v-model="row.defect" type="number" placeholder="0" />
          </template>
        </el-table-column>

        <!-- 备注 -->
        <el-table-column label="备注" prop="remark" align="center" width="200">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="备注" />
          </template>
        </el-table-column>

        <!-- 删除行 -->
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加行按钮 -->
      <div class="actions">
        <el-button type="primary" @click="addRow">添加一行</el-button>
      </div>
    </div>

    <!-- Dialog footer -->
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

interface RecordItem {
  pid: number | string;
  process: string;
  machine: string;
  operatorId: number | string;
  hours: number | "";
  qty: number | "";
  defect: number | "";
  remark: string;
}

const visible = ref(false);
const materList = ref<{ value: number; label: string }[]>([]);
const staffList = ref<{ value: number | string; label: string }[]>([]);
const getTableList = ref<Function | null>(null);

const form = ref<{
  date: string;
  records: RecordItem[];
}>({
  date: "",
  records: [
    {
      pid: "",
      process: "",
      machine: "",
      operatorId: "",
      hours: "",
      qty: "",
      defect: "",
      remark: "",
    },
  ],
});

// 禁止选择未来日期
const disabledFutureDate = (time: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() > today.getTime();
};

// 打开 Dialog
const open = (params: any) => {
  visible.value = true;
  materList.value = params.materList || [];
  staffList.value = params.staffList || [];
  getTableList.value = params.getTableList;
  form.value.date = "";
  form.value.records = [
    {
      pid: "",
      process: "",
      machine: "",
      operatorId: staffList.value.length ? staffList.value[0].value : "",
      hours: "",
      qty: "",
      defect: "",
      remark: "",
    },
  ];
};

// 添加一行
const addRow = () => {
  form.value.records.push({
    pid: "",
    process: "",
    machine: "",
    operatorId: staffList.value.length ? staffList.value[0].value : "",
    hours: "",
    qty: "",
    defect: "",
    remark: "",
  });
};

// 删除一行
const removeRow = (index: number) => {
  form.value.records.splice(index, 1);
};

// 提交
const submit = async () => {
  if (!form.value.date) {
    return ElMessage.warning("请选择生产日期");
  }
  if (!form.value.records.length) {
    return ElMessage.warning("请至少添加一条记录");
  }

  // 每条记录加上日期
  const payload = form.value.records.map(r => ({
    ...r,
    date: form.value.date,
  }));

  try {
    await addManyProduction(payload);
    ElMessage.success("批量添加成功！");
    visible.value = false;
    getTableList.value?.();
  } catch (error) {
    console.error(error);
    ElMessage.error("操作失败，请重试");
  }
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
