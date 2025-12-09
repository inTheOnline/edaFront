<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${dialogProps.title}生产记录（批量）`"
    width="90%"
    :destroy-on-close="true"
  >
    <!-- 共享日期 -->
    <el-form label-width="120px">
      <el-form-item label="生产日期" required>
        <el-date-picker
          v-model="sharedDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          placeholder="选择统一生产日期"
        />
      </el-form-item>
    </el-form>

    <!-- 动态表格 -->
    <el-table :data="records" border style="width: 100%; margin-bottom: 10px;">
      <el-table-column label="序号" width="70" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>

      <el-table-column label="产品" min-width="200" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.pid"
            filterable
            placeholder="选择或输入产品"
            default-first-option
          >
            <el-option
              v-for="item in dialogProps.materialList"
              :key="item.value"
              :label="`${item.label}（${item.num}）`"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="工序" min-width="150" align="center">
        <template #default="{ row }">
          <el-input v-model="row.process" placeholder="输入工序名" clearable />
        </template>
      </el-table-column>

      <el-table-column label="机器序号" min-width="120" align="center">
        <template #default="{ row }">
          <el-input v-model="row.machine" placeholder="输入机器号" clearable />
        </template>
      </el-table-column>

      <el-table-column label="操作员" min-width="180" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.operatorId"
            filterable
            placeholder="选择或输入操作员"
            default-first-option
          >
            <el-option
              v-for="item in dialogProps.staffList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="生产时间（H）" width="140" align="center">
        <template #default="{ row }">
          <el-input v-model.number="row.hours" type="number" min="0" step="0.1" />
        </template>
      </el-table-column>

      <el-table-column label="生产数量" width="140" align="center">
        <template #default="{ row }">
          <el-input v-model.number="row.qty" type="number" min="1" />
        </template>
      </el-table-column>

      <el-table-column label="不良品数" width="140" align="center">
        <template #default="{ row }">
          <el-input v-model.number="row.defect" type="number" min="0" />
        </template>
      </el-table-column>

      <el-table-column label="备注" min-width="180" align="center">
        <template #default="{ row }">
          <el-input v-model="row.remark" placeholder="备注（可选）" clearable />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ $index }">
          <el-button type="danger" link @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 底部按钮 -->
    <div class="footer-btns" style="text-align: right;">
      <el-button type="primary" plain @click="addRow">添加一行</el-button>
      <el-button type="success" @click="handleSubmit">提交所有记录</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts" name="ProductionBatchDialog">
import { ref } from "vue";
import { ElMessage } from "element-plus";

// 数据结构
interface ProductionRecord {
  date: string;
  pid: number;
  process: string;
  machine: string;
  operatorId?: number | string;
  hours: number;
  qty: number;
  defect?: number;
  remark?: string;
}

// 父组件传参类型
interface DialogProps {
  title: string;
  materialList: { value: number; label: string; num: string }[];
  staffList: { value: number | string; label: string }[];
  api?: (data: ProductionRecord[]) => Promise<any>;
  getTableList?: () => void;
}

// 状态
const dialogVisible = ref(false);
const sharedDate = ref<string>("");
const records = ref<ProductionRecord[]>([]);
const dialogProps = ref<DialogProps>({
  title: "",
  materialList: [],
  staffList: [],
});

// 添加行
const addRow = () => {
  records.value.push({
    date: "",
    pid: 0,
    process: "",
    machine: "",
    operatorId: 0,
    hours: 0,
    qty: 1,
    defect: 0,
    remark: "",
  });
};

// 删除行
const removeRow = (index: number) => {
  records.value.splice(index, 1);
};

// 提交
const handleSubmit = async () => {
  if (!sharedDate.value) {
    return ElMessage.warning("请选择统一生产日期");
  }
  if (records.value.length === 0) {
    return ElMessage.warning("请至少添加一条记录");
  }

  const data = records.value.map((r) => ({ ...r, date: sharedDate.value }));

  try {
    await dialogProps.value.api?.(data);
    ElMessage.success("批量添加成功！");
    dialogProps.value.getTableList?.();
    dialogVisible.value = false;
  } catch (error) {
    console.error(error);
    ElMessage.error("批量添加失败，请重试");
  }
};

// 父组件调用
const acceptParams = (params: DialogProps) => {
  dialogProps.value = params;
  records.value = [];
  sharedDate.value = "";
  dialogVisible.value = true;
};

// 暴露方法给父组件
defineExpose({ acceptParams });
</script>

<style scoped lang="scss">
.footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.el-input,
.el-select {
  width: 100%;
}
</style>
