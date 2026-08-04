<template>
  <div class="stock-page">
    <div v-if="showSwitcher" class="warehouse-switcher">
      <el-segmented v-model="warehouseCode" :options="warehouseOptions" @change="proTableRef?.reset()" />
    </div>
    <ProTable v-if="warehouseCode" ref="proTableRef" :columns="columns" :request-api="requestTotal" :dataCallback="dataCallback"
      :pagination="true" :tool-button="['refresh','setting','search']" row-key="itemId" striped
      :search-col="{xs:2,sm:2,md:3,lg:3,xl:4}">
      <template #tableHeader>
        <el-button type="primary" :icon="Download" @click="exportCurrent">导出当前页库存</el-button>
      </template>
      <template #operation="scope"><el-button type="primary" link :icon="View" @click="showDetail(scope.row)">详情</el-button></template>
    </ProTable>
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
import { computed, onMounted, ref } from "vue";
import { Download, View } from "@element-plus/icons-vue";
import ProTable from "@/components/ProTable/index.vue";
import { getStockTotal, getWarehouses, StockWarehouse } from "@/api/modules/stock";
import { useDictStore } from "@/stores/modules/dict";

const props=withDefaults(defineProps<{itemType?:"PRODUCT"|"RAW"|"ASSIST";fixedWarehouseCode?:string;showSwitcher?:boolean}>(),{itemType:"PRODUCT",fixedWarehouseCode:"",showSwitcher:true});
const dictStore=useDictStore();
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
const requestTotal=(params:any)=>getStockTotal(warehouseCode.value,params);
const dataCallback=(data:any)=>({list:data.records,total:data.total});
const detailVisible=ref(false),detail=ref<any>({});
const showDetail=(row:any)=>{detail.value=row;detailVisible.value=true};
const exportCurrent=()=>{const rows=proTableRef.value?.tableData||[];const header=dualMode.value?["物料编号","物料名称","未检数量","已检数量"]:["物料编号","物料名称","库存数量"];const body=rows.map((r:any)=>dualMode.value?[r.materNum,r.materName,r.readyNumber,r.stockNumber]:[props.itemType==="PRODUCT"?r.materNum:r.itemCode,props.itemType==="PRODUCT"?r.materName:r.itemName,r.number]);const csv="\ufeff"+[header,...body].map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`${currentWarehouse.value?.name||"仓库"}统计.csv`;a.click();URL.revokeObjectURL(a.href)};
onMounted(async()=>{if(props.itemType==="PRODUCT")await dictStore.loadDicts(["cust"]);warehouses.value=(await getWarehouses(props.itemType)).data;warehouseCode.value=props.fixedWarehouseCode||warehouses.value[0]?.code||""});
</script>

<style scoped lang="scss">
.stock-page{display:flex;flex-direction:column;height:100%;min-height:0}.warehouse-switcher{padding:12px 16px;background:var(--el-bg-color);border-bottom:1px solid var(--el-border-color-lighter)}.stock-page :deep(.ProTable){flex:1;min-height:0}
</style>
