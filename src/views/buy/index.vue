<template>
  <main class="purchase-home">
    <section class="hero">
      <div><p class="eyebrow">PURCHASE CONTROL CENTER</p><h1>采购工作台</h1><p>集中查看请购、采购、回执进度和当前待处理材料。</p></div>
      <div class="hero-actions"><el-button type="primary" :icon="ShoppingCart" @click="router.push('/buy/assistPurchase')">处理未采购材料</el-button><el-button :icon="Refresh" :loading="loading" @click="load">刷新数据</el-button></div>
    </section>

    <section class="metrics" aria-label="采购概览">
      <article v-for="item in metrics" :key="item.label" class="metric-card"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.hint }}</small></article>
    </section>

    <section class="workspace-grid">
      <article class="panel todo-panel">
        <header class="panel-head"><div><h2>待办事项</h2><p>需要当前角色继续处理的业务</p></div><el-tag type="warning" effect="plain">{{ activeRole?.count||0 }} 项</el-tag></header>
        <el-segmented v-if="home.isAdmin" v-model="activeRoleKey" :options="roleOptions" aria-label="切换待办角色" class="role-tabs"/>
        <div v-if="activeRole?.items?.length" class="todo-list">
          <button v-for="item in activeRole.items" :key="item.id" class="todo-item" type="button" @click="router.push(item.path)">
            <span class="todo-mark"><el-icon><Document/></el-icon></span><span class="todo-copy"><strong>{{ item.assistCode }} · {{ item.assistName||'未命名辅材' }}</strong><small>{{ item.assistSpec||'无规格' }} · 未采购 {{ item.notPurchaseQty }} {{ item.unit||'' }}</small></span><el-icon class="arrow"><ArrowRight/></el-icon>
          </button>
        </div>
        <el-empty v-else description="当前角色暂无待办" :image-size="72"/>
      </article>

      <article class="panel progress-panel">
        <header class="panel-head"><div><h2>采购进度</h2><p>辅材单据当前状态分布</p></div></header>
        <div class="progress-list"><div v-for="row in progress" :key="row.label" class="progress-row"><div><span>{{ row.label }}</span><b>{{ row.done }}/{{ row.total }}</b></div><el-progress :percentage="row.percent" :stroke-width="10" :show-text="false"/></div></div>
      </article>
    </section>

    <section class="panel shortcuts">
      <header class="panel-head"><div><h2>快捷入口</h2><p>按业务流转顺序进入常用单据</p></div></header>
      <nav class="shortcut-grid" aria-label="采购快捷入口"><button v-for="link in links" :key="link.path" type="button" @click="router.push(link.path)"><el-icon><component :is="link.icon"/></el-icon><span><strong>{{ link.title }}</strong><small>{{ link.desc }}</small></span><el-icon><ArrowRight/></el-icon></button></nav>
    </section>
  </main>
</template>
<script setup lang="ts">
import{computed,onMounted,ref}from"vue";import{useRouter}from"vue-router";import{ArrowRight,Document,Finished,Refresh,ShoppingCart}from"@element-plus/icons-vue";import{getPurchaseHome,tablePage as assistTablePage,unwrap}from"./assistProcurement/service";
const router=useRouter(),loading=ref(false),home=ref<any>({roles:[]}),activeRoleKey=ref('purchase'),totals=ref<any>({req:0,po:0,receipt:0,donePo:0});
const roleOptions=computed(()=>(home.value.roles||[]).map((r:any)=>({label:`${r.label} ${r.count}`,value:r.role}))),activeRole=computed(()=>(home.value.roles||[]).find((r:any)=>r.role===activeRoleKey.value)||(home.value.roles||[])[0]);
const metrics=computed(()=>[{label:'未采购材料',value:home.value.pendingPurchaseCount||0,hint:'原材料与辅材待采购明细'},{label:'辅材请购单',value:totals.value.req,hint:'全部有效单据'},{label:'辅材采购单',value:totals.value.po,hint:'全部有效单据'},{label:'辅材回执单',value:totals.value.receipt,hint:'支持多采购单回执'}]);
const progress=computed(()=>[{label:'请购转采购',done:Math.max(totals.value.req-(home.value.pendingPurchaseCount||0),0),total:totals.value.req,percent:percent(Math.max(totals.value.req-(home.value.pendingPurchaseCount||0),0),totals.value.req)},{label:'采购完成回执',done:totals.value.donePo,total:totals.value.po,percent:percent(totals.value.donePo,totals.value.po)}]);
const links=[{title:'辅材请购',desc:'一张单添加多种辅材',path:'/buy/assistRequisition',icon:Document},{title:'辅材采购',desc:'处理未采购请购明细',path:'/buy/assistPurchase',icon:ShoppingCart},{title:'辅材回执',desc:'汇总多张采购单回执',path:'/buy/assistReceipt',icon:Finished},{title:'原材料回执',desc:'多采购单分批回执',path:'/buy/rawReceipt',icon:Finished}];
const percent=(done:number,total:number)=>total?Math.min(Math.round(done/total*100),100):0;
const page=async(kind:any,extra:any={})=>unwrap<any>(assistTablePage(kind,{pageNum:1,pageSize:1,...extra}));
const load=async()=>{loading.value=true;try{home.value=await unwrap(getPurchaseHome());activeRoleKey.value=home.value.activeRole||'purchase';const[req,po,receipt,donePo]=await Promise.all([page('requisition'),page('purchase'),page('receipt'),page('purchase',{status:'已完成'})]);totals.value={req:req.total||0,po:po.total||0,receipt:receipt.total||0,donePo:donePo.total||0}}finally{loading.value=false}};onMounted(load);
</script>
<style scoped>
.purchase-home{--surface:#fff;--muted:#64748b;--line:#dbeafe;display:grid;gap:16px;color:#1e293b}.hero{display:flex;justify-content:space-between;align-items:flex-end;padding:24px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#eff6ff 0%,#fff 58%,#fffbeb 100%)}.eyebrow{margin:0 0 6px;color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:.12em}.hero h1{margin:0;font-size:28px}.hero p:not(.eyebrow){margin:8px 0 0;color:var(--muted)}.hero-actions{display:flex;gap:8px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metric-card,.panel{border:1px solid var(--line);border-radius:12px;background:var(--surface)}.metric-card{display:grid;gap:6px;padding:18px}.metric-card span,.metric-card small,.panel-head p{color:var(--muted)}.metric-card strong{font-size:30px;font-variant-numeric:tabular-nums}.workspace-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,1fr);gap:16px}.panel{padding:18px}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.panel-head h2{margin:0;font-size:18px}.panel-head p{margin:4px 0 0;font-size:13px}.role-tabs{margin-bottom:14px}.todo-list{display:grid;gap:8px}.todo-item,.shortcut-grid button{width:100%;border:1px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;text-align:left;transition:border-color .18s,background-color .18s}.todo-item{display:grid;grid-template-columns:40px 1fr 20px;align-items:center;gap:10px;padding:11px 12px}.todo-item:hover,.todo-item:focus-visible,.shortcut-grid button:hover,.shortcut-grid button:focus-visible{border-color:#3b82f6;background:#eff6ff;outline:2px solid transparent}.todo-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:#dbeafe;color:#1d4ed8}.todo-copy{display:grid;gap:4px;min-width:0}.todo-copy strong,.todo-copy small{overflow-wrap:anywhere}.todo-copy small{color:var(--muted)}.arrow{color:#94a3b8}.progress-list{display:grid;gap:22px;padding-top:8px}.progress-row>div{display:flex;justify-content:space-between;margin-bottom:8px}.progress-row b{font-variant-numeric:tabular-nums}.shortcut-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.shortcut-grid button{display:grid;grid-template-columns:32px 1fr 18px;align-items:center;gap:10px;padding:14px;color:#1e293b}.shortcut-grid button>span{display:grid;gap:4px}.shortcut-grid small{color:var(--muted)}
@media(max-width:1000px){.metrics,.shortcut-grid{grid-template-columns:repeat(2,1fr)}.workspace-grid{grid-template-columns:1fr}}@media(max-width:640px){.hero{align-items:flex-start;flex-direction:column;gap:16px}.hero-actions{width:100%;flex-wrap:wrap}.metrics,.shortcut-grid{grid-template-columns:1fr}.purchase-home{gap:12px}.panel,.hero{padding:16px}}
@media(prefers-reduced-motion:reduce){.todo-item,.shortcut-grid button{transition:none}}
</style>
