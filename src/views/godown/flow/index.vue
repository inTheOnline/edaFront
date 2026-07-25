<template>
  <div class="stock-page">
    <div v-if="showSwitcher" class="warehouse-switcher">
      <el-segmented v-model="warehouseCode" :options="warehouseOptions" @change="changeWarehouse" />
    </div>
    <ProTable v-if="warehouseCode" ref="proTableRef" :columns="columns" :request-api="requestFlow" :dataCallback="dataCallback"
      :pagination="true" :tool-button="['refresh', 'setting', 'search']" row-key="lineId" striped
      :search-col="{ xs: 2, sm: 2, md: 3, lg: 3, xl: 4 }" @row-click="selectRow">
      <template #tableHeader="scope">
        <el-button type="primary" :icon="CirclePlus" @click="openEditor()">新增仓库流水</el-button>
        <el-button type="primary" plain :icon="Upload" @click="openBatch">批量添加</el-button>
        <el-button type="primary" plain :icon="Download" @click="exportCurrent">导出当前页</el-button>
        <el-button type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="deleteSelected">
          批量删除手工流水
        </el-button>
        <StatisticsBar :list="selectedList" :config="[{ label: '总数量', field: 'quantity', type: 'sum' }]">
          <template #extra><el-button type="primary" plain @click="proTableRef?.element?.toggleAllSelection()">当前页全选</el-button></template>
        </StatisticsBar>
      </template>
      <template #operation="scope">
        <el-button type="primary" link :icon="View" @click.stop="openEditor(scope.row, true)">查看</el-button>
        <template v-if="scope.row.editable">
          <el-button type="primary" link :icon="EditPen" @click.stop="openEditor(scope.row)">编辑</el-button>
          <el-button type="danger" link :icon="Delete" @click.stop="remove(scope.row)">删除</el-button>
        </template>
        <el-tag v-else type="info" effect="plain">业务自动流水</el-tag>
      </template>
    </ProTable>

    <el-drawer v-model="editorVisible" :title="editorTitle" size="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" :disabled="viewOnly">
        <el-form-item label="仓库"><el-input :model-value="currentWarehouse?.name" disabled /></el-form-item>
        <el-form-item label="日期" prop="bizDate"><el-date-picker v-model="form.bizDate" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="物料" prop="sourceItemId">
          <el-select v-model="form.sourceItemId" filterable style="width:100%">
            <el-option v-for="item in materialOptions" :key="item.value" :value="item.value" :label="`${item.num} ${item.label}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="流水类型" prop="flowTypeCode">
          <el-select v-model="form.flowTypeCode" style="width:100%">
            <el-option v-for="item in flowTypes" :key="item.code" :value="item.code" :label="item.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity"><el-input-number v-model="form.quantity" :min="0.0001" :precision="4" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
        <el-form-item v-if="viewOnly && form.sourceType" label="来源"><el-tag effect="plain">{{ form.sourceType }}</el-tag></el-form-item>
      </el-form>
      <template #footer><el-button @click="editorVisible=false">取消</el-button><el-button v-if="!viewOnly" type="primary" @click="save">保存</el-button></template>
    </el-drawer>

    <el-dialog v-model="batchVisible" title="批量添加流水" width="860px">
      <el-form inline><el-form-item label="日期"><el-date-picker v-model="batchDate" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="流水类型"><el-select v-model="batchFlowType" style="width:200px"><el-option v-for="item in flowTypes" :key="item.code" :value="item.code" :label="item.name" /></el-select></el-form-item></el-form>
      <el-table :data="batchRows" border>
        <el-table-column label="物料" min-width="260"><template #default="{row}"><el-select v-model="row.sourceItemId" filterable style="width:100%"><el-option v-for="item in materialOptions" :key="item.value" :value="item.value" :label="`${item.num} ${item.label}`" /></el-select></template></el-table-column>
        <el-table-column label="数量" width="170"><template #default="{row}"><el-input-number v-model="row.quantity" :min="0.0001" /></template></el-table-column>
        <el-table-column label="备注"><template #default="{row}"><el-input v-model="row.remark" /></template></el-table-column>
        <el-table-column width="70"><template #default="{$index}"><el-button link type="danger" @click="batchRows.splice($index,1)">删除</el-button></template></el-table-column>
      </el-table>
      <el-button class="add-row" plain @click="addBatchRow">添加一行</el-button>
      <template #footer><el-button @click="batchVisible=false">取消</el-button><el-button type="primary" @click="saveBatch">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox, FormInstance } from "element-plus";
import { CirclePlus, Delete, Download, EditPen, Upload, View } from "@element-plus/icons-vue";
import ProTable from "@/components/ProTable/index.vue";
import StatisticsBar from "@/components/My/StatisticsBar/index.vue";
import { useDictStore } from "@/stores/modules/dict";
import { addStockFlow, addStockFlowBatch, deleteStockFlow, editStockFlow, getAssistOptions, getFlowTypes, getRawOptions, getStockFlow, getWarehouses, StockFlowType, StockWarehouse } from "@/api/modules/stock";

const props = withDefaults(defineProps<{ itemType?: "PRODUCT"|"RAW"|"ASSIST"; fixedWarehouseCode?: string; showSwitcher?: boolean }>(), { itemType: "PRODUCT", fixedWarehouseCode: "", showSwitcher: true });
const dictStore = useDictStore();
const proTableRef = ref<any>();
const warehouses = ref<StockWarehouse[]>([]);
const warehouseCode = ref("");
const flowTypes = ref<StockFlowType[]>([]);
const materialOptions = ref<any[]>([]);
const currentWarehouse = computed(() => warehouses.value.find(item => item.code === warehouseCode.value));
const warehouseOptions = computed(() => warehouses.value.map(item => ({ label: item.name, value: item.code })));
const selectedList = computed(() => proTableRef.value?.selectedList || []);
const requestFlow = (params:any) => getStockFlow({ ...params, warehouseCode: warehouseCode.value });
const dataCallback = (data:any) => ({ list: data.records, total: data.total });
const selectRow = (row:any) => proTableRef.value?.element?.toggleRowSelection(row);
const formatDate = (value:string) => value ? dayjs(value).format("YYYY-MM-DD") : "";
const columns:any[] = reactive([
  { type:"selection", label:"选择", prop:"lineId", align:"center" },
  { type:"index", label:"序号", width:60, align:"center", index:(i:number)=>(proTableRef.value?.pageable.pageNum-1)*proTableRef.value?.pageable.pageSize+i+1 },
  { label:"日期", prop:"bizDate", width:120, render:({row}:any)=>formatDate(row.bizDate), search:{el:"date-picker", props:{type:"daterange", valueFormat:"YYYY-MM-DD", startPlaceholder:"开始日期", endPlaceholder:"结束日期"}} },
  { label:"物料编号", prop:"itemCode", minWidth:140, search:{el:"input", key:"keyword", props:{placeholder:"编号或名称"}} },
  { label:"物料名称", prop:"itemName", minWidth:180 },
  { label:"流水类型", prop:"flowTypeCode", minWidth:140, isFilterEnum:false, search:{el:"select"}, enum:flowTypes, fieldNames:{label:"name",value:"code"} },
  { label:"方向", prop:"direction", width:80, render:({row}:any)=>row.direction === "IN" ? "入库" : "出库" },
  { label:"数量", prop:"quantity", width:110 },
  { label:"来源", prop:"sourceType", minWidth:140 },
  { label:"备注", prop:"remark", minWidth:180 },
  { prop:"operation", label:"操作", fixed:"right", width:230 }
]);

const editorVisible=ref(false), viewOnly=ref(false), formRef=ref<FormInstance>();
const form=reactive<any>({});
const editorTitle=computed(()=>viewOnly.value?"查看仓库流水":form.docId?"编辑仓库流水":"新增仓库流水");
const rules={bizDate:[{required:true,message:"请选择日期"}],sourceItemId:[{required:true,message:"请选择物料"}],flowTypeCode:[{required:true,message:"请选择流水类型"}],quantity:[{required:true,message:"请输入数量"}]};
const resetForm=(row:any={})=>Object.assign(form,{docId:row.docId,sourceType:row.sourceType,bizDate:row.bizDate||dayjs().format("YYYY-MM-DD"),sourceItemId:row.sourceItemId,flowTypeCode:row.flowTypeCode,quantity:row.quantity||1,remark:row.remark||""});
const openEditor=(row:any={},view=false)=>{resetForm(row);viewOnly.value=view;editorVisible.value=true};
const payload=()=>({warehouseCode:warehouseCode.value,itemType:props.itemType,sourceItemId:Number(form.sourceItemId),flowTypeCode:form.flowTypeCode,quantity:Number(form.quantity),bizDate:form.bizDate,remark:form.remark});
const save=async()=>{await formRef.value?.validate();form.docId?await editStockFlow(form.docId,payload()):await addStockFlow(payload());ElMessage.success("保存成功");editorVisible.value=false;proTableRef.value?.getTableList()};
const remove=async(row:any)=>{await ElMessageBox.confirm("删除后将通过红冲保留审计记录，是否继续？","删除确认",{type:"warning"});await deleteStockFlow(row.docId);ElMessage.success("已红冲删除");proTableRef.value?.getTableList()};
const deleteSelected=async()=>{const rows=selectedList.value.filter((item:any)=>item.editable);if(!rows.length)return ElMessage.warning("选中项中没有可删除的手工流水");await ElMessageBox.confirm(`将红冲 ${rows.length} 条手工流水，是否继续？`,"批量删除",{type:"warning"});for(const row of rows)await deleteStockFlow(row.docId);ElMessage.success("批量删除完成");proTableRef.value?.getTableList()};
const batchVisible=ref(false),batchDate=ref(dayjs().format("YYYY-MM-DD")),batchFlowType=ref(""),batchRows=ref<any[]>([]);
const addBatchRow=()=>batchRows.value.push({sourceItemId:undefined,quantity:1,remark:""});
const openBatch=()=>{batchRows.value=[];addBatchRow();batchVisible.value=true};
const saveBatch=async()=>{if(!batchFlowType.value||batchRows.value.some(r=>!r.sourceItemId||!r.quantity))return ElMessage.warning("请完整填写流水类型、物料和数量");await addStockFlowBatch(batchRows.value.map(row=>({warehouseCode:warehouseCode.value,itemType:props.itemType,flowTypeCode:batchFlowType.value,bizDate:batchDate.value,...row})));ElMessage.success("批量添加成功");batchVisible.value=false;proTableRef.value?.getTableList()};
const exportCurrent=()=>{const rows=proTableRef.value?.tableData||[];const values=[["日期","物料编号","物料名称","流水类型","方向","数量","来源","备注"],...rows.map((r:any)=>[r.bizDate,r.itemCode,r.itemName,r.flowTypeName,r.direction==="IN"?"入库":"出库",r.quantity,r.sourceType,r.remark])];const csv="\ufeff"+values.map((r:any[])=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`${currentWarehouse.value?.name||"仓库"}流水.csv`;a.click();URL.revokeObjectURL(a.href)};
const loadMaterials=async()=>{if(props.itemType==="PRODUCT"){await dictStore.loadDicts(["mater"]);materialOptions.value=dictStore.dictMap.mater||[]}else{const res=props.itemType==="RAW"?await getRawOptions():await getAssistOptions();materialOptions.value=(res.data.records||[]).map((item:any)=>({value:item.id,num:item.rawNum||item.code||item.num,label:item.rawName||item.name||item.label}))}};
const loadWarehouse=async()=>{warehouses.value=(await getWarehouses(props.itemType)).data;warehouseCode.value=props.fixedWarehouseCode||warehouses.value[0]?.code||"";if(warehouseCode.value)flowTypes.value=(await getFlowTypes(warehouseCode.value)).data};
const changeWarehouse=async()=>{flowTypes.value=(await getFlowTypes(warehouseCode.value)).data;proTableRef.value?.reset()};
onMounted(async()=>{await Promise.all([loadMaterials(),loadWarehouse()])});
</script>

<style scoped lang="scss">
.stock-page{display:flex;flex-direction:column;height:100%;min-height:0}.warehouse-switcher{padding:12px 16px;background:var(--el-bg-color);border-bottom:1px solid var(--el-border-color-lighter)}.stock-page :deep(.ProTable){flex:1;min-height:0}.add-row{margin-top:12px}
</style>
