<template>
  <el-drawer v-model="visible" title="生产日报核实" size="min(850px, 96vw)" destroy-on-close>
    <template v-if="data">
      <el-alert v-if="data.production.effStatus !== 'NORMAL'" :title="data.production.effReason || '无提醒原因'" :type="data.production.effStatus === 'PENDING' ? 'warning' : 'info'" :closable="false" show-icon />
      <el-descriptions :column="2" border class="review-info">
        <el-descriptions-item label="产品">{{ dict.dictMap.mater?.find(m => Number(m.value) === data?.production.materId)?.label || data.production.materId || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="员工">{{ dict.dictMap.staff?.find(s => Number(s.value) === data?.production.operatorId)?.label || data.production.operatorId || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ data.production.date }}</el-descriptions-item>
        <el-descriptions-item label="工序／机台">{{ data.production.process }} / {{ data.production.machine || '—' }}</el-descriptions-item>
        <el-descriptions-item label="产量／工时">{{ data.production.qty }}个 / {{ data.production.hours }}h</el-descriptions-item>
        <el-descriptions-item label="当前版本">{{ data.production.revision }}</el-descriptions-item>
        <el-descriptions-item v-if="currentEvidence.groupName || currentCheck.groupName" label="效率分组">{{ currentEvidence.groupName || currentCheck.groupName }}</el-descriptions-item>
        <el-descriptions-item v-if="currentCheck.basis" label="判断依据">{{ currentCheck.basis === 'STANDARD_REVIEW' ? '本人异常后，标准速度复核' : currentCheck.basis === 'STANDARD' ? '标准速度（本人无参考）' : currentCheck.basis === 'NONE' ? '暂无参考' : currentCheck.basis === 'SELF' ? '本人可用历史参考' : '历史规则' }}</el-descriptions-item>
        <el-descriptions-item v-if="['STANDARD', 'STANDARD_REVIEW'].includes(currentCheck.basis)" label="本次参考标准速度">{{ numberText(currentCheck.fallbackRate) }} 个/h</el-descriptions-item>
        <el-descriptions-item label="标准速度（固定）">{{ standardText(currentEvidence) }}</el-descriptions-item>
        <el-descriptions-item label="标准记录时间">{{ formatEffTime(currentEvidence.standard?.capturedAt, '未留存') }}</el-descriptions-item>
        <el-descriptions-item v-if="currentEvidence.standard?.filledAt" label="标准补入时间">{{ formatEffTime(currentEvidence.standard.filledAt) }}</el-descriptions-item>
        <el-descriptions-item label="本条速度">{{ numberText(data.production.actualRate) }} 个/h</el-descriptions-item>
        <el-descriptions-item label="本人平时速度">{{ numberText(data.production.usualRate) }} 个/h（{{ data.production.usualDays }}天）</el-descriptions-item>
        <el-descriptions-item label="本人最近速度">{{ numberText(data.production.recentRate) }} 个/h（{{ data.production.recentDays }}天）</el-descriptions-item>
        <el-descriptions-item v-if="currentCheck.usualStart" label="平时参考范围">{{ currentCheck.usualStart }} 至 {{ currentCheck.usualEnd }}</el-descriptions-item>
        <el-descriptions-item v-if="currentCheck.recentStart" label="最近参考范围">{{ currentCheck.recentStart }} 至 {{ currentCheck.recentEnd }}</el-descriptions-item>
        <el-descriptions-item label="核实状态">{{ effStatus[data.production.effStatus || 'UNCHECKED'] }}</el-descriptions-item>
      </el-descriptions>
      <p class="hint">标准速度有值后固定；当时没有标准的，后续首次确认标准时自动补入，补入后不再变动。历史效率结果不重算。</p>
      <template v-if="canHandle">
        <el-radio-group v-model="action" class="review-actions">
          <el-radio value="VERIFIED" :disabled="data.production.effStatus === 'INVALID'">核对无误</el-radio>
          <el-radio value="CORRECTED" :disabled="!auth.isExistence('production:eff:correct')">数据错误并更改</el-radio>
          <el-radio value="UNKNOWN">无法核实</el-radio>
        </el-radio-group>
        <el-form v-if="action === 'CORRECTED'" label-width="95px" :model="correction">
          <el-form-item label="生产日期"><el-date-picker v-model="correction.date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="产品"><el-select v-model="correction.materId" filterable><el-option v-for="m in dict.dictMap.mater || []" :key="m.value" :value="Number(m.value)" :label="m.label" /></el-select></el-form-item>
          <el-form-item label="员工"><el-select v-model="correction.operatorId" filterable><el-option v-for="s in dict.dictMap.staff || []" :key="s.value" :value="Number(s.value)" :label="s.label" /></el-select></el-form-item>
          <el-form-item label="工序"><el-input v-model="correction.process" /></el-form-item>
          <el-form-item label="机台"><el-input v-model="correction.machine" /></el-form-item>
          <el-form-item label="实际工时"><el-input-number v-model="correction.hours" :min="0.01" :precision="2" /></el-form-item>
          <el-form-item label="产量"><el-input-number v-model="correction.qty" :min="1" :precision="0" /></el-form-item>
          <el-form-item label="不良数"><el-input-number v-model="correction.defect" :min="0" :precision="0" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="correction.remark" /></el-form-item>
        </el-form>
        <el-input v-model="note" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="核实依据或更正说明（选填）" />
        <p class="hint">无法核实：不作参考、不计入效率。核实与更正不改变已经保存的计算结果。</p>
      </template>
      <el-collapse class="review-info">
        <el-collapse-item title="处理历史" name="reviews"><el-empty v-if="!data.reviews.length" description="尚无人工处理记录" /><el-timeline v-else><el-timeline-item v-for="r in data.reviews" :key="r.id" :timestamp="formatEffTime(r.createdAt)">{{ effStatus[r.action] }} · {{ r.actorName }}<p>{{ r.note || '未填写说明' }}</p></el-timeline-item></el-timeline></el-collapse-item>
        <el-collapse-item title="检测依据与日报版本" name="versions"><div v-for="v in data.versions" :key="v.id"><strong>版本{{ v.revision }} · {{ v.action }} · {{ formatEffTime(v.createdAt) }}</strong><p>当时标准速度：{{ standardText(readEvidence(v.evidence)) }}</p><pre>{{ formatEvidence(v.evidence) }}</pre></div></el-collapse-item>
      </el-collapse>
    </template>
    <template #footer><el-button @click="visible = false">关闭</el-button><el-button v-if="canHandle" type="primary" :loading="saving" @click="save">保存处理结果</el-button></template>
  </el-drawer>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/modules/auth';
import { useDictStore } from '@/stores/modules/dict';
import { getEffReview, resolveEffReview, numberText, formatEffTime, effStatus, requestKey, type EffReviewData } from '@/api/modules/efficiency';
import type { Production } from '@/api/interface/production';
const emit = defineEmits<{ changed: [] }>();
const auth = useAuthStore(), dict = useDictStore();
const visible = ref(false), saving = ref(false), data = ref<EffReviewData>(), action = ref('VERIFIED'), note = ref(''), key = ref('');
const readEvidence = (value?: string) => { try { return JSON.parse(value || '{}'); } catch { return {}; } };
const currentEvidence = computed(() => readEvidence(data.value?.versions[0]?.evidence));
const currentCheck = computed(() => currentEvidence.value.check || currentEvidence.value);
const standardText = (value: ReturnType<typeof readEvidence>) => value.standard?.available ? `${numberText(value.standard.rate)} 个/h（标准${value.standard.id}）` : '暂无已确认标准，后续确认后补入';
const correction = ref<Omit<Partial<Production>, "materId" | "operatorId"> & { materId?: number; operatorId?: number }>({});
const canHandle = computed(() => !!data.value && ['PENDING', 'UNKNOWN', 'INVALID'].includes(data.value.production.effStatus || '') && auth.isExistence('production:eff:review'));
const open = async (id: number) => {
  data.value = (await getEffReview(id)).data;
  correction.value = { ...data.value.production, materId: data.value.production.materId ?? undefined, operatorId: data.value.production.operatorId ?? undefined };
  action.value = data.value.production.effStatus === 'INVALID' ? 'UNKNOWN' : 'VERIFIED'; note.value = ''; key.value = requestKey(); visible.value = true;
  await dict.loadDicts(['mater', 'staff']);
};
const formatEvidence = (value: string) => { try { return JSON.stringify(JSON.parse(value), (_key, item) => typeof item === 'string' ? formatEffTime(item, '') : item, 2); } catch { return value; } };
const save = async () => {
  if (!data.value) return;
  if (action.value === 'CORRECTED' && (!correction.value.materId || !correction.value.operatorId || !correction.value.date || !correction.value.process?.trim() || Number(correction.value.hours) <= 0 || Number(correction.value.qty) <= 0)) { ElMessage.warning('请填写完整的更正数据'); return; }
  try { await ElMessageBox.confirm('保存本次核实结论？已经保存的效率结果保持不变。', '核实确认'); } catch { return; }
  saving.value = true;
  try { await resolveEffReview({ id: data.value.production.id, revision: data.value.production.revision, requestKey: key.value, action: action.value, note: note.value, correction: action.value === 'CORRECTED' ? correction.value : undefined }); ElMessage.success('已保存核实结果'); visible.value = false; emit('changed'); } finally { saving.value = false; }
};
defineExpose({ open });
</script>
<style scoped>
.review-info{margin:18px 0}.review-actions{display:flex;flex-wrap:wrap;height:auto;margin:18px 0}.hint{color:var(--el-text-color-secondary);line-height:1.7}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;max-height:260px;overflow:auto}
</style>
