<template>
  <el-dialog v-model="visible" title="录入回执异常" width="min(960px, 96vw)" destroy-on-close :close-on-click-modal="false"
    :close-on-press-escape="!saving" :show-close="!saving" @closed="clearPhotos">
    <el-alert title="少料（含缺料）扣减原物料；混料扣减原物料并新增实际混入物料。数量允许为 0。" type="info" :closable="false" show-icon />
    <div v-if="loadError" class="load-error"><el-alert :title="loadError" type="error" :closable="false" /></div>
    <el-form ref="formRef" :model="form" label-width="105px" :disabled="saving" v-loading="loading">
      <section v-for="(row, index) in form.rows" :key="row.itemId" class="exception-row">
        <header><strong>{{ row.item.materNum }} · {{ row.item.materName }}</strong><span>{{ row.item.outbackNum }} · 当前 {{ row.expectedNumber }}</span></header>
        <div class="fields">
          <el-form-item label="异常类型"><el-select v-model="row.kind" @change="row.mixedMaterId = undefined; row.mixedNumber = undefined">
            <el-option label="少料（含缺料）" value="SHORT" /><el-option label="混料" value="MIX" />
          </el-select></el-form-item>
          <el-form-item label="发现日期" :prop="`rows.${index}.foundDate`" :rules="required('请选择发现日期')">
            <el-date-picker v-model="row.foundDate" type="date" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="减少数量" :prop="`rows.${index}.quantity`" :rules="quantityRules(Math.floor(row.expectedNumber), true)">
            <el-input-number v-model="row.quantity" :min="1" :max="Math.floor(row.expectedNumber)" :precision="0" :step="1" :controls="false" />
          </el-form-item>
          <div class="result">调整后数量：<strong class="decrease">{{ after(row) }}</strong></div>
          <template v-if="row.kind === 'MIX'">
            <el-form-item label="混入物料" :prop="`rows.${index}.mixedMaterId`" :rules="required('请选择混入物料')">
              <el-select v-model="row.mixedMaterId" filterable placeholder="选择实际混入物料">
                <el-option v-for="m in maters.filter(m => Number(m.value) !== Number(row.item.materId))" :key="m.value"
                  :value="Number(m.value)" :label="`${m.num || ''} ${m.label}`" />
              </el-select>
            </el-form-item>
            <el-form-item label="增加数量" :prop="`rows.${index}.mixedNumber`" :rules="quantityRules()">
              <el-input-number v-model="row.mixedNumber" :min="0.0001" :precision="4" :step="1" :controls="false" />
            </el-form-item>
          </template>
        </div>
        <el-form-item label="对应入库单">
          <el-select v-model="row.inDocId" filterable clearable :disabled="!!row.boundInDocId" placeholder="查找并选择；无法绑定可留空" @change="changeIncoming(row)">
            <el-option v-for="f in row.incoming" :key="f.docId" :value="f.docId" :label="flowLabel(f)" />
          </el-select>
        </el-form-item>
        <el-form-item label="对应领料单" :prop="`rows.${index}.pickDocId`" :rules="row.inDocId ? required('绑定入库单后必须选择领料单') : []">
          <el-select v-model="row.pickDocId" filterable clearable :disabled="!row.inDocId" placeholder="请选择包装领料单，可输入单号、日期或相关人搜索">
            <el-option v-for="f in row.picking" :key="f.docId" :value="f.docId" :label="flowLabel(f)" />
          </el-select>
          <div class="field-help">{{ row.inDocId ? '领料单必绑。请核对系统候选，找不到对应单据时不能提交。' : '未绑定入库单，领料单禁止绑定；本条只调整回执。' }}</div>
        </el-form-item>
        <el-form-item label="作证照片">
          <el-upload v-model:file-list="row.files" action="#" :auto-upload="false" list-type="picture-card" accept="image/jpeg,image/png"
            :limit="9" :on-change="file => upload(row, file)" :on-preview="file => preview(file.url)"
            :on-exceed="() => ElMessage.warning('每条异常最多9张照片')">
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="field-help">非必传，仅属于本条异常；JPG / PNG，每张不超过 10MB，最多 9 张。</div>
        </el-form-item>
        <el-form-item label="异常说明"><el-input v-model="row.remark" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
        <div v-if="row.kind === 'MIX'" class="field-help">混入物料将新增到同一回执，{{ row.inDocId ? '并同步新增该物料的入库及领料记录。' : '不生成入库及领料记录。' }}</div>
      </section>
    </el-form>
    <template #footer>
      <span v-if="uploading" class="upload-status">正在上传 {{ uploading }} 张照片</span>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading || !!loadError || uploading > 0 || !form.rows.length" @click="submit">保存异常并更新数量</el-button>
    </template>
    <el-image-viewer v-if="previewUrl" :url-list="[previewUrl]" @close="previewUrl = ''" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import dayjs from "dayjs";
import { generateUUID } from "@/utils";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormItemRule, type UploadFile, type UploadUserFile } from "element-plus";
import { exceptionOptions, saveException, uploadEvidence, type ExceptionRow, type ExceptionOptions, type ExceptionFlow } from "../exception";
import type { OutbackRecord } from "../../service";

type Evidence = UploadUserFile & { path?: string };
type Entry = ExceptionRow & ExceptionOptions & { files: Evidence[] };
const emit = defineEmits<{ saved: [] }>();
const props = defineProps<{ maters: Array<{ value: string | number; label: string; num?: string }> }>();
const maters = computed(() => props.maters);
const visible = ref(false), loading = ref(false), saving = ref(false), uploading = ref(0), loadError = ref("");
const formRef = ref<FormInstance>();
const form = reactive<{ rows: Entry[] }>({ rows: [] });
const previewUrl = ref("");
let requestId = "";
let loadVersion = 0;
const photoUrls = new Set<string>();
const required = (message: string): FormItemRule[] => [{ required: true, message, trigger: "change" }];
const quantityRules = (max = Number.MAX_SAFE_INTEGER, integer = false): FormItemRule[] => [{ validator: (_rule, value, done) => {
  done(typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max && (!integer || Number.isInteger(value))
    ? undefined : new Error(`请输入大于0且不超过${max}的${integer ? '整数' : '数量'}`));
}, trigger: "change" }];
const after = (row: Entry) => row.quantity == null ? row.expectedNumber : Number((row.expectedNumber - row.quantity).toFixed(4));
const flowLabel = (flow: ExceptionFlow) => `${flow.bizDate} · ${flow.docNo} · ${flow.flowName} · 数量 ${flow.quantity} · ${flow.relatedPerson || ''}${flow.remark ? ` · ${flow.remark}` : ''}`;
const changeIncoming = (row: Entry) => {
  row.pickDocId = row.inDocId ? row.picking.find(f => f.docId === row.boundPickDocId)?.docId : undefined;
};
const open = async (records: OutbackRecord[]) => {
  if (!records.length) return ElMessage.warning("请先勾选需要登记异常的回执条目");
  if (records.some(row => row.state !== 901 || row.number == null || !Number.isFinite(Number(row.number)) || Number(row.number) <= 0)) return ElMessage.warning("请选择数量大于0的已提交回执条目");
  const current = ++loadVersion;
  visible.value = true; loading.value = true; loadError.value = ""; form.rows = [];
  requestId = generateUUID();
  try {
    const entries = await Promise.all(records.map(async record => {
      const { data } = await exceptionOptions(record.id);
      return { ...data, itemId: record.id, kind: "SHORT" as const, foundDate: dayjs().format("YYYY-MM-DD"),
        expectedNumber: Number(data.item.number), inDocId: data.boundInDocId || undefined,
        pickDocId: data.boundInDocId ? data.picking.find(f => f.docId === data.boundPickDocId)?.docId : undefined,
        photos: [], files: [], remark: "" };
    }));
    if (current === loadVersion) form.rows = entries;
  } catch { if (current === loadVersion) loadError.value = "关联单据加载失败，请关闭后重试。"; }
  finally { if (current === loadVersion) loading.value = false; }
};
const upload = async (row: Entry, file: UploadFile) => {
  if (!file.raw) return;
  if (!['image/jpeg', 'image/png'].includes(file.raw.type) || file.raw.size > 10 * 1024 * 1024) {
    row.files = row.files.filter(f => f.uid !== file.uid); return ElMessage.warning("请上传10MB以内的JPG或PNG照片");
  }
  uploading.value++;
  try {
    const { data } = await uploadEvidence(row.itemId, file.raw);
    const current = row.files.find(f => f.uid === file.uid);
    if (current) {
      current.path = data; current.status = "success";
      current.url = URL.createObjectURL(file.raw); photoUrls.add(current.url);
    }
  } catch { row.files = row.files.filter(f => f.uid !== file.uid); ElMessage.error("照片上传失败，请重新上传"); }
  finally { uploading.value--; }
};
const preview = (url?: string) => { previewUrl.value = url || ""; };
const clearPhotos = () => { loadVersion++; photoUrls.forEach(URL.revokeObjectURL); photoUrls.clear(); };
const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return;
  for (const row of form.rows) {
    if (row.inDocId && (!row.pickDocId || [row.incoming.find(f => f.docId === row.inDocId), row.picking.find(f => f.docId === row.pickDocId)]
      .some(f => !f || Number(f.quantity) < Number(row.quantity)))) return ElMessage.warning("扣减数量不能超过绑定的入库或领料数量");
    if (row.files.some(file => !file.path)) return ElMessage.warning("请等待照片上传完成");
  }
  saving.value = true;
  try {
    await saveException(requestId, form.rows.map(row => ({ itemId: row.itemId, kind: row.kind, foundDate: row.foundDate,
      quantity: row.quantity, expectedNumber: row.expectedNumber, inDocId: row.inDocId, pickDocId: row.pickDocId,
      mixedMaterId: row.kind === "MIX" ? row.mixedMaterId : undefined, mixedNumber: row.kind === "MIX" ? row.mixedNumber : undefined,
      photos: row.files.map(file => file.path!), remark: row.remark })));
    ElMessage.success("异常已保存，关联数量已更新"); visible.value = false; emit("saved");
  } finally { saving.value = false; }
};
defineExpose({ open });
</script>

<style scoped>
.exception-row { margin-top: 18px; padding: 18px; border: 1px solid var(--el-border-color); border-radius: 8px; }
header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
header span, .field-help, .upload-status { color: var(--el-text-color-secondary); font-size: 13px; }
.field-help { width: 100%; line-height: 1.6; margin-top: 6px; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.el-select, .el-input-number, :deep(.el-date-editor) { width: 100%; }
.result { padding: 8px 0 18px 10px; }
.decrease { color: var(--el-color-success); }
.load-error { margin-top: 16px; }
@media (max-width: 640px) { .fields { grid-template-columns: 1fr; } .exception-row { padding: 12px 4px; } }
</style>
