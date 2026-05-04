<template>
  <el-drawer v-model="visible" :title="title" size="560px" destroy-on-close>
    <div v-if="!isView" class="drawer-hero">
      <div>
        <p class="drawer-hero__eyebrow">OUTBACK ENTRY</p>
        <h3>回执录入同步守住未回数量</h3>
        <p class="drawer-hero__desc">选择外发明细后会自动带出供应商，若提交后未回数量将变成负数，保存前会再次提醒。</p>
      </div>
      <div class="drawer-hero__badge">
        <span>当前物料</span>
        <strong>{{ selectedItem ? formatMaterialLabel(selectedItem) : "待选择" }}</strong>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="isView" class="drawer-form">
      <el-form-item label="回货日期" prop="backDate">
        <el-date-picker
          v-model="form.backDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="回货单号" prop="outbackNum">
        <el-input v-model="form.outbackNum" />
      </el-form-item>
      <el-form-item label="供应商" prop="supId">
        <div class="clickable-field" @click="openSelect(supSelectRef)">
          <el-select ref="supSelectRef" v-model="form.supId" style="width: 100%" filterable>
            <el-option v-for="item in suppliers" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <div class="clickable-field" @click="openSelect(stateSelectRef)">
          <el-select ref="stateSelectRef" v-model="form.state" style="width: 100%">
            <el-option v-for="item in normalizedStateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="整单备注" prop="outbackRemark">
        <el-input v-model="form.outbackRemark" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="外发明细" prop="outItemId">
        <div class="select-row clickable-field" @click="openSelector">
          <el-input :model-value="selectedText" readonly />
          <el-button type="primary" class="accent-btn" @click.stop="openSelector">选择</el-button>
        </div>
      </el-form-item>
      <el-form-item label="回货数量" prop="number">
        <el-input-number v-model="form.number" :min="1" style="width: 100%" />
      </el-form-item>
      <div v-if="negativeHint" class="negative-alert">
        提交后 {{ negativeHint }} 的未回数量将为负数，请确认是否继续。
      </div>
      <el-form-item label="行备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="4" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="visible = false">{{ isView ? "关闭" : "取消" }}</el-button>
        <el-button v-if="!isView" type="primary" @click="submit">保存</el-button>
      </div>
    </template>

    <OutItemSelector ref="selectorRef" @confirm="handleSelectOutItem" />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { EnumProps } from "@/components/ProTable/interface";
import OutItemSelector from "./OutItemSelector.vue";
import {
  calcProjectedNotbackNumber,
  formatOutgoingDate,
  findOutformRecordApi,
  formatMaterialLabel,
  type OutbackPayload,
  type OutbackRecord,
  type OutformRecord
} from "../../service";

type DrawerParams = {
  title: string;
  isView?: boolean;
  row?: Partial<OutbackRecord>;
  suppliers: Array<{ label: string; value: string | number }>;
  maters: Array<{ label: string; value: string | number; num?: string }>;
  stateOptions: EnumProps[];
  submitApi: (payload: OutbackPayload, editId?: number) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const title = ref("外发回货");
const isView = ref(false);
const editId = ref<number>();
const formRef = ref<FormInstance>();
const selectorRef = ref<InstanceType<typeof OutItemSelector> | null>(null);
const supSelectRef = ref();
const stateSelectRef = ref();
const suppliers = ref<DrawerParams["suppliers"]>([]);
const stateOptions = ref<EnumProps[]>([]);
const selectedItem = ref<Partial<OutformRecord> | null>(null);
let submitApi: DrawerParams["submitApi"] | null = null;
let getTableList: DrawerParams["getTableList"];

const form = reactive<OutbackPayload>({
  outbackId: null,
  outbackNum: "",
  backDate: "",
  supId: "",
  state: 101,
  outbackRemark: "",
  outItemId: 0,
  number: 1,
  remark: ""
});

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

const rules: FormRules = {
  backDate: [{ required: true, message: "请选择回货日期", trigger: "change" }],
  outbackNum: [{ required: true, message: "请输入回货单号", trigger: "blur" }],
  supId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  outItemId: [{ required: true, message: "请选择外发明细", trigger: "change" }],
  number: [{ required: true, message: "请输入回货数量", trigger: "blur" }]
};

const selectedText = computed(() => {
  if (!selectedItem.value) return "";
  return `${selectedItem.value.subcNum || ""} / ${selectedItem.value.materNum || ""} / ${selectedItem.value.materName || ""}`;
});

const projectedNotback = computed(() => {
  if (!selectedItem.value?.id) return null;
  if (editId.value && selectedItem.value?.notbackNumber === undefined) return null;
  return calcProjectedNotbackNumber({
    currentNotbackNumber: Number(selectedItem.value?.notbackNumber || 0),
    nextReceiptNumber: form.number,
    originalReceiptNumber: editId.value && Number(selectedItem.value?.id) === Number(form.outItemId) ? Number(originalNumber.value || 0) : 0
  });
});

const negativeHint = computed(() => {
  if (projectedNotback.value === null || projectedNotback.value >= 0) return "";
  return formatMaterialLabel(selectedItem.value);
});

const originalNumber = ref(0);

const resetForm = () => {
  form.outbackId = null;
  form.outbackNum = "";
  form.backDate = "";
  form.supId = "";
  form.state = Number(normalizedStateOptions.value[0]?.value ?? 101);
  form.outbackRemark = "";
  form.outItemId = 0;
  form.number = 1;
  form.remark = "";
  selectedItem.value = null;
  originalNumber.value = 0;
};

const acceptParams = (params: DrawerParams) => {
  suppliers.value = params.suppliers;
  stateOptions.value = params.stateOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  visible.value = true;
  title.value = params.title;
  isView.value = !!params.isView;
  editId.value = params.row?.id;
  resetForm();

  if (params.row) {
    form.outbackId = params.row.outbackId;
    form.outbackNum = params.row.outbackNum || "";
    form.backDate = formatOutgoingDate(params.row.backDate);
    form.supId = params.row.supId || "";
    form.state = Number(params.row.state ?? normalizedStateOptions.value[0]?.value ?? 101);
    form.outbackRemark = params.row.outbackRemark || "";
    form.outItemId = Number(params.row.outItemId || 0);
    form.number = Number(params.row.number || 1);
    originalNumber.value = Number(params.row.number || 0);
    form.remark = params.row.remark || "";
    selectedItem.value = {
      id: params.row.outItemId,
      subcNum: params.row.subcNum,
      materId: params.row.materId,
      materNum: params.row.materNum,
      materName: params.row.materName,
      supId: params.row.supId,
      supName: params.row.supName
    };
    void syncCurrentOutItemSnapshot(params.row);
  }
};

const syncCurrentOutItemSnapshot = async (row?: {
  outItemId?: number;
  subcNum?: string;
  supId?: string | number;
  materId?: string | number;
}) => {
  if (!row?.outItemId) return;
  const latest = await findOutformRecordApi({
    id: Number(row.outItemId),
    subcNum: row.subcNum,
    supId: row.supId,
    materId: row.materId
  }).catch(() => null);

  if (!latest) return;
  selectedItem.value = {
    ...selectedItem.value,
    ...latest,
    id: latest.id
  };
};

const openSelect = (selectRef: { value?: any }) => {
  const wrapper = selectRef.value?.$el?.querySelector?.(".el-select__wrapper");
  wrapper?.click?.();
};

const openSelector = () => {
  selectorRef.value?.open();
};

const handleSelectOutItem = (row: OutformRecord) => {
  selectedItem.value = row;
  form.outItemId = row.id;
  form.supId = row.supId;
  if (!form.number || form.number === 1) {
    form.number = Number(row.notbackNumber || 1);
  }
};

const confirmNegativeReceipt = async () => {
  if (!negativeHint.value) return true;
  await ElMessageBox.confirm(
    `提交后 ${negativeHint.value} 的未回数量将为负数，是否继续？`,
    "未回数量提醒",
    {
      type: "warning",
      confirmButtonText: "继续提交",
      cancelButtonText: "返回修改"
    }
  );
  return true;
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !submitApi) return;

  if (editId.value && selectedItem.value?.id === form.outItemId && selectedItem.value?.notbackNumber === undefined) {
    await syncCurrentOutItemSnapshot({
      outItemId: form.outItemId,
      subcNum: selectedItem.value?.subcNum,
      supId: form.supId,
      materId: selectedItem.value?.materId
    });
  }

  try {
    await confirmNegativeReceipt();
  } catch (_error) {
    return;
  }

  await submitApi({ ...form }, editId.value);
  ElMessage.success("保存成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ acceptParams });
</script>

<style scoped lang="scss">
.drawer-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 16px;
  margin-bottom: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
    linear-gradient(135deg, #0f172a, #1d4ed8 56%, #0f766e);
  color: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.14);
}

.drawer-hero h3 {
  margin: 4px 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.drawer-hero__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.72);
}

.drawer-hero__desc {
  margin: 0;
  max-width: 340px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
}

.drawer-hero__badge {
  min-width: 180px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.drawer-hero__badge span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.drawer-hero__badge strong {
  font-size: 16px;
  line-height: 1.6;
}

.drawer-form {
  padding: 18px 18px 4px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 28%),
    #f8fbff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.select-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  width: 100%;
}

.clickable-field {
  width: 100%;
  cursor: pointer;
}

.negative-alert {
  margin: 2px 0 18px 100px;
  padding: 10px 14px;
  border: 1px solid rgba(220, 38, 38, 0.16);
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(254, 226, 226, 0.92), rgba(255, 255, 255, 0.96));
  color: #b42318;
  line-height: 1.6;
}

.accent-btn {
  border: none;
  background: linear-gradient(135deg, #155eef, #0ea5e9);
  box-shadow: 0 12px 24px rgba(21, 94, 239, 0.2);
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 22px 22px 14px;
  background: linear-gradient(135deg, #020617, #1d4ed8 54%, #0f766e);
}

:deep(.el-drawer__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

:deep(.el-drawer__body) {
  padding: 18px 20px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 30%),
    linear-gradient(180deg, #f6faff, #ffffff 22%);
}

@media (max-width: 768px) {
  .drawer-hero {
    flex-direction: column;
  }

  .negative-alert {
    margin-left: 0;
  }
}
</style>
