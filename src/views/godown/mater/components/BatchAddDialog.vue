<template>
  <el-dialog v-model="visible" title="批量价格变更" width="50%" :close-on-click-modal="false">
    <div class="batch-change">
      <el-form :model="form" label-width="100px">
        <el-form-item label="生效日期">
          <el-date-picker
            v-model="form.effectiveDate"
            type="date"
            placeholder="请选择生效日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="调价原因">
          <el-input v-model="form.changeReason" placeholder="请输入调价原因" />
        </el-form-item>
      </el-form>

      <el-table :data="form.records" border style="width: 100%; margin-top: 10px">
        <el-table-column type="index" label="#" width="50" align="center" />

        <el-table-column label="物料" min-width="220">
          <template #default="{ row }">
            <el-select v-model="row.materId" placeholder="请选择物料" filterable style="width: 100%" @change="onMaterChange(row)">
              <el-option v-for="item in materList" :key="item.value" :label="formatMaterLabel(item)" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="原价" width="200" align="center">
          <template #default="{ row }">
            <el-input v-model="row.oldPrice" disabled />
          </template>
        </el-table-column>

        <el-table-column label="新价" width="200" align="center">
          <template #default="{ row }">
            <el-input v-model.number="row.price" type="number" min="0" />
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
import { batchChangePriceApi, getPriceMap } from "@/api/modules/mater";

type MaterOption = {
  value: number | string;
  label: string;
  num?: string;
  salePrice?: number;
};

type PriceRow = {
  materId: number | string | "";
  oldPrice: number | null;
  price: number | null;
};

const visible = ref(false);
const materList = ref<MaterOption[]>([]);
const priceMap = ref<Map<number, number>>(new Map());
let refreshTable: (() => void | Promise<void>) | null = null;

const form = ref({
  effectiveDate: "",
  changeReason: "",
  records: [] as PriceRow[]
});

const formatMaterLabel = (item: MaterOption) => (item.num ? `${item.label}（${item.num}）` : item.label);

const loadPriceMap = async () => {
  const res = await getPriceMap();
  priceMap.value = new Map(Object.entries(res.data || {}).map(([key, value]) => [Number(key), Number(value)]));
};

const open = async (params: { materList?: MaterOption[]; refreshTable?: () => void | Promise<void> }) => {
  visible.value = true;
  materList.value = params.materList || [];
  refreshTable = params.refreshTable || null;
  form.value.effectiveDate = "";
  form.value.changeReason = "";
  form.value.records = [];
  await loadPriceMap();
  addRow();
};

const addRow = () => {
  form.value.records.push({
    materId: "",
    oldPrice: null,
    price: null
  });
};

const removeRow = (index: number) => {
  form.value.records.splice(index, 1);
};

const onMaterChange = (row: PriceRow) => {
  const price = priceMap.value.get(Number(row.materId)) ?? null;
  row.oldPrice = price;
  row.price = price;
};

const submit = async () => {
  if (!form.value.effectiveDate) return ElMessage.warning("请选择生效日期");
  if (!form.value.records.length) return ElMessage.warning("请至少添加一条记录");
  if (form.value.records.some(row => !row.materId || row.price === null || row.price === undefined)) {
    return ElMessage.warning("请选择物料并填写新价");
  }

  const payload = form.value.records.map(row => ({
    materId: Number(row.materId),
    price: row.price,
    effectiveDate: form.value.effectiveDate,
    changeReason: form.value.changeReason,
    batchName: "手动调价"
  }));

  await batchChangePriceApi(payload);
  ElMessage.success("价格变更成功");
  visible.value = false;
  await refreshTable?.();
};

defineExpose({ open });
</script>

<style scoped>
.batch-change {
  max-height: 70vh;
  overflow: auto;
}

.actions {
  margin-top: 10px;
  text-align: left;
}
</style>
