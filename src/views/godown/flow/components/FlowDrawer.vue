<template>
  <el-drawer v-model="visible" :title="title" size="500px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" :disabled="viewOnly">
      <el-form-item label="仓库"><el-input :model-value="warehouseName" disabled /></el-form-item>
      <el-form-item label="日期" prop="bizDate"><el-date-picker v-model="form.bizDate" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="物料" prop="sourceItemId">
        <el-select v-model="form.sourceItemId" filterable fit-input-width style="width:100%">
          <template #label="{ label }">
            <OverflowTooltip :text="label" />
          </template>
          <el-option v-for="item in materialOptions" :key="item.value" :value="item.value" :label="getMaterialLabel(item)">
            <OverflowTooltip :text="getMaterialLabel(item)" />
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="流水类型" prop="flowTypeCode">
        <el-select v-model="form.flowTypeCode" style="width:100%">
          <el-option v-for="item in flowTypes" :key="item.code" :value="item.code" :label="item.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量" prop="quantity"><el-input-number v-model="form.quantity" :min="0.1"  :controls="false" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      <el-form-item label="相关人" prop="relatedPerson"><PersonSelect v-model="form.relatedPerson" /></el-form-item>
      <el-form-item v-if="viewOnly && form.sourceType" label="来源"><el-tag effect="plain">{{ getStockSourceName(form.sourceType) }}</el-tag></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button v-if="!viewOnly" type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="FlowDrawer">
import { computed, reactive, ref } from "vue";
import dayjs from "dayjs";
import { ElMessage, FormInstance } from "element-plus";
import { addStockFlow, editStockFlow, StockFlowType } from "@/api/modules/stock";
import { getStockSourceName } from "@/enums/stockEnum";
import OverflowTooltip from "./OverflowTooltip.vue";
import PersonSelect from "./PersonSelect.vue";

interface MaterialOption {
  value: string | number;
  num?: string;
  label: string;
}

const props = defineProps<{
  warehouseCode: string;
  warehouseName?: string;
  itemType: "PRODUCT" | "RAW" | "ASSIST";
  materialOptions: MaterialOption[];
  flowTypes: StockFlowType[];
}>();
const emit = defineEmits<{ saved: [] }>();
const visible = ref(false);
const viewOnly = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<any>({});
const title = computed(() => viewOnly.value ? "查看仓库流水" : form.docId ? "编辑仓库流水" : "新增仓库流水");
const rules = {
  relatedPerson: [{ required: true, message: "请选择相关人", trigger: "change" }],
  bizDate: [{ required: true, message: "请选择日期" }],
  sourceItemId: [{ required: true, message: "请选择物料" }],
  flowTypeCode: [{ required: true, message: "请选择流水类型" }],
  quantity: [{ required: true, message: "请输入数量" }]
};
const getMaterialLabel = (item:MaterialOption) => `${item.num} ${item.label}`;
const acceptParams = (row:any = {}, view = false) => {
  Object.assign(form, {
    docId: row.docId,
    relatedPerson: row.relatedPerson || "",
    sourceType: row.sourceType,
    bizDate: row.bizDate || dayjs().format("YYYY-MM-DD"),
    sourceItemId: row.sourceItemId,
    flowTypeCode: row.flowTypeCode,
    quantity: row.quantity || 1,
    remark: row.remark || ""
  });
  viewOnly.value = view;
  visible.value = true;
};
const payload = () => ({
  warehouseCode: props.warehouseCode,
  relatedPerson: form.relatedPerson,
  itemType: props.itemType,
  sourceItemId: Number(form.sourceItemId),
  flowTypeCode: form.flowTypeCode,
  quantity: Number(form.quantity),
  bizDate: form.bizDate,
  remark: form.remark
});
const save = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    await formRef.value?.validate();
    form.docId ? await editStockFlow(form.docId, payload()) : await addStockFlow(payload());
    ElMessage.success("保存成功");
    visible.value = false;
    emit("saved");
  } finally {
    saving.value = false;
  }
};

defineExpose({ acceptParams });
</script>
