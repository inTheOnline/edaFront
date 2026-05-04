<template>
  <el-drawer v-model="visible" :title="title" size="520px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="isView">
      <el-form-item label="外发日期" prop="subcDate">
        <el-date-picker
          v-model="form.subcDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="外发单号" prop="subcNum">
        <el-input v-model="form.subcNum" />
      </el-form-item>
      <el-form-item label="供应商" prop="supId">
        <div class="clickable-field" @click="openSelect(supSelectRef)">
          <el-select ref="supSelectRef" v-model="form.supId" style="width: 100%" filterable>
            <el-option v-for="item in suppliers" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="整单备注" prop="subcRemark">
        <el-input v-model="form.subcRemark" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="物料" prop="materId">
        <div class="clickable-field" @click="openSelect(materSelectRef)">
          <el-select ref="materSelectRef" v-model="form.materId" style="width: 100%" filterable>
            <el-option
              v-for="item in maters"
              :key="item.value"
              :label="`${item.num || item.label} - ${item.label}`"
              :value="item.value"
            />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="外发数量" prop="number">
        <el-input-number v-model="form.number" :min="1" style="width: 100%" />
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <div class="clickable-field" @click="openSelect(stateSelectRef)">
          <el-select ref="stateSelectRef" v-model="form.state" style="width: 100%">
            <el-option v-for="item in normalizedStateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-form-item>
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
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { EnumProps } from "@/components/ProTable/interface";
import { formatOutgoingDate, type OutformPayload, type OutformRecord } from "../../service";

type DrawerParams = {
  title: string;
  isView?: boolean;
  row?: Partial<OutformRecord>;
  suppliers: Array<{ label: string; value: string | number; num?: string }>;
  maters: Array<{ label: string; value: string | number; num?: string }>;
  stateOptions: EnumProps[];
  submitApi: (payload: OutformPayload, editId?: number) => Promise<unknown>;
  getTableList?: () => void;
};

const visible = ref(false);
const title = ref("外发录表");
const isView = ref(false);
const editId = ref<number>();
const formRef = ref<FormInstance>();
const supSelectRef = ref();
const materSelectRef = ref();
const stateSelectRef = ref();
const suppliers = ref<DrawerParams["suppliers"]>([]);
const maters = ref<DrawerParams["maters"]>([]);
const stateOptions = ref<EnumProps[]>([]);
let submitApi: DrawerParams["submitApi"] | null = null;
let getTableList: DrawerParams["getTableList"];

const form = reactive<OutformPayload>({
  subcId: null,
  subcDate: "",
  subcNum: "",
  supId: "",
  subcRemark: "",
  materId: "",
  materNum: "",
  number: 1,
  state: 101,
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
  subcDate: [{ required: true, message: "请选择外发日期", trigger: "change" }],
  subcNum: [{ required: true, message: "请输入外发单号", trigger: "blur" }],
  supId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  materId: [{ required: true, message: "请选择物料", trigger: "change" }],
  number: [{ required: true, message: "请输入外发数量", trigger: "blur" }]
};

const resetForm = () => {
  form.subcId = null;
  form.subcDate = "";
  form.subcNum = "";
  form.supId = "";
  form.subcRemark = "";
  form.materId = "";
  form.materNum = "";
  form.number = 1;
  form.state = Number(normalizedStateOptions.value[0]?.value ?? 101);
  form.remark = "";
};

const acceptParams = (params: DrawerParams) => {
  suppliers.value = params.suppliers;
  maters.value = params.maters;
  stateOptions.value = params.stateOptions;
  submitApi = params.submitApi;
  getTableList = params.getTableList;
  visible.value = true;
  title.value = params.title;
  isView.value = !!params.isView;
  editId.value = params.row?.id;
  resetForm();

  if (params.row) {
    form.subcId = params.row.subcId;
    form.subcDate = formatOutgoingDate(params.row.subcDate);
    form.subcNum = params.row.subcNum || "";
    form.supId = params.row.supId || "";
    form.subcRemark = params.row.subcRemark || "";
    form.materId = params.row.materId || "";
    form.materNum = params.row.materNum || "";
    form.number = Number(params.row.number || 1);
    form.state = Number(params.row.state ?? normalizedStateOptions.value[0]?.value ?? 101);
    form.remark = params.row.remark || "";
  }
};

const openSelect = (selectRef: { value?: any }) => {
  const wrapper = selectRef.value?.$el?.querySelector?.(".el-select__wrapper");
  wrapper?.click?.();
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !submitApi) return;
  await submitApi({ ...form }, editId.value);
  ElMessage.success("保存成功");
  visible.value = false;
  getTableList?.();
};

defineExpose({ acceptParams });
</script>

<style scoped lang="scss">
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.clickable-field {
  width: 100%;
  cursor: pointer;
}
</style>
