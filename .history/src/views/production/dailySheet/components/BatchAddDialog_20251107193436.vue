<template>
  <el-dialog
    v-model="visible"
    :title="`${title}生产记录`"
    width="80%"
    :close-on-click-modal="false"
  >
    <div class="batch-add">
      <!-- 顶部日期 -->
      <el-form :model="form" label-width="120px">
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

      <!-- 动态表格 -->
      <el-table :data="form.records" border style="width: 100%; margin-top: 10px;">
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 产品 -->
        <el-table-column label="产品" prop="pid" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.pid"
              placeholder="请选择或输入产品"
              filterable
              allow-create
              style="width: 100%;"
            >
              <el-option
                v-for="item in materList"
                :key="item.value"
                :label="`${item.label}（${item.num}）`"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 工序 -->
        <el-table-column label="工序" prop="process" align="center">
          <template #default="{ row }">
            <el-input v-model="row.process" placeholder="输入工序" />
          </template>
        </el-table-column>

        <!-- 机器 -->
        <el-table-column label="机器" prop="machine" align="center">
          <template #default="{ row }">
            <el-input v-model="row.machine" placeholder="输入机器编号" />
          </template>
        </el-table-column>

        <!-- 操作员 -->
        <el-table-column label="操作员" prop="operatorId" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.operatorId"
              placeholder="选择或输入操作员"
              filterable
              allow-create
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

        <!-- 工时、数量、不良品 -->
        <el-table-column label="工时(H)" prop="hours" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.hours"
              :min="0"
              step="0.01"
              controls-position="right"
              style="width: 100%;"
            />
          </template>
        </el-table-column>

        <el-table-column label="数量" prop="qty" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.qty"
              :min="1"
              controls-position="right"
              style="width: 100%;"
            />
          </template>
        </el-table-column>

        <el-table-column label="不良数" prop="defect" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.defect"
              :min="0"
              controls-position="right"
              style="width: 100%;"
            />
          </template>
        </el-table-column>

        <!-- 备注 -->
        <el-table-column label="备注" prop="remark" align="center">
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

    <!-- 底部操作按钮 -->
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";
import type { Option } from "@/components/ProTable/interface"; // 可自定义类型
import { addManyProduction } from "@/api/modules/production";

// Dialog 显示状态
const visible = ref(false);

// Dialog 标题
const title = ref("批量添加");

// 字典数据
const materList: Ref<{ value: number; label: string; num: string }[]> = ref([]);
const staffList: Ref<{ value: number | string; label: string }[]> = ref([]);

// 父组件刷新表格方法
let getTableList: (() => void) | null = null;

// 表单数据
interface RecordItem {
  pid: number | string;
  process: string;
  machine: string;
  operatorId: number | string;
  hours: number;
  qty: number;
  defect: number;
  remark: string;
}

interface BatchForm {
  date: string;
  records: RecordItem[];
}

const form: Ref<BatchForm> = ref({
  date: "",
  records: []
});

// 打开 Dialog 并接收父组件参数
const open = (params: {
  title?: string;
  materList?: { value: number; label: string; num: string }[];
  staffList?: { value: number | string; label: string }[];
  api?: (data: any) => Promise<any>;
  getTableList?: () => void;
}) => {
  visible.value = true;
  title.value = params.title || "批量添加";
  materList.value = params.materList || [];
  staffList.value = params.staffList || [];
  getTableList = params.getTableList || null;

  // 初始化表单
  form.value.date = "";
  form.value.records = [];

  // 初始就添加一行
  addRow();
};

// 新增一行
const addRow = () => {
  const lastRow = form.value.records[form.value.records.length - 1];
  form.value.records.push({
    pid: "",
    process: "",
    machine: "",
    operatorId: lastRow ? lastRow.operatorId : "", // 自动继承上一行操作员
    hours: 0,
    qty: 1,
    defect: 0,
    remark: ""
  });
};

// 删除行
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

  // 拼装数据
  const payload = form.value.records.map(r => ({ ...r, date: form.value.date }));

  try {
    await addManyProduction(payload);
    ElMessage.success("批量添加成功！");
    visible.value = false;
    getTableList?.();
  } catch (err) {
    console.error(err);
    ElMessage.error("批量添加失败，请重试！");
  }
};

// 暴露方法给父组件
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
.el-table .el-input,
.el-table .el-input-number,
.el-table .el-select {
  width: 100%;
}
  .el-input-number {
    text-align: right; 
  }
</style>
