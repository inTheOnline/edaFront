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
        <el-upload
          ref="uploadRef"
          accept=".xls,.xlsx"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="importExcel"
        >
          <el-button>导入 Excel</el-button>
        </el-upload>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { h, ref } from "vue";
import { ElMessage, ElMessageBox, type UploadFile, type UploadInstance } from "element-plus";
import * as XLSX from "xlsx";
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
const uploadRef = ref<UploadInstance>();
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

const showErrors = (errors: string[], title = "导入失败") => {
  ElMessageBox.alert(
    h(
      "div",
      { style: "max-height: 360px; overflow: auto; line-height: 1.8;" },
      errors.map(error => h("div", error))
    ),
    title,
    { type: "error" }
  );
};

const importExcel = async (file: UploadFile) => {
  try {
    if (!file.raw) return;

    const workbook = XLSX.read(await file.raw.arrayBuffer(), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) return showErrors(["Excel 中没有可读取的工作表"]);

    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "", raw: false });
    if (!data.length) return showErrors(["Excel 中没有数据"]);

    const headers = Object.keys(data[0]).map(header => header.trim());
    const missingHeaders = ["物料编号", "新价"].filter(header => !headers.includes(header));
    if (missingHeaders.length) return showErrors([`缺少必填列：${missingHeaders.join("、")}`]);

    const materMap = new Map(materList.value.map(item => [String(item.num ?? "").trim(), item]));
    const existingMaterIds = new Set(form.value.records.filter(row => row.materId !== "").map(row => String(row.materId)));
    const importedMaterIds = new Set<string>();
    const errors: string[] = [];
    const rows: PriceRow[] = [];

    data.forEach((item, index) => {
      const rowNumber = index + 2;
      const materNum = String(item["物料编号"] ?? "").trim();
      const priceText = String(item["新价"] ?? "").trim();
      const mater = materMap.get(materNum);
      const price = Number(priceText);

      if (!materNum) errors.push(`第 ${rowNumber} 行：物料编号不能为空`);
      else if (!mater) errors.push(`第 ${rowNumber} 行：物料编号“${materNum}”不存在`);
      else if (existingMaterIds.has(String(mater.value)) || importedMaterIds.has(String(mater.value))) {
        errors.push(`第 ${rowNumber} 行：物料编号“${materNum}”重复`);
      }

      if (!priceText) errors.push(`第 ${rowNumber} 行：新价不能为空`);
      else if (!Number.isFinite(price) || price < 0) errors.push(`第 ${rowNumber} 行：新价“${priceText}”不是有效的非负数字`);

      if (mater && priceText && Number.isFinite(price) && price >= 0) {
        importedMaterIds.add(String(mater.value));
        rows.push({
          materId: mater.value,
          oldPrice: priceMap.value.get(Number(mater.value)) ?? null,
          price
        });
      }
    });

    if (errors.length) return showErrors(errors);

    form.value.records.push(...rows);
    ElMessage.success(`成功导入 ${rows.length} 条价格记录`);
  } catch {
    showErrors(["文件读取失败，请确认文件为有效的 Excel 格式"]);
  } finally {
    uploadRef.value?.clearFiles();
  }
};

const validateDuplicateMaters = () => {
  const counts = new Map<string, number>();
  form.value.records.forEach(row => {
    if (row.materId !== "") {
      const key = String(row.materId);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  });

  const errors = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([materId, count]) => {
      const mater = materList.value.find(item => String(item.value) === materId);
      return `${mater ? formatMaterLabel(mater) : materId}：共 ${count} 行相同`;
    });

  if (!errors.length) return true;
  showErrors(errors, "数据重复");
  return false;
};

const submit = async () => {
  if (!form.value.effectiveDate) return ElMessage.warning("请选择生效日期");
  if (!form.value.records.length) return ElMessage.warning("请至少添加一条记录");
  if (form.value.records.some(row => !row.materId || row.price === null || row.price === undefined)) {
    return ElMessage.warning("请选择物料并填写新价");
  }
  if (!validateDuplicateMaters()) return;

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
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
</style>
