<template>
  <div class="stock-page">
    <div v-if="showSwitcher" class="warehouse-switcher">
      <el-segmented v-model="warehouseCode" :options="warehouseOptions" @change="changeWarehouse" />
    </div>
    <ProTable v-if="warehouseCode" ref="proTableRef" :columns="columns" :request-api="requestFlow" :dataCallback="dataCallback"
      :pagination="true" :tool-button="['refresh', 'setting', 'search']" row-key="lineId" striped
      :search-col="{ xs: 2, sm: 2, md: 3, lg: 3, xl: 4 }" @row-click="selectRow">
      <template #tableHeader="scope">
        <el-button v-if="!readOnly" type="primary" :icon="CirclePlus" @click="openEditor()">新增仓库流水</el-button>
        <el-button v-if="!readOnly" type="primary" plain :icon="Upload" @click="openBatch">批量添加</el-button>
        <el-button type="primary" plain :icon="Download" @click="exportCurrent">导出当前页</el-button>
        <el-button v-if="!readOnly" type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="deleteSelected">
          批量删除流水
        </el-button>
        <el-button plain @click="proTableRef?.element?.toggleAllSelection()">当前页全选</el-button>
        <SelectionSummary :items="selectionSummary" :disabled="!scope.isSelected"
          @clear="proTableRef?.element?.clearSelection()" />
      </template>
      <template #flowTypeCode="{ row }">
        <el-tag :type="GodownTypeEnum.find(item => item.label === row.flowTypeName)?.tagType || 'primary'">{{ row.flowTypeName }}</el-tag>
      </template>
      <template #qualityStatus="{ row }">
        <el-tag :type="row.qualityStatus === 'READY' ? 'warning' : row.qualityStatus === 'QUALIFIED' ? 'success' : 'info'">{{ qualityName(row.qualityStatus) }}</el-tag>
      </template>
      <template #operation="scope">
        <el-button type="primary" link :icon="View" @click.stop="openEditor(scope.row, true)">查看</el-button>
        <template v-if="scope.row.editable">
          <el-button type="primary" link :icon="EditPen" @click.stop="openEditor(scope.row)">编辑</el-button>
        </template>
        <el-tag v-else type="info" effect="plain">业务自动流水</el-tag>
        <el-button type="danger" link :icon="Delete" @click.stop="remove(scope.row)">删除</el-button>
      </template>
    </ProTable>

    <FlowDrawer ref="flowDrawerRef" :warehouse-code="warehouseCode" :warehouse-name="currentWarehouse?.name"
      :item-type="props.itemType" :material-options="materialOptions" :flow-types="flowTypes"
      @saved="proTableRef?.getTableList()" />

    <el-dialog v-model="batchVisible" title="批量添加流水" width="860px">
      <el-form inline class="batch-form">
        <el-form-item label="日期"><el-date-picker v-model="batchDate" value-format="YYYY-MM-DD" style="width:160px" /></el-form-item>
        <el-form-item label="流水类型"><el-select v-model="batchFlowType" style="width:180px"><el-option v-for="item in flowTypes" :key="item.code" :value="item.code" :label="item.name" /></el-select></el-form-item>
        <el-form-item label="相关人" required><PersonSelect v-model="batchPerson" style="width:180px" /></el-form-item>
      </el-form>
      <el-table :data="batchRows" border>
        <el-table-column label="物料" min-width="230"><template #default="{row}"><el-select v-model="row.sourceItemId" filterable style="width:100%"><el-option v-for="item in materialOptions" :key="item.value" :value="item.value" :label="` ${item.label} (${item.num})`" /></el-select></template></el-table-column>
        <el-table-column label="数量" width="120"><template #default="{row}"><el-input-number style="width: 80px" v-model="row.quantity" :min="0.1" :controls="false" /></template></el-table-column>
        <el-table-column label="备注"><template #default="{row}"><el-input v-model="row.remark" /></template></el-table-column>
        <el-table-column width="70"><template #default="{$index}"><el-button link type="danger" @click="batchRows.splice($index,1)">删除</el-button></template></el-table-column>
      </el-table>
      <el-button class="add-row" plain @click="addBatchRow">添加一行</el-button>
      <template #footer><el-button @click="batchVisible=false">取消</el-button><el-button type="primary" :loading="batchSaving" @click="saveBatch">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { CirclePlus, Delete, Download, EditPen, Upload, View } from "@element-plus/icons-vue";
import ProTable from "@/components/ProTable/index.vue";
import SelectionSummary from "@/components/SelectionSummary/index.vue";
import FlowDrawer from "./components/FlowDrawer.vue";
import PersonSelect from "./components/PersonSelect.vue";
import { useDictStore } from "@/stores/modules/dict";
import { addStockFlowBatch, deleteStockFlow, deleteStockFlowBatch, getAssistOptions, getFlowTypes, getRawOptions, getStockFlow, getWarehouses, StockFlowType, StockWarehouse, qualityName } from "@/api/modules/stock";
import { getStockSourceName } from "@/enums/stockEnum";
import { GodownTypeEnum } from "@/enums/godownEnum";

const props = withDefaults(defineProps<{ itemType?: "PRODUCT"|"RAW"|"ASSIST"; fixedWarehouseCode?: string; showSwitcher?: boolean; fixedItemId?: number; fixedQualityStatus?: string; readOnly?: boolean }>(), { itemType: "PRODUCT", fixedWarehouseCode: "", showSwitcher: true });
const dictStore = useDictStore();
const proTableRef = ref<any>();
const flowDrawerRef = ref<InstanceType<typeof FlowDrawer>>();
const warehouses = ref<StockWarehouse[]>([]);
const warehouseCode = ref("");
const flowTypes = ref<StockFlowType[]>([]);
const materialOptions = ref<any[]>([]);
const currentWarehouse = computed(() => warehouses.value.find(item => item.code === warehouseCode.value));
const warehouseOptions = computed(() => warehouses.value.map(item => ({ label: item.name, value: item.code })));
const selectedList = computed(() => proTableRef.value?.selectedList || []);
const selectionSummary = computed(() => [
  { label: "选中条数", value: selectedList.value.length },
  { label: "数量合计", value: selectedList.value.reduce((total: number, row: any) => total + Number(row.quantity || 0), 0) }
]);
const requestFlow = (params:any) => getStockFlow({ ...params, warehouseCode: warehouseCode.value,
  ...(props.fixedItemId ? { itemId: props.fixedItemId } : {}),
  ...(props.fixedQualityStatus ? { qualityStatus: props.fixedQualityStatus } : {}) });
const dataCallback = (data:any) => {
  proTableRef.value?.element?.clearSelection();
  return { list: data.records, total: data.total };
};
const selectRow = (row:any) => proTableRef.value?.element?.toggleRowSelection(row);
const formatDate = (value:string) => value ? dayjs(value).format("YYYY-MM-DD") : "";
const columns:any[] = reactive([
  { type:"selection", label:"选择", prop:"lineId", align:"center" },
  { type:"index", label:"序号", width:60, align:"center", index:(i:number)=>(proTableRef.value?.pageable.pageNum-1)*proTableRef.value?.pageable.pageSize+i+1 },
  { label:"日期", prop:"bizDate", width:120, render:({row}:any)=>formatDate(row.bizDate), search:{el:"date-picker", props:{type:"daterange", valueFormat:"YYYY-MM-DD", startPlaceholder:"开始日期", endPlaceholder:"结束日期"}} },
  { label:"物料编号", prop:"itemCode", minWidth:140, search:{el:"input", key:"keyword", props:{placeholder:"编号或名称"}} },
  { label:"物料名称", prop:"itemName", minWidth:180 },
  { label:"流水类型", prop:"flowTypeCode", minWidth:140, search:{el:"select"}, enum:flowTypes, fieldNames:{label:"name",value:"code"} },
  { label:"库存类别", prop:"qualityStatus", width:110,
    ...(!props.fixedQualityStatus ? { search:{el:"select"}, enum:[{label:"未检",value:"READY"},{label:"已检",value:"QUALIFIED"},{label:"普通库存",value:"NORMAL"}] } : {}) },
  { label:"方向", prop:"direction", width:80, render:({row}:any)=>row.direction === "IN" ? "入库" : "出库" },
  { label:"数量", prop:"quantity", width:110 },
  { label:"来源", prop:"sourceType", minWidth:140, render:({row}:any)=>getStockSourceName(row.sourceType) },
  { label:"备注", prop:"remark", minWidth:180 },
  { label:"相关人", prop:"relatedPerson", minWidth:110 },
  { prop:"operation", label:"操作", fixed:"right", width:230 }
].filter(column => !props.readOnly || column.prop !== "operation"));

const openEditor=(row:any={},view=false)=>flowDrawerRef.value?.acceptParams(row,view);
const remove=async(row:any)=>{await ElMessageBox.confirm("删除后将撤销该流水的库存影响，是否继续？","删除确认",{type:"warning"});await deleteStockFlow(row.docId);ElMessage.success("删除成功");proTableRef.value?.getTableList()};
const deleteSelected=async()=>{const docIds=[...new Set<number>(selectedList.value.map((item:any)=>item.docId))];if(!docIds.length)return;await ElMessageBox.confirm(`将删除 ${docIds.length} 条流水并撤销库存影响，是否继续？`,"批量删除",{type:"warning"});await deleteStockFlowBatch(docIds);ElMessage.success("批量删除完成");proTableRef.value?.getTableList()};
const batchVisible=ref(false),batchDate=ref(dayjs().format("YYYY-MM-DD")),batchFlowType=ref(""),batchRows=ref<any[]>([]);
const batchPerson=ref("");
const addBatchRow=()=>batchRows.value.push({sourceItemId:undefined,quantity:1,remark:""});
const openBatch=()=>{batchRows.value=[];batchPerson.value="";addBatchRow();batchVisible.value=true};
const batchSaving=ref(false);
const saveBatch=async()=>{
  if(batchSaving.value)return;
  if(!batchFlowType.value||!batchPerson.value||!batchRows.value.length||batchRows.value.some(r=>!r.sourceItemId||!r.quantity))return ElMessage.warning("请完整填写流水类型、物料、数量和相关人");
  batchSaving.value=true;
  try {
    await addStockFlowBatch(batchRows.value.map(row=>({warehouseCode:warehouseCode.value,itemType:props.itemType,flowTypeCode:batchFlowType.value,bizDate:batchDate.value,...row,relatedPerson:batchPerson.value})));
    ElMessage.success("批量添加成功");batchVisible.value=false;proTableRef.value?.getTableList();
  } finally { batchSaving.value=false; }
};
const exportCurrent=()=>{const rows=proTableRef.value?.tableData||[];const values=[["日期","物料编号","物料名称","流水类型","库存类别","方向","数量","来源","备注","相关人"],...rows.map((r:any)=>[r.bizDate,r.itemCode,r.itemName,r.flowTypeName,qualityName(r.qualityStatus),r.direction==="IN"?"入库":"出库",r.quantity,getStockSourceName(r.sourceType),r.remark,r.relatedPerson])];const csv="\ufeff"+values.map((r:any[])=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`${currentWarehouse.value?.name||"仓库"}流水.csv`;a.click();URL.revokeObjectURL(a.href)};
const loadMaterials=async()=>{if(props.itemType==="PRODUCT"){await dictStore.loadDicts(["mater"]);materialOptions.value=dictStore.dictMap.mater||[]}else{const res=props.itemType==="RAW"?await getRawOptions():await getAssistOptions();materialOptions.value=(res.data.records||[]).map((item:any)=>({value:item.id,num:item.rawNum||item.code||item.num,label:item.rawName||item.name||item.label}))}};
const loadWarehouse=async()=>{warehouses.value=(await getWarehouses(props.itemType)).data;warehouseCode.value=props.fixedWarehouseCode||warehouses.value[0]?.code||"";if(warehouseCode.value)flowTypes.value=(await getFlowTypes(warehouseCode.value)).data};
const changeWarehouse=async()=>{flowTypes.value=(await getFlowTypes(warehouseCode.value)).data;proTableRef.value?.reset()};
onMounted(async()=>{await Promise.all([loadMaterials(),loadWarehouse()])});
</script>

<style scoped lang="scss">
.batch-form{display:flex;flex-wrap:wrap;column-gap:16px}.batch-form :deep(.el-form-item){margin-right:0}
.stock-page{display:flex;flex-direction:column;height:100%;min-height:0}.warehouse-switcher{padding:12px 16px;background:var(--el-bg-color);border-bottom:1px solid var(--el-border-color-lighter)}.stock-page :deep(.pro-table-layout){flex:1;min-height:0}.add-row{margin-top:12px}
.stock-page :deep(.table-header){display:flex;gap:12px}
.stock-page :deep(.header-button-lf){flex:1;min-width:0;float:none}
.stock-page :deep(.header-button-ri){flex-shrink:0;align-self:flex-start;float:none}
</style>
