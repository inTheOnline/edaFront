<template>
  <div class="efficiency-page">
    <el-alert v-if="!canView" title="请在业务权限中开通“查看生产效率”" :closable="false" />
    <template v-else>
      <div class="card heading"><h2>员工效率</h2><p>按当前已确认速度生成一份独立结果。历史结果不会被修改。</p><div class="controls"><el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /><el-button type="primary" :loading="saving" @click="calculate">计算并保存结果</el-button></div></div>
      <ProTable ref="table" :columns="columns" :request-api="getEffRuns" :data-callback="callback" row-key="id"><template #createdAt="{row}">{{ formatEffTime(row.createdAt) }}</template><template #operation="{row}"><el-button link type="primary" @click="open(row.id)">查看结果</el-button></template></ProTable>
      <el-drawer v-model="visible" title="已保存的效率结果" size="min(1150px, 98vw)"><template v-if="result">
        <el-descriptions :column="2" border><el-descriptions-item label="统计期间">{{ result.run.startDate }} 至 {{ result.run.endDate }}</el-descriptions-item><el-descriptions-item label="保存时间">{{ formatEffTime(result.run.createdAt) }}</el-descriptions-item><el-descriptions-item label="操作人">{{ result.run.actorName }}</el-descriptions-item><el-descriptions-item label="结果编号">{{ result.run.id }}</el-descriptions-item></el-descriptions>
        <el-alert class="notice" title="效率＝应用工时合计÷参与计算的实际工时合计×100%。不参与的工时、产量均未进入公式。" type="info" :closable="false" />
        <el-table :data="result.summary" border><el-table-column prop="operatorName" label="员工" min-width="100" /><el-table-column label="员工效率" min-width="110"><template #default="{row}"><strong>{{ row.efficiency == null ? '未参与' : numberText(row.efficiency) + '%' }}</strong></template></el-table-column><el-table-column label="应用工时(h)" min-width="120"><template #default="{row}">{{ numberText(row.standardHours) }}</template></el-table-column><el-table-column label="参与的实际工时(h)" min-width="150"><template #default="{row}">{{ numberText(row.actualHours) }}</template></el-table-column><el-table-column label="未参与工时(h)" min-width="125"><template #default="{row}">{{ numberText(row.excludedHours) }}</template></el-table-column><el-table-column prop="includedCount" label="参与条数" /><el-table-column label="明细" width="90"><template #default="{row}"><el-button link type="primary" @click="showDetails(row.operatorId)">查看</el-button></template></el-table-column></el-table>
        <h3>日报计算明细</h3><div class="controls"><el-button @click="showDetails(null)">全部员工</el-button><el-radio-group v-model="included" @change="loadDetails"><el-radio-button value="all">全部</el-radio-button><el-radio-button value="1">参与</el-radio-button><el-radio-button value="0">未参与</el-radio-button></el-radio-group></div>
        <el-table :data="details" border class="notice"><el-table-column prop="date" label="日期" width="110" /><el-table-column prop="operatorName" label="员工" width="90" /><el-table-column prop="materNum" label="产品编号" min-width="130" /><el-table-column prop="process" label="工序" width="100" /><el-table-column prop="qty" label="产量" /><el-table-column prop="hours" label="工时" /><el-table-column label="当时正常速度" width="125"><template #default="{row}">{{ numberText(row.standardRate) }}</template></el-table-column><el-table-column label="应用工时" width="100"><template #default="{row}">{{ numberText(row.standardHours) }}</template></el-table-column><el-table-column prop="reason" label="参与情况／原因" min-width="210" /><el-table-column label="保存依据" width="160"><template #default="{row}">日报{{row.productionId}} / 第{{row.revision}}版<br />标准{{row.standardId || '—'}}</template></el-table-column></el-table>
        <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="total, prev, pager, next" @current-change="loadDetails" />
      </template></el-drawer>
    </template>
  </div>
</template>
<script setup lang="ts" name="productionEfficiency">
import { computed, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/modules/auth';
import ProTable from '@/components/ProTable/index.vue';
import type { ColumnProps } from '@/components/ProTable/interface';
import { getEffRuns, createEffRun, getEffResult, getEffDetails, numberText, formatEffTime, requestKey, type EffRun, type EffDetail, type PageData } from '@/api/modules/efficiency';
const auth = useAuthStore(), canView = computed(() => auth.isExistence('production:eff:view'));
const range = ref<string[]>([]), saving = ref(false), visible = ref(false), table = ref<InstanceType<typeof ProTable>>();
const result = ref<Awaited<ReturnType<typeof getEffResult>>['data']>(), details = ref<EffDetail[]>([]), page = ref(1), total = ref(0), operatorId = ref<number | null>(null), included = ref('all');
let key = '', keyRange = '';
const columns: ColumnProps<EffRun>[] = [{prop:'id',label:'结果编号',width:100},{prop:'startDate',label:'开始日期'},{prop:'endDate',label:'结束日期'},{prop:'createdAt',label:'保存时间',minWidth:185},{prop:'actorName',label:'操作人'},{prop:'operation',label:'操作',width:110}];
const callback = (data: PageData<EffRun>) => ({list:data.records,total:data.total});
const calculate = async () => {
  if (range.value?.length !== 2) { await ElMessageBox.alert('请先选择统计日期范围','提示'); return; }
  try { await ElMessageBox.confirm('按当前已确认速度保存新结果？此前保存的所有结果保持不变。','计算员工效率'); } catch { return; }
  const selected = range.value.join('/'); if (!key || keyRange !== selected) { key=requestKey(); keyRange=selected; }
  saving.value=true;
  try { const response=await createEffRun({startDate:range.value[0],endDate:range.value[1],requestKey:key}); key=''; table.value?.getTableList(); await open(response.data); } finally { saving.value=false; }
};
const open = async (id:number) => { result.value=(await getEffResult(id)).data; visible.value=true; included.value='all'; await showDetails(null); };
const showDetails = async (id:number|null) => { operatorId.value=id; page.value=1; await loadDetails(); };
const loadDetails = async () => { if(!result.value)return; const response=await getEffDetails(result.value.run.id,{pageNum:page.value,pageSize:20,...(operatorId.value==null?{}:{operatorId:operatorId.value}),...(included.value==='all'?{}:{included:Number(included.value)})});details.value=response.data.records;total.value=response.data.total; };
</script>
<style scoped>
.efficiency-page{display:flex;flex-direction:column;height:100%;gap:12px}.heading{padding:18px 22px}h2{margin:0;font-size:20px}p{color:var(--el-text-color-secondary);line-height:1.7}.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.notice{margin:18px 0}.el-pagination{margin:20px 0}h3{margin-top:28px}
</style>
