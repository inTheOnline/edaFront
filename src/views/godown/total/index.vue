<template>
  <div class="stock-page">
    <el-dialog v-model="settingsVisible" title="库存流水类型管理" width="90%" destroy-on-close>
      <FlowTypeSettings v-if="settingsVisible" />
      <template #footer><el-button @click="settingsVisible = false">关闭</el-button></template>
    </el-dialog>
    <div v-if="showSwitcher" class="warehouse-switcher">
      <el-segmented v-model="warehouseCode" :options="warehouseOptions" @change="proTableRef?.reset()" />
    </div>
    <ProTable v-if="warehouseCode" ref="proTableRef" :columns="columns" :request-api="requestTotal" :dataCallback="dataCallback"
      :pagination="true" :tool-button="['refresh','setting','search']" row-key="itemId" striped
      :search-col="{xs:2,sm:2,md:3,lg:3,xl:4}">
      <template #tableHeader>
        <el-button type="primary" :icon="Download" @click="exportCurrent">导出当前页库存</el-button>
        <el-dropdown trigger="click" @command="handleMore">
          <el-button :loading="checking">更多操作<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu>
            <el-dropdown-item command="flowTypes">库存流水类型管理</el-dropdown-item>
            <el-dropdown-item command="check" :disabled="checking">库存一致性检查</el-dropdown-item>
          </el-dropdown-menu></template>
        </el-dropdown>
        <el-alert v-if="checkRows.length" type="error" :closable="false" show-icon
          :title="`库存数据异常：发现 ${checkRows.length} 项差异，请查看受影响物料`" />
        <el-button v-if="checkRows.length" type="danger" link @click="checkVisible=true">查看差异</el-button>
      </template>
      <template #readyNumber="{row}"><el-button link type="primary" @click="showFlows(row,'READY')">{{ row.readyNumber }}</el-button></template>
      <template #stockNumber="{row}"><el-button link type="primary" @click="showFlows(row,'QUALIFIED')">{{ row.stockNumber }}</el-button></template>
      <template #number="{row}"><el-button link type="primary" @click="showFlows(row)">{{ row.number }}</el-button></template>
      <template #operation="scope"><el-button type="primary" link :icon="View" @click="showDetail(scope.row)">详情</el-button></template>
    </ProTable>
    <el-drawer v-model="flowVisible" :title="flowTitle" size="90%" destroy-on-close @closed="proTableRef?.getTableList()">
      <StockFlow v-if="flowVisible" :key="`${flowItemId}-${flowQuality}`" :item-type="props.itemType"
        :fixed-warehouse-code="warehouseCode" :fixed-item-id="flowItemId" :fixed-quality-status="flowQuality"
        :show-switcher="false" read-only />
    </el-drawer>
    <el-dialog v-model="checkVisible" title="库存数据异常" width="90%">
      <p>以下差额以有效流水为基准，正数表示多记，负数表示少记。这是系统记账差异，不代表实物盘亏；请核对关联单据，不会自动修改库存。</p>
      <el-table :data="checkRows" border max-height="500">
        <el-table-column prop="itemCode" label="物料编号" min-width="150" />
        <el-table-column prop="itemName" label="物料名称" min-width="200" />
        <el-table-column label="库存类别" width="100"><template #default="{row}">{{ qualityName(row.qualityStatus) }}</template></el-table-column>
        <el-table-column prop="flowQuantity" label="有效流水 / 统计" width="145" />
        <el-table-column prop="balanceQuantity" label="记账余额" width="110" />
        <el-table-column prop="ledgerQuantity" label="台账数量" width="110" />
        <el-table-column label="余额差额" width="110"><template #default="{row}">{{ difference(row.balanceQuantity,row.flowQuantity) }}</template></el-table-column>
        <el-table-column label="台账差额" width="110"><template #default="{row}">{{ difference(row.ledgerQuantity,row.flowQuantity) }}</template></el-table-column>
        <el-table-column prop="docIds" label="关联单据编号" min-width="180" />
      </el-table>
    </el-dialog>
    <el-drawer v-model="detailVisible" title="库存详情" size="420px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="仓库">{{ currentWarehouse?.name }}</el-descriptions-item>
        <el-descriptions-item label="物料编号">{{ detail.itemCode || detail.materNum }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ detail.itemName || detail.materName }}</el-descriptions-item>
        <template v-if="dualMode"><el-descriptions-item label="未检数量">{{ detail.readyNumber }}</el-descriptions-item><el-descriptions-item label="已检数量">{{ detail.stockNumber }}</el-descriptions-item></template>
        <el-descriptions-item v-else label="库存数量">{{ detail.number }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import FlowTypeSettings from "./FlowTypeSettings.vue";
import { ElMessage } from "element-plus";
import { ArrowDown, Download, View } from "@element-plus/icons-vue";
import ProTable from "@/components/ProTable/index.vue";
import { getStockTotal, getWarehouses, StockWarehouse, checkStock, qualityName } from "@/api/modules/stock";
import StockFlow from "../flow/index.vue";
import { useDictStore } from "@/stores/modules/dict";

const props=withDefaults(defineProps<{itemType?:"PRODUCT"|"RAW"|"ASSIST";fixedWarehouseCode?:string;showSwitcher?:boolean}>(),{itemType:"PRODUCT",fixedWarehouseCode:"",showSwitcher:true});
const dictStore=useDictStore();
const settingsVisible = ref(false);
const handleMore = (command: string) => {
  if (command === "flowTypes") settingsVisible.value = true;
  else void runCheck(true);
};
const proTableRef=ref<any>(),warehouses=ref<StockWarehouse[]>([]),warehouseCode=ref("");
const currentWarehouse=computed(()=>warehouses.value.find(item=>item.code===warehouseCode.value));
const warehouseOptions=computed(()=>warehouses.value.map(item=>({label:item.name,value:item.code})));
const dualMode=computed(()=>currentWarehouse.value?.summaryMode==="DUAL");
const columns=computed<any[]>(()=>[
  {type:"index",label:"序号",width:60,align:"center",index:(i:number)=>(proTableRef.value?.pageable.pageNum-1)*proTableRef.value?.pageable.pageSize+i+1},
  ...(props.itemType==="PRODUCT"?[{label:"客户",prop:"custId",width:130,enum:dictStore.dictMap.cust,search:{el:"select"}}]:[]),
  {label:"物料编号",prop:props.itemType==="PRODUCT"?"materNum":"itemCode",minWidth:160,search:{el:"input",key:"keyword",props:{placeholder:"编号或名称"}}},
  {label:"物料名称",prop:props.itemType==="PRODUCT"?"materName":"itemName",minWidth:260},
  ...(dualMode.value?[{label:"未检数量",prop:"readyNumber",width:130},{label:"已检数量",prop:"stockNumber",width:130}]:[{label:"库存数量",prop:"number",width:140}]),
  {prop:"operation",label:"操作",fixed:"right",width:100}
]);
const checkRows=ref<any[]>([]),checkVisible=ref(false),checking=ref(false);
let checkRequest=0;
watch(warehouseCode,()=>{checkRequest++;checkRows.value=[];checkVisible.value=false;checking.value=false;});
const requestTotal=(params:any)=>{
  void runCheck();
  return getStockTotal(warehouseCode.value,params);
};
const runCheck=async(manual=false)=>{
  if(checking.value)return;
  const current=++checkRequest, code=warehouseCode.value;
  checking.value=true;
  try {
    const result=await checkStock(code);
    if(current!==checkRequest)return;
    checkRows.value=result.data;
    checkVisible.value=checkRows.value.length>0 && (manual || checkVisible.value);
    if(manual && !checkRows.value.length)ElMessage.success("检查完成，未发现库存数据异常");
  } catch {
    // HTTP层显示请求失败；不阻塞库存列表，也不将旧结果当成检查通过。
  } finally { if(current===checkRequest)checking.value=false; }
};
const difference=(quantity:number,flow:number)=>{
  const value=Math.round((Number(quantity)-Number(flow))*10000)/10000;
  return `${value>0?"+":""}${value.toLocaleString("zh-CN",{maximumFractionDigits:4})}`;
};
const flowVisible=ref(false),flowItemId=ref<number>(),flowQuality=ref(""),flowTitle=ref("");
const showFlows=(row:any,quality="")=>{
  flowItemId.value=row.itemId;flowQuality.value=quality;
  flowTitle.value=`${row.materName||row.itemName} · ${quality ? qualityName(quality) : "库存"}有效流水`;
  flowVisible.value=true;
};
const dataCallback=(data:any)=>({list:data.records,total:data.total});
const detailVisible=ref(false),detail=ref<any>({});
const showDetail=(row:any)=>{detail.value=row;detailVisible.value=true};
const exportCurrent=()=>{const rows=proTableRef.value?.tableData||[];const header=dualMode.value?["物料编号","物料名称","未检数量","已检数量"]:["物料编号","物料名称","库存数量"];const body=rows.map((r:any)=>dualMode.value?[r.materNum,r.materName,r.readyNumber,r.stockNumber]:[props.itemType==="PRODUCT"?r.materNum:r.itemCode,props.itemType==="PRODUCT"?r.materName:r.itemName,r.number]);const csv="\ufeff"+[header,...body].map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`${currentWarehouse.value?.name||"仓库"}统计.csv`;a.click();URL.revokeObjectURL(a.href)};
onMounted(async()=>{if(props.itemType==="PRODUCT")await dictStore.loadDicts(["cust"]);warehouses.value=(await getWarehouses(props.itemType)).data;warehouseCode.value=props.fixedWarehouseCode||warehouses.value[0]?.code||""});
</script>

<style scoped lang="scss">
.stock-page{display:flex;flex-direction:column;height:100%;min-height:0}.warehouse-switcher{padding:12px 16px;background:var(--el-bg-color);border-bottom:1px solid var(--el-border-color-lighter)}.stock-page :deep(.pro-table-layout){flex:1;min-height:0}
.stock-page :deep(.table-header){display:flex;gap:12px}
.stock-page :deep(.header-button-lf){flex:1;min-width:0;float:none}
.stock-page :deep(.header-button-ri){flex-shrink:0;align-self:flex-start;float:none}
</style>
