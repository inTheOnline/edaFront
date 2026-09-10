<template>
  <div class="production-home">
    <div class="card heading"><div><h1>生产首页</h1><p>先核实日报，再确认正常速度，最后查看员工效率。</p></div><el-button @click="load">刷新</el-button></div>
    <el-alert v-if="!canView" title="请在业务权限中开通“查看生产效率”" :closable="false" />
    <template v-else>
      <div class="metrics"><div v-for="item in metrics" :key="item.label" class="card metric"><span>{{ item.label }}</span><strong>{{ item.value.toLocaleString() }}</strong><small>{{ item.note }}</small></div></div>
      <div class="steps"><div v-for="(item, index) in steps" :key="item.path" class="card step"><span class="step-num">0{{ index + 1 }}</span><h2>{{ item.title }}</h2><p>{{ item.text }}</p><el-button type="primary" plain @click="router.push(item.path)">{{ item.button }}</el-button></div></div>
      <div class="card explanation"><h2>效率怎么算</h2><p>每条有效日报的产量 ÷ 对应正常速度 = 应用工时。员工效率 = 应用工时合计 ÷ 实际生产工时合计 × 100%。</p><p>例如：正常每小时100个，生产800个应该用8小时；实际用了10小时，效率就是80%。</p><p>待核实、无法核实、基础无效及辅助工作不计入；没有正常速度的日报暂不计入。</p><el-divider /><h3>本版不参与的工序</h3><div class="tags"><el-tag v-for="item in overview?.excludedProcesses" :key="item.process" type="info">{{ item.process }}</el-tag></div><p>标准确认后立即用于新计算，已保存的历史结果保留原样。</p></div>
    </template>
  </div>
</template>
<script setup lang="ts" name="productionHome">
import { computed, onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/modules/auth';
import { getEffOverview } from '@/api/modules/efficiency';
const router = useRouter(), auth = useAuthStore();
const canView = computed(() => auth.isExistence('production:eff:view'));
const overview = ref<Awaited<ReturnType<typeof getEffOverview>>['data']>();
const count = (status: string) => Number(overview.value?.records.find(r => r.status === status)?.count || 0);
const metrics = computed(() => [
  { label: '待核实日报', value: count('PENDING'), note: '黄色提示，暂不参与效率' },
  { label: '正在执行的正常速度', value: overview.value?.activeCount || 0, note: '按产品和工序区分' },
  { label: '无法核实日报', value: count('UNKNOWN'), note: '保留原记录，完全不作参考' },
  { label: '基础无效日报', value: count('INVALID'), note: '更正后才能参考' }
]);
const steps = [
  { title: '核实日报', text: '直接查看黄色记录的原因，选择核对无误、更正数据或无法核实。', path: '/production/dailySheet', button: '打开生产日报' },
  { title: '审核正常速度', text: '比较本月建议与原速度，按项勾选或一次确认全部，依据随时可查。', path: '/production/standard', button: '查看标准建议' },
  { title: '查看员工效率', text: '选择统计期间保存计算结果，逐人查看效率及每条日报的计算依据。', path: '/production/efficiency', button: '查看效率结果' }
];
const load = async () => { if (canView.value) overview.value = (await getEffOverview()).data; };
onActivated(load);
</script>
<style scoped>
.production-home{overflow:auto;display:flex;flex-direction:column;gap:18px;padding-bottom:20px}.heading{display:flex;justify-content:space-between;align-items:center;padding:24px}h1{font-size:24px;margin:0}h2{font-size:18px;margin:12px 0}h3{font-size:15px}p{color:var(--el-text-color-secondary);line-height:1.8;margin:10px 0}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.metric{padding:24px;display:flex;flex-direction:column;gap:14px}.metric span,small{color:var(--el-text-color-secondary)}.metric strong{font-size:32px;font-weight:600;font-variant-numeric:tabular-nums}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.step{padding:24px}.step-num{font-size:14px;color:var(--el-color-primary)}.step p{min-height:50px}.explanation{padding:20px 24px}.tags{display:flex;flex-wrap:wrap;gap:8px}@media(max-width:1000px){.metrics{grid-template-columns:repeat(2,1fr)}.steps{grid-template-columns:1fr}}
</style>
