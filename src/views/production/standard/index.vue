<template>
  <div class="standard-page">
    <el-alert v-if="!canView" title="请在角色业务权限中开通“查看生产效率”" type="info" :closable="false" />
    <template v-else>
      <div class="card standard-header"><h2>正常速度</h2><p>优先参考前三个完整月；样本不足时逐月向前扩大，首次达标即停止。审核通过立即生效，历史效率结果不变。</p><el-radio-group v-model="mode" @change="reload"><el-radio-button value="pending">月度建议</el-radio-button><el-radio-button value="current">当前执行</el-radio-button></el-radio-group>
        <el-select v-if="mode === 'pending'" v-model="batchId" class="batch-select" @change="reload"><el-option v-for="b in batches" :key="b.id" :value="b.id" :label="`${b.month.slice(0,7)} 月度建议`" /></el-select>
      </div>
      <ProTable v-if="ready" ref="table" :columns="columns" :request-api="load" :data-callback="callback" row-key="id">
        <template #tableHeader="scope"><template v-if="mode === 'pending' && canConfirm"><el-button type="primary" :disabled="!scope.isSelected || saving" @click="confirm(scope.selectedList as EffStandard[], false)">确认勾选项</el-button><el-button :disabled="saving || !pendingCount" @click="confirm([], true)">确认本月全部待确认项（{{ pendingCount }}）</el-button></template><span class="rule-text">至少2人 · 工时＞20h · 至少5个生产日期</span></template>
        <template #approvedAt="{ row }">{{ formatEffTime(row.approvedAt) }}</template>
        <template #materName="{ row }">{{ row.materName }}<div v-if="row.materNum === '9000005918' && !row.machineGroup" class="muted">未分组旧标准；尚未确认新标准的组继续沿用</div></template>
        <template #oldRate="{ row }">{{ numberText(row.oldRate) }}</template>
        <template #rate="{ row }">{{ numberText(row.rate) }} <span class="muted">个/h</span></template>
        <template #change="{ row }">{{ row.rate == null ? '—' : row.oldRate == null ? '首次定标' : `${((row.rate / row.oldRate - 1) * 100).toFixed(2)}%` }}</template>
        <template #period="{ row }">{{ period(row) }}</template>
        <template #sample="{ row }">{{ row.employeeCount }}人 / {{ numberText(row.totalHours) }}h / {{ row.productionDays }}天</template>
        <template #status="{ row }"><el-tag :type="row.status === 'PENDING' ? 'warning' : row.status === 'INSUFFICIENT' ? 'info' : 'success'">{{ standardStatus[row.status] }}</el-tag><div class="muted">{{ row.reason }}</div></template>
        <template #operation="{ row }"><el-button link type="primary" @click="showHistory(row.id)">依据／历史</el-button><el-button v-if="mode === 'pending' && row.status === 'PENDING' && canConfirm" link type="primary" :disabled="saving" @click="confirm([row], false)">确认</el-button></template>
      </ProTable>
      <el-drawer v-model="historyVisible" title="标准依据与变动历史" size="min(900px, 96vw)"><template v-if="history">
        <el-descriptions :column="2" border><el-descriptions-item label="产品">{{ history.candidate.materNum }} {{ history.candidate.materName }}</el-descriptions-item><el-descriptions-item label="工序">{{ history.candidate.process }}</el-descriptions-item><el-descriptions-item label="参考期间">{{ period(history.candidate) }}</el-descriptions-item><el-descriptions-item label="生成时间">{{ formatEffTime(evidence(history.candidate).generatedAt || history.batch.createdAt) }}</el-descriptions-item></el-descriptions>
        <h3>已执行的速度</h3><el-table :data="history.history"><el-table-column prop="rate" label="速度（个/h）" /><el-table-column prop="approvedAt" label="生效时间" min-width="190"><template #default="{ row }">{{ formatEffTime(row.approvedAt) }}</template></el-table-column><el-table-column prop="approvedName" label="确认人" /></el-table>
        <h3>各员工通常速度</h3><el-table :data="evidenceEmployees"><el-table-column prop="operatorId" label="员工姓名"><template #default="{ row }">{{ dict.getLabel('staff', row.operatorId) }}</template></el-table-column><el-table-column label="通常速度"><template #default="{row}">{{ numberText(row.rate) }} 个/h</template></el-table-column><el-table-column label="生产日数"><template #default="{row}">{{ row.days.length }}</template></el-table-column><el-table-column type="expand"><template #default="{row}"><el-table :data="row.days"><el-table-column prop="date" label="日期" /><el-table-column prop="qty" label="产量" /><el-table-column prop="hours" label="工时" /><el-table-column label="速度"><template #default="{row:day}">{{ numberText(day.rate) }}</template></el-table-column></el-table></template></el-table-column></el-table>
      </template></el-drawer>
    </template>
  </div>
</template>
<script setup lang="ts" name="productionStandard">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable from '@/components/ProTable/index.vue';
import type { ColumnProps } from '@/components/ProTable/interface';
import { useAuthStore } from '@/stores/modules/auth';
import { useDictStore } from '@/stores/modules/dict';
import { getEffBatches, getEffStandards, getEffStandardHistory, confirmEffStandards, numberText, formatEffTime, standardStatus, type EffStandard, type EffBatch, type PageData } from '@/api/modules/efficiency';
const auth = useAuthStore(), dict = useDictStore(), table = ref<InstanceType<typeof ProTable>>();
const canView = computed(() => auth.isExistence('production:eff:view')), canConfirm = computed(() => auth.isExistence('production:eff:confirm'));
const mode = ref('pending'), batches = ref<EffBatch[]>([]), batchId = ref<number>(), ready = ref(false), saving = ref(false), pendingCount = ref(0);
const historyVisible = ref(false), history = ref<Awaited<ReturnType<typeof getEffStandardHistory>>['data']>();
const evidence = (row?: EffStandard) => { try { return JSON.parse(row?.evidence || '{}'); } catch { return {}; } };
const evidenceEmployees = computed(() => evidence(history.value?.candidate).employees || []);
const period = (row: EffStandard) => {
  const saved = evidence(row), batch = batches.value.find(b => b.id === row.batchId);
  const from = saved.startDate || batch?.startDate, to = saved.endDate || batch?.endDate;
  return from && to ? `${from} 至 ${to}${saved.months ? `（${saved.months}个月）` : ''}` : '—';
};
const columns: ColumnProps<EffStandard>[] = [
  { type: 'selection', width: 48, selectable: (row: EffStandard) => row.status === 'PENDING' },
  { prop: 'materNum', label: '产品编号', minWidth: 145 }, { prop: 'materName', label: '产品名称', minWidth: 180 },
  { prop: 'keyword', label: '产品搜索', isShow: false, search: { el: 'input' } },
  { prop: 'process', label: '工序', width: 110, search: { el: 'input' } },
  { prop: 'oldRate', label: '调整前速度', width: 115 }, { prop: 'rate', label: '建议／已执行速度', minWidth: 145 },
  { prop: 'period', label: '实际参考期间', minWidth: 280 },
  { prop: 'change', label: '本次变动', width: 110 }, { prop: 'sample', label: '参考样本', minWidth: 190 },
  { prop: 'status', label: '状态', minWidth: 180, enum: Object.entries(standardStatus).map(([value,label]) => ({value,label})), search: { el: 'select' } }, { prop: 'approvedAt', label: '生效时间', minWidth: 185 },
  { prop: 'operation', label: '操作', fixed: 'right', width: 155 }
];
const callback = (data: PageData<EffStandard>) => ({ list: data.records, total: data.total });
const load = (params: object) => getEffStandards({ ...params, current: mode.value === 'current', ...(mode.value === 'pending' ? { batchId: batchId.value } : {}) });
const countPending = async () => { pendingCount.value = batchId.value ? (await getEffStandards({ pageNum: 1, pageSize: 1, batchId: batchId.value, status: 'PENDING' })).data.total : 0; };
const reload = async () => { table.value?.element?.clearSelection(); table.value?.getTableList(); await countPending(); };
const confirm = async (rows: EffStandard[], all: boolean) => {
  if (!batchId.value) return;
  const count = all ? pendingCount.value : rows.length;
  if (!count) return;
  try { await ElMessageBox.confirm(`确认${all ? '本月跨全部分页' : '勾选'}的${count}项正常速度？立即生效，历史计算结果不变。`, '确认正常速度', { type: 'warning' }); } catch { return; }
  saving.value = true;
  try { const result = await confirmEffStandards({ batchId: batchId.value, all, ids: rows.map(r => r.id) }); ElMessage.success(`已生效${result.data}项`); await reload(); } finally { saving.value = false; }
};
const showHistory = async (id: number) => { const [result] = await Promise.all([getEffStandardHistory(id), dict.loadDicts(['staff'])]); history.value = result.data; historyVisible.value = true; };
onMounted(async () => { if (!canView.value) return; batches.value = (await getEffBatches()).data; batchId.value = batches.value[0]?.id; ready.value = true; await countPending(); });
</script>
<style scoped>
.standard-page{display:flex;flex-direction:column;height:100%;gap:12px}.standard-header{padding:16px 20px}.standard-header h2{margin:0;font-size:20px}.standard-header p,.muted{color:var(--el-text-color-secondary);font-size:13px}.batch-select{width:370px;max-width:100%;margin-left:16px}.rule-text{margin-left:12px;color:var(--el-text-color-secondary)}h3{margin-top:24px}@media(max-width:700px){.batch-select{margin:12px 0 0}.rule-text{display:block;margin:8px 0}}
</style>
