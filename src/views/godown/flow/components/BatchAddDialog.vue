<template>
  <el-dialog
    v-model="visible"
    title="批量添加流水"
    width="80%"
    :close-on-click-modal="false"
  >
    <div class="batch-add">
      <el-form :model="form" label-width="100px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="流水类型" prop="flowType">
        <!-- 替换 el-input 为 el-select 下拉选择框 -->
        <el-select 
          v-model="form.flowType" 
          placeholder="请选择流水类型" 
          clearable
          filterable 
          style="width: 220px"
        >
          
          <!-- 遍历 GodownTypeMap 生成下拉选项 -->
          <el-option
            v-for="item in GodownTypeMap"
            :key="item.label"
            :label="item.label" 
            :value="item.label" 
            
          >
            <!-- 👇 自定义颜色 -->
            <span :style="{ color: item.color, fontWeight: 500 }">
              {{ item.label }}
            </span>
            <span
              style="
                float: right;
                color: var(--el-text-color-secondary);
                font-size: 13px;
              "
            >
              {{ item.name }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      </el-form>

      <el-table :data="form.records" border style="width: 100%; margin-top: 10px;">
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 产品 -->
        <el-table-column label="产品" prop="materId" align="center" min-width="200">
          <template #default="{ row }">
            <el-select
              v-model="row.materId"
              placeholder="请选择产品"
              style="width: 100%;"
              filterable
              default-first-option
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



        <!-- 数量 -->
        <el-table-column label="数量" prop="number" align="center" width="100">
          <template #default="{ row }">
            <el-input
              v-model.number="row.number"
              type="number"
              min="1"
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
import { addFlowBatchApi } from "@/api/modules/godown/flow";
import { GodownTypeMap } from "@/enums/godownEnum";
import { getTypeByFlow } from "@/utils/godown/flow";

const visible = ref(false);
const materList = ref<{ value: number; label: string; num?: string }[]>([]);
let getTableList: (() => void) | null = null;

const form = ref({
  date: "",
  flowType: "",
  type: "",
  records: [] as Array<{
    materId: number | "";
    number: number | null;
    remark: string;
  }>
});
// 工具函数：获取当前标准ISO日期时间（后端LocalDateTime默认完美解析）
const getToday = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  // 实时时分秒
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  // 核心：日期和时间用 T 连接（ISO标准！）
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}
const getTodayDateOnly = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
// 打开 Dialog
const open = (params: {
  materList?: { value: number; label: string; num?: string }[];
  getTableList?: () => void;
}) => {
  visible.value = true;
  materList.value = params.materList || [];
  getTableList = params.getTableList || null;

  form.value.date = getTodayDateOnly(); // 默认日期为今天
  form.value.records = [];

  // 初始就添加一行
  addRow();
};

// 添加一行
const addRow = () => {
  const lastRow = form.value.records[form.value.records.length - 1];
  form.value.records.push({
    materId: "", 
    number: null,
    remark: ""
  });
};

// 删除一行
const removeRow = (index: number) => {
  form.value.records.splice(index, 1);
};

// 提交
const submit = async () => {
  if (!form.value.flowType) {
    return ElMessage.warning("请选择流水类型");
  }
  if (!form.value.records.length) {
    return ElMessage.warning("请至少添加一条记录");
  }

  const payload = form.value.records.map(r => ({
    ...r,
    createdAt:form.value.date,
    flowType: form.value.flowType,
    type:getTypeByFlow(form.value.flowType)
  }));

  await addFlowBatchApi(payload);
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
