<template>
  <el-drawer
    v-model="drawerVisible"
    destroy-on-close
    size="min(620px, 100vw)"
    :title="`${drawerProps.title}原材料`"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <el-form
      ref="ruleFormRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="drawerProps.isView || saving"
      :hide-required-asterisk="drawerProps.isView"
      scroll-to-error
    >
      <el-form-item label="原料类型" prop="raw.type">
        <el-radio-group v-model="form.raw.type" @change="resetRelation">
          <el-radio :value="1">板料</el-radio>
          <el-radio :value="2">卷料</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="原料编号" prop="raw.rawNum">
        <el-input v-model="form.raw.rawNum" placeholder="选择类型、材质和关联产品后自动生成" readonly />
      </el-form-item>
      <el-form-item label="原材料名称" prop="raw.rawName">
        <el-input v-model="form.raw.rawName" placeholder="请输入原材料名称" clearable />
      </el-form-item>
      <el-form-item label="材质" prop="raw.essence">
        <el-input v-model="form.raw.essence" placeholder="请输入材质" clearable />
      </el-form-item>
      <el-form-item v-if="isNew" label="材质简称" prop="materialCode">
        <el-input v-model="form.materialCode" placeholder="自动提取字母和数字，可修改" />
      </el-form-item>
      <el-form-item label="规格" prop="raw.rawSpecs">
        <el-input v-model="form.raw.rawSpecs" placeholder="请输入规格" clearable />
      </el-form-item>
      <el-form-item label="单位重量（kg）" prop="raw.utilWeight">
        <el-input-number
          v-model="form.raw.utilWeight"
          :min="0"
          :precision="4"
          :controls="false"
          placeholder="请输入公斤数，如 0.0640"
        />
      </el-form-item>
      <el-form-item label="备注" prop="raw.remark">
        <el-input v-model="form.raw.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <template v-if="drawerProps.title === '新增'">
        <el-divider content-position="left">关联物料</el-divider>
        <template v-if="isNew">
          <el-form-item label="关联产品" prop="relation.materId">
            <el-select
              v-model="form.relation.materId"
              filterable
              clearable
              placeholder="搜索产品编号或名称"
              :loading="loadingMaters"
            >
              <el-option
                v-for="item in dictStore.dictMap.mater || []"
                :key="item.value"
                :label="productLabel(item)"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <template v-if="form.raw.type === 1">
            <el-form-item label="每张产出数" prop="relation.sheetOutputNumber">
              <el-input-number v-model="form.relation.sheetOutputNumber" :min="1" :precision="0" :controls="false" />
            </el-form-item>
            <el-form-item label="张重（kg/张）" prop="relation.sheetWeight">
              <el-input-number v-model="form.relation.sheetWeight" :min="0" :precision="4" :controls="false" />
            </el-form-item>
          </template>
          <template v-else-if="form.raw.type === 2">
            <el-form-item label="单件耗重（kg/个）" prop="relation.rollUnitWeight">
              <el-input-number v-model="form.relation.rollUnitWeight" :min="0" :precision="4" :controls="false" />
            </el-form-item>
            <el-form-item v-if="existingRelation" label="产品毛重（kg/个）">
              <el-input
                :model-value="
                  existingRelation.grossWeight == null ? '尚未维护，请到关系页面维护' : existingRelation.grossWeight.toFixed(4)
                "
                readonly
              />
              <span class="helper">已读取产品毛重，保存时保留原值。</span>
            </el-form-item>
            <el-form-item v-else label="产品毛重（kg/个）" prop="relation.grossWeight">
              <el-input-number v-model="form.relation.grossWeight" :min="0" :precision="4" :controls="false" />
            </el-form-item>
          </template>
          <el-form-item v-if="!existingRelation" label="废料重（kg）" prop="relation.utilBadWeight">
            <el-input-number v-model="form.relation.utilBadWeight" :min="0" :precision="4" :controls="false" />
          </el-form-item>
          <el-form-item v-if="!existingRelation" label="关系备注" prop="relation.remark">
            <el-input v-model="form.relation.remark" type="textarea" :rows="2" placeholder="请输入关系备注" />
          </el-form-item>
        </template>
      </template>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="drawerVisible = false">{{ drawerProps.isView ? "关闭" : "取消" }}</el-button>
      <el-button
        v-if="!drawerProps.isView"
        type="primary"
        :loading="saving"
        :disabled="loadingRelation || relationFailed"
        @click="handleSubmit"
        >保存</el-button
      >
    </template>
  </el-drawer>
</template>

<script setup lang="ts" name="UserDrawer">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { addWithRelation, type RawInfo } from "@/api/modules/raw";
import { getRawMaterByProduct } from "@/api/modules/buy/rawPurchase";
import type { RawMaterRelation } from "@/api/interface/buy/rawPurchase";
import { useDictStore } from "@/stores/modules/dict";

type DrawerParams = {
  title: string;
  isView: boolean;
  row: RawInfo;
  api?: (row: any) => Promise<any>;
  getTableList?: () => void;
};
const dictStore = useDictStore();
const drawerVisible = ref(false);
const saving = ref(false);
const existingRelation = ref<RawMaterRelation | null>(null);
const loadingRelation = ref(false);
const relationFailed = ref(false);
let relationVersion = 0;
const isNew = computed(() => drawerProps.value.title === "新增");
const productLabel = (item: { label: string; num?: string }) => `${item.num || ""} ${item.label}`.trim();
const loadingMaters = ref(false);
const ruleFormRef = ref<FormInstance>();
const drawerProps = ref<DrawerParams>({ title: "", isView: false, row: {} });
const form = reactive<{ raw: RawInfo; relation: RawMaterRelation; materialCode: string }>({
  raw: {},
  relation: {},
  materialCode: "",
});
const positive = [
  { required: true, type: "number" as const, min: Number.MIN_VALUE, message: "请输入大于0的数值", trigger: "blur" },
];
const rules: FormRules = {
  "raw.type": [{ required: true, message: "请选择原料类型", trigger: "change" }],
  materialCode: [{ required: true, pattern: /^[A-Za-z0-9]+$/, message: "请输入材质简称（字母和数字）", trigger: "blur" }],
  "raw.rawName": [{ required: true, whitespace: true, message: "请输入原材料名称", trigger: "blur" }],
  "raw.rawSpecs": [{ required: true, whitespace: true, message: "请输入规格", trigger: "blur" }],
  "raw.utilWeight": [
    { required: true, message: "请输入单位重量", trigger: "blur" },
    { type: "number", min: 0, message: "单位重量不能小于0", trigger: "blur" },
  ],
  "relation.materId": [{ required: true, message: "请选择关联物料", trigger: "change" }],
  "relation.sheetOutputNumber": positive,
  "relation.sheetWeight": positive,
  "relation.rollUnitWeight": positive,
  "relation.grossWeight": positive,
};
watch(
  () => form.raw.essence,
  (value) => {
    if (isNew.value) form.materialCode = (value || "").replace(/[^a-zA-Z0-9]/g, "");
  },
);
watch(
  () => [form.raw.type, form.materialCode, form.relation.materId, dictStore.dictMap.mater],
  () => {
    if (!isNew.value) return;
    const product = dictStore.dictMap.mater?.find((item) => String(item.value) === String(form.relation.materId)) as
      | { num?: string }
      | undefined;
    form.raw.rawNum =
      form.raw.type && form.materialCode && product?.num
        ? `${form.raw.type === 2 ? "RD" : "RB"}-${form.materialCode}-${product.num}`
        : "";
  },
);
watch(
  () => form.relation.materId,
  async (id) => {
    const version = ++relationVersion;
    existingRelation.value = null;
    relationFailed.value = false;
    form.relation = { materId: id };
    if (!isNew.value || !id) {
      loadingRelation.value = false;
      return;
    }
    loadingRelation.value = true;
    try {
      const row = await getRawMaterByProduct(id);
      if (version === relationVersion) existingRelation.value = row;
    } catch {
      if (version === relationVersion) {
        relationFailed.value = true;
        ElMessage.error("产品关系读取失败，请重新选择产品重试");
      }
    } finally {
      if (version === relationVersion) loadingRelation.value = false;
    }
  },
);
const resetRelation = () => {
  form.relation = { materId: form.relation.materId };
  ruleFormRef.value?.clearValidate();
};
const acceptParams = (params: DrawerParams) => {
  drawerProps.value = params;
  form.raw = { ...params.row };
  form.relation = {};
  form.materialCode = "";
  existingRelation.value = null;
  relationFailed.value = false;
  loadingRelation.value = false;
  relationVersion++;
  drawerVisible.value = true;
  if (params.title === "新增") {
    loadingMaters.value = true;
    dictStore
      .loadDicts(["mater"])
      .catch(() => ElMessage.error("物料选项加载失败，请重新打开窗口重试"))
      .finally(() => {
        loadingMaters.value = false;
      });
  }
};
const handleSubmit = async () => {
  if (saving.value || loadingRelation.value || relationFailed.value) return;
  saving.value = true;
  try {
    if (!(await ruleFormRef.value?.validate().catch(() => false))) return;
    if (drawerProps.value.title === "新增") {
      await addWithRelation({ raw: form.raw, materialCode: form.materialCode, relation: form.relation });
    } else {
      await drawerProps.value.api!(form.raw);
    }
    ElMessage.success(`${drawerProps.value.title}原材料成功`);
    drawerVisible.value = false;
    drawerProps.value.getTableList?.();
  } catch {
    // 接口错误已由请求拦截器提示，保留表单供修正或重试。
  } finally {
    saving.value = false;
  }
};
defineExpose({ acceptParams });
</script>

<style scoped>
.helper {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
:deep(.el-input-number),
:deep(.el-select) {
  width: 100%;
}
</style>
