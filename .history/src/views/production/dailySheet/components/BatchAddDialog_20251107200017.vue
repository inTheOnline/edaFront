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
            :disabled-date="disabledFutureDate"
          />
        </el-form-item>
      </el-form>

      <el-table :data="form.records" border style="width: 100%; margin-top: 10px;">
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 产品 -->
        <el-table-column label="产品" prop="pid" align="center" min-width="200">
          <template #default="{ row }">
            <el-select
              v-model="row.pid"
              placeholder="请选择产品"
              style="width: 100%;"
              filterable
              default-first-option
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
        <el-table-column label="工序" prop="process" align="center" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.process" placeholder="输入工序" />
          </template>
        </el-table-column>

        <!-- 机器 -->
        <el-table-column label="机器" prop="machine" align="center" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.machine" placeholder="输入机器编号" />
          </template>
        </el-table-column>

        <!-- 操作员 -->
        <el-table-column label="操作员" prop="operatorId" align="center" min-width="150">
          <template #default="{ row }">
            <el-select
              v-model="row.operatorId"
              placeholder="选择操作员"
              style="width: 100%;"
              filterable
              default-first-option
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

        <!-- 工时(H) -->
        <el-table-column label="工时(H)" prop="hours" align="center" width="100">
          <template #default="{ row }">
            <el-input
              v-model.number="row.hours"
              type="number"
              min="0"
              placeholder=""
              style="width: 100%; text-align: right;"
            />
          </template>
        </el-table-column>

        <!-- 数量 -->
        <el-table-column label="数量" prop="qty" align="center" width="100">
          <template #default="{ row }">
            <el-input
              v-model.number="row.qty"
              type="number"
              min="1"
              placeholder=""
              style="width: 100%; text-align: right;"
            />
          </template>
        </el-table-column>

        <!-- 不良品数 -->
        <el-table-column label="不良数" prop="defect" align="center" width="100">
          <template #default="{ row }">
            <el-input
              v-model.number="row.defect"
              type="number"
              min="0"
              placeholder=""
              style="width: 100%; text-align: right;"
            />
          </template>
        </el-table-column>

        <!-- 备注 -->
        <el-table-column label="备注" prop="remark" align="center" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="备注" />
          </template>
        </el-table-column>

        <!-- 删除按钮 -->
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
import { addBatchApi } from "@/api/modules/production";

const visible = ref(false);
const materList = ref<{ value: number; label: string; num?: string }[]>([]);
const staffList = ref<{ value: number | string; label: string }[]>([]);
let getTableList: (() => void) | null = null;

const form = ref({
  date: "",
  records: [] as Array<{
    pid: number | "";
    process: string;
    machine: string;
    operatorId: number | string | "";
    hours: number | null;
    qty: number | null;
    defect: number | null;
    remark: string;
  }>
});

// 禁止选择未来日期
const disabledFutureDate = (time: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 当天 0 点
  return time.getTime() > today.getTime();
};
// 打开 Dialog
const open = (params: {
  materList?: { value: number; label: string; num?: string }[];
  staffList?: { value: number | string; label: string }[];
  getTableList?: () => void;
}) => {
  visible.value = true;
  materList.value = params.materList || [];
  staffList.value = params.staffList || [];
  getTableList = params.getTableList || null;

  form.value.date = "";
  form.value.records = [];

  // 初始就添加一行
  addRow();
};

// 添加一行
const addRow = () => {
  const lastRow = form.value.records[form.value.records.length - 1];
  form.value.records.push({
    pid: "",
    process: "",
    machine: "",
    operatorId: lastRow ? lastRow.operatorId : "", // 自动继承上一行操作员
    hours: null,
    qty: null,
    defect: null,
    remark: ""
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

  const payload = form.value.records.map(r => ({
    ...r,
    date: form.value.date
  }));

  await add(payload);
  ElMessage.success("批量添加成功！");
  visible.value = false;
  getTableList?.();
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
