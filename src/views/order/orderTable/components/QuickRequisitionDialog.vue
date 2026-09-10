<template>
  <el-dialog v-model="visible" title="快速请购" width="94%" top="3vh" :close-on-click-modal="false" destroy-on-close>
    <div class="quick-requisition" v-loading="previewing" aria-live="polite">
      <div class="topbar">
        <el-segmented v-model="mode" :options="modeOptions" @change="resetSources" />
        <el-date-picker v-model="requisitionDate" value-format="YYYY-MM-DD" aria-label="请购日期" />
      </div>

      <div class="source-toolbar">
        <el-button v-if="mode === 'material'" type="primary" plain @click="addMaterialRow">添加产品</el-button>
        <el-button v-else type="primary" plain @click="openOrderSelector">选择订单条目</el-button>
        <el-button type="primary" :disabled="!sources.length" @click="generatePreview">生成请购明细</el-button>
      </div>

      <el-table :data="sources" border stripe max-height="240" empty-text="请先添加产品或订单条目">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column v-if="mode === 'order'" prop="orderNum" label="订单编号" min-width="150" />
        <el-table-column label="产品" min-width="300">
          <template #default="{ row }">
            <el-select v-if="mode === 'material'" v-model="row.materId" filterable placeholder="请选择产品" @change="syncMaterial(row)">
              <el-option v-for="item in materOptions" :key="item.value" :label="materialLabel(item)" :value="Number(item.value)" />
            </el-select>
            <span v-else>{{ row.materNum }} / {{ row.materName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品数量" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.productionNumber" :min="1" :precision="0" :controls="false" placeholder="请输入数量" @change="clearPreview" />
          </template>
        </el-table-column>
        <el-table-column label="损耗" width="160">
          <template #default="{ row }"><el-input-number v-model="row.lossRate" :min="0" :precision="2" :controls="false" @change="clearPreview" /><span class="unit">%</span></template>
        </el-table-column>
        <el-table-column label="状态" width="150">
          <template #default="{ row }"><el-tag v-if="row.forceRepeat" type="warning">再次请购</el-tag><span v-else>待生成</span></template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }"><el-button type="danger" link @click="removeSource($index)">移除</el-button></template>
        </el-table-column>
      </el-table>

      <el-alert v-if="repeatTip" :title="repeatTip" type="warning" show-icon :closable="false" class="feedback" />
      <el-alert v-for="(warning, index) in warnings" :key="`${warning.materId}-${warning.category}-${index}`" :title="`${warning.materNum || warning.materName}：${warning.message}`" type="warning" show-icon :closable="false" class="feedback" />

      <section class="document-section">
        <div class="section-title"><h3>原材料请购</h3><el-input v-model="rawRemark" placeholder="原材料请购单备注" clearable /></div>
        <el-table :data="rawItems" border stripe max-height="280" empty-text="暂无原材料请购明细">
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column prop="materNum" label="物料编号" min-width="130" />
          <el-table-column prop="materName" label="物料名称" min-width="150" />
          <el-table-column prop="rawNum" label="原材料编号" min-width="140" />
          <el-table-column prop="rawSpecs" label="规格" min-width="190" />
          <el-table-column label="类型" width="90"><template #default="{ row }">{{ row.useType === 'roll' ? '卷料' : '板料' }}</template></el-table-column>
          <el-table-column prop="productionNumber" label="生产数" width="110" />
          <el-table-column label="材料数" width="150"><template #default="{ row }"><el-input-number v-model="row.requisitionNumber" :min="1" :precision="0" :controls="false" /><span class="unit">{{ row.useType === 'roll' ? '卷' : '张' }}</span></template></el-table-column>
          <el-table-column label="请购重量" width="150"><template #default="{ row }"><el-input-number v-model="row.requisitionWeight" :min="0" :precision="4" :controls="false" /></template></el-table-column>
          <el-table-column label="备注" min-width="150"><template #default="{ row }"><el-input v-model.trim="row.remark" /></template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{ $index }"><el-button type="danger" link @click="rawItems.splice($index, 1)">移除</el-button></template></el-table-column>
        </el-table>
      </section>

      <section class="document-section">
        <div class="section-title"><h3>辅材请购</h3><el-input v-model="assistRemark" placeholder="辅材请购单备注" clearable /></div>
        <el-table :data="assistItems" border stripe max-height="280" empty-text="暂无辅材请购明细">
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column label="辅材类型" width="110"><template #default="{ row }">{{ assistTypeLabel(row.assistType) }}</template></el-table-column>
          <el-table-column prop="assistCode" label="辅材编码" min-width="140" />
          <el-table-column prop="assistName" label="名称" min-width="140" />
          <el-table-column prop="assistSpec" label="规格" min-width="170" />
          <el-table-column label="请购数量" width="170"><template #default="{ row }"><el-input-number v-model="row.requisitionQty" :min="1" :precision="0" :controls="false" /><span class="unit">{{ row.unit }}</span></template></el-table-column>
          <el-table-column label="备注" min-width="160"><template #default="{ row }"><el-input v-model.trim="row.remark" /></template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{ $index }"><el-button type="danger" link @click="assistItems.splice($index, 1)">移除</el-button></template></el-table-column>
        </el-table>
      </section>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!canSubmit" @click="submit">确认请购</el-button>
    </template>
  </el-dialog>
  <CustOrderItemSelector ref="orderSelectorRef" @confirm="selectOrderItems" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDictStore } from "@/stores/modules/dict";
import CustOrderItemSelector from "@/views/buy/rawPurchase/components/CustOrderItemSelector.vue";
import { confirmQuickRequisition, previewQuickRequisition } from "@/api/modules/buy/quickRequisition";
import { getMaterBindings } from "@/api/modules/mater";
import type { QuickAssistLine, QuickPreview, QuickPreviewRequest, QuickRawLine, QuickRequisitionMode, QuickRequisitionSource } from "@/api/interface/buy/quickRequisition";

const visible = ref(false);
const mode = ref<QuickRequisitionMode>("order");
const modeOptions = [{ label: "按物料添加", value: "material" }, { label: "按订单（Item）添加", value: "order" }];
const requisitionDate = ref("");
const sources = ref<QuickRequisitionSource[]>([]);
const rawItems = ref<QuickRawLine[]>([]);
const assistItems = ref<QuickAssistLine[]>([]);
const warnings = ref<QuickPreview["warnings"]>([]);
const repeatTip = ref("");
const rawRemark = ref("");
const assistRemark = ref("");
const previewing = ref(false);
const saving = ref(false);
const hasPreview = ref(false);
const orderSelectorRef = ref<InstanceType<typeof CustOrderItemSelector> | null>(null);
const dictStore = useDictStore();
const pluginMaterIds = ref(new Set<string>());
const materOptions = computed<any[]>(() => (dictStore.dictMap.mater || []).filter((item: any) => !pluginMaterIds.value.has(String(item.value))));
const canSubmit = computed(() => hasPreview.value && (mode.value === "order" || rawItems.value.length > 0 || assistItems.value.length > 0));
let refresh: (() => void) | undefined;

const today = () => new Date().toISOString().slice(0, 10);
const unwrap = <T,>(response: any): T => (response?.data?.data ?? response?.data ?? response) as T;
const materialLabel = (item: any) => `${item.num ? `${item.num} / ` : ""}${item.label}`;
const assistTypeLabel = (type: string) => ({ pvc: "吸塑", box: "纸箱", nut: "螺母", spacer: "隔板", other: "其他" }[type] || type || "其他");
const clearPreview = () => { rawItems.value = []; assistItems.value = []; warnings.value = []; repeatTip.value = ""; hasPreview.value = false; };
const resetSources = () => { sources.value = []; clearPreview(); };

const open = async (getTableList?: () => void) => {
  refresh = getTableList;
  requisitionDate.value = today();
  mode.value = "order";
  sources.value = [];
  rawRemark.value = "";
  assistRemark.value = "";
  clearPreview();
  const [, bindingResponse] = await Promise.all([dictStore.loadDict("mater", { force: true }), getMaterBindings()]);
  pluginMaterIds.value = new Set((unwrap<any[]>(bindingResponse) || []).map(row => String(row.pluginMaterId)));
  visible.value = true;
};

const addMaterialRow = () => sources.value.push({ materId: undefined as unknown as number, productionNumber: null, lossRate: 2 });
const syncMaterial = (row: QuickRequisitionSource) => {
  const item: any = materOptions.value.find(v => String(v.value) === String(row.materId));
  row.materNum = item?.num;
  row.materName = item?.label;
  clearPreview();
};
const removeSource = (index: number) => { sources.value.splice(index, 1); clearPreview(); };
const openOrderSelector = () => orderSelectorRef.value?.open([], true);
const selectOrderItems = (rows: any[]) => {
  const existing = new Map(sources.value.map(v => [String(v.orderItemId), v]));
  rows.forEach(row => existing.set(String(row.id), {
    orderItemId: Number(row.id), materId: Number(row.materId), productionNumber: Number(row.notAlreadyNumber), lossRate: 2,
    orderNum: row.orderNum, materNum: row.materNum, materName: row.materName
  }));
  sources.value = [...existing.values()];
  clearPreview();
};

const validateSources = () => {
  if (!requisitionDate.value) return ElMessage.warning("请选择请购日期"), false;
  if (!sources.value.length) return ElMessage.warning("请至少添加一个产品或订单条目"), false;
  if (sources.value.some(v => !v.materId || !v.productionNumber || v.productionNumber <= 0)) return ElMessage.warning("请完整填写产品和产品数量"), false;
  if (sources.value.some(v => v.lossRate == null || v.lossRate < 0)) return ElMessage.warning("损耗不能小于0"), false;
  return true;
};
const previewRequest = (): QuickPreviewRequest => ({
  mode: mode.value,
  requisitionDate: requisitionDate.value,
  sources: sources.value.map(({ orderItemId, materId, productionNumber, lossRate, forceRepeat }) => ({ orderItemId, materId, productionNumber, lossRate, forceRepeat }))
});

const generatePreview = async () => {
  if (!validateSources()) return;
  previewing.value = true;
  try {
    const data = unwrap<QuickPreview>(await previewQuickRequisition(previewRequest()));
    if (data.completedItems?.length) {
      const names = data.completedItems.map(v => `${v.materNum || ""} ${v.materName || ""}`.trim()).join("、");
      await ElMessageBox.confirm(`本条目已经请购所有原材料/辅材：${names}，是否继续请购？`, "重复请购提示", { type: "warning", confirmButtonText: "继续请购" });
      const completedIds = new Set(data.completedItems.map(v => String(v.orderItemId)));
      sources.value.forEach(source => {
        if (completedIds.has(String(source.orderItemId))) { source.forceRepeat = true; source.productionNumber = null; }
      });
      clearPreview();
      repeatTip.value = "请为标记“再次请购”的订单条目手工填写产品数量，然后重新生成请购明细。";
      return;
    }
    rawItems.value = data.rawItems || [];
    assistItems.value = data.assistItems || [];
    warnings.value = data.warnings || [];
    repeatTip.value = "";
    hasPreview.value = rawItems.value.length > 0 || assistItems.value.length > 0;
    if (!rawItems.value.length && !assistItems.value.length) ElMessage.warning("没有可请购的原材料或辅材");
  } catch (error) {
    if (error !== "cancel") console.error("快速请购预览失败", error);
  } finally {
    previewing.value = false;
  }
};

const submit = async () => {
  if (!validateSources()) return;
  if (!hasPreview.value) return ElMessage.warning("请先生成请购明细");
  if (!canSubmit.value) return ElMessage.warning("按物料添加至少保留一条请购明细");
  saving.value = true;
  try {
    await confirmQuickRequisition({ preview: previewRequest(), rawRemark: rawRemark.value, assistRemark: assistRemark.value, rawItems: rawItems.value, assistItems: assistItems.value });
    ElMessage.success("快速请购成功");
    visible.value = false;
    refresh?.();
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped>
.quick-requisition{max-height:78vh;overflow:auto;padding-right:4px}.topbar,.source-toolbar,.section-title{display:flex;align-items:center;gap:12px}.topbar{justify-content:space-between}.source-toolbar{margin:12px 0}.feedback{margin-top:10px}.document-section{margin-top:18px}.section-title{justify-content:space-between;margin-bottom:10px}.section-title h3{margin:0;font-size:16px}.section-title .el-input{width:min(420px,55%)}.unit{margin-left:8px;color:var(--el-text-color-secondary)}:deep(.el-select){width:100%}:deep(.el-input-number){max-width:120px}@media(max-width:900px){.topbar,.section-title{align-items:stretch;flex-direction:column}.section-title .el-input{width:100%}}
</style>
