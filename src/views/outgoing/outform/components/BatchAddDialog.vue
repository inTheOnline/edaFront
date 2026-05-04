<template>
  <el-dialog v-model="visible" title="批量新增外发表" width="980px" :close-on-click-modal="false">
    <el-form :model="headerForm" label-width="92px" class="batch-header">
      <el-form-item label="外发日期">
        <el-date-picker
          v-model="headerForm.subcDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="外发前缀">
        <el-input v-model="headerForm.subcNumPrefix" readonly />
      </el-form-item>
      <el-form-item label="外发单号">
        <el-input v-model="headerForm.subcNumNo" placeholder="请输入单号，如 20260424001" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-select v-model="headerForm.supId" style="width: 100%" filterable @change="handleSupplierChange">
          <el-option v-for="item in suppliers" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="整单备注" class="full-row">
        <el-input v-model="headerForm.subcRemark" />
      </el-form-item>
    </el-form>

    <el-table :data="rows" border class="batch-table">
      <el-table-column type="index" label="#" width="52" align="center" />
      <el-table-column label="物料" min-width="240">
        <template #default="{ row }">
          <el-select v-model="row.materId" style="width: 100%" filterable>
            <el-option
              v-for="item in maters"
              :key="item.value"
              :label="`${item.num || item.label} - ${item.label}`"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="外发数量" min-width="200">
        <template #default="{ row }">
          <el-input-number v-model="row.number" :min="1" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="120">
        <template #default="{ row }">
          <el-select v-model="row.state" style="width: 100%">
            <el-option v-for="item in normalizedStateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="行备注" min-width="220">
        <template #default="{ row }">
          <el-input v-model="row.remark" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="batch-actions">
      <el-button type="primary" plain @click="addRow">新增一行</el-button>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确认批量新增</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import type { EnumProps } from "@/components/ProTable/interface";
import type { OutformBatchPayload } from "../../service";

type SupplierOption = { label: string; value: string | number; callName?: string };

type BatchParams = {
  suppliers: SupplierOption[];
  maters: Array<{ label: string; value: string | number; num?: string }>;
  stateOptions: EnumProps[];
  submitApi: (payload: OutformBatchPayload) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const suppliers = ref<BatchParams["suppliers"]>([]);
const maters = ref<BatchParams["maters"]>([]);
const stateOptions = ref<EnumProps[]>([]);
let submitApi: BatchParams["submitApi"] | null = null;
let getTableList: BatchParams["getTableList"];

const headerForm = ref({
  subcDate: dayjs().format("YYYY-MM-DD"),
  subcNumPrefix: "WF",
  subcNumNo: "",
  supId: "" as string | number,
  subcRemark: ""
});

const rows = ref<Array<{ materId: string | number; number: number; state: string | number; remark: string }>>([]);

const normalizedStateOptions = computed(() =>
  stateOptions.value
    .map(item => {
      const rawValue = item?.value;
      const value =
        typeof rawValue === "string" && rawValue.trim() && !Number.isNaN(Number(rawValue))
          ? Number(rawValue)
          : (rawValue as string | number);
      if (value === undefined || value === null || !item?.label) return null;
      return { label: String(item.label), value };
    })
    .filter(Boolean) as Array<{ label: string; value: string | number }>
);

const resolveSupplierPrefix = (callName = "") => callName.trim() || "WF";

const handleSupplierChange = (supId: string | number) => {
  const supplier = suppliers.value.find(item => String(item.value) === String(supId));
  headerForm.value.subcNumPrefix = resolveSupplierPrefix(supplier?.callName);
};

const addRow = () => {
  rows.value.push({
    materId: "",
    number: 1,
    state: normalizedStateOptions.value[0]?.value ?? 101,
    remark: ""
  });
};

const removeRow = (index: number) => {
  rows.value.splice(index, 1);
};

const open = (params: BatchParams) => {
  suppliers.value = params.suppliers;
  maters.value = params.maters;
  stateOptions.value = params.stateOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  const firstSupplier = params.suppliers[0];
  headerForm.value = {
    subcDate: dayjs().format("YYYY-MM-DD"),
    subcNumPrefix: resolveSupplierPrefix(firstSupplier?.callName),
    subcNumNo: "",
    supId: firstSupplier?.value || "",
    subcRemark: ""
  };
  rows.value = [];
  addRow();
  visible.value = true;
};

const submit = async () => {
  if (!headerForm.value.subcDate || !headerForm.value.supId || !headerForm.value.subcNumNo) {
    ElMessage.warning("请先填写表头信息");
    return;
  }
  if (!rows.value.length || rows.value.some(item => !item.materId || !item.number)) {
    ElMessage.warning("请补全批量明细");
    return;
  }
  if (!submitApi) return;

  const subcNum = `${headerForm.value.subcNumPrefix}${headerForm.value.subcNumNo}`;

  await submitApi({
    header: {
      subcDate: headerForm.value.subcDate,
      subcNumPrefix: subcNum,
      subcNum,
      subcNumNo: headerForm.value.subcNumNo,
      supId: headerForm.value.supId,
      subcRemark: headerForm.value.subcRemark
    },
    rows: rows.value.map(item => ({
      materId: item.materId,
      number: Number(item.number),
      state: Number(item.state || 101),
      remark: item.remark
    }))
  });

  ElMessage.success("批量新增成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.batch-header {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.full-row {
  grid-column: 1 / -1;
}

.batch-table {
  margin-top: 12px;
}

.batch-actions {
  margin-top: 14px;
}

@media (max-width: 960px) {
  .batch-header {
    grid-template-columns: 1fr;
  }
}
</style>
