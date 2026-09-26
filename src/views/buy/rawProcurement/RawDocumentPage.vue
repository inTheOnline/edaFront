<template>
  <div class="raw-doc-page">
    <div class="view-switch"><el-segmented v-model="viewMode" :options="viewOptions" /></div>
    <ProTable :key="`${viewMode}-${canViewPrice}`" ref="tableRef" row-key="id" :title="title" :columns="columns" :request-api="requestApi" :dataCallback="dataCallback" :pagination="true" :tool-button="['refresh','setting','search']" @row-click="handleRowClick">
      <template #tableHeader="scope">
        <el-button type="primary" :icon="CirclePlus" @click="openEditor()">新增{{ title }}</el-button>
        <el-button type="primary" plain :icon="Download" @click="exportExcel">导出 Excel</el-button>
        <el-button type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="removeSelected(scope.selectedList || [])">批量删除</el-button>
        <SelectionSummary v-if="kind!=='requisition'&&viewMode==='item'" :items="selectionSummary" :disabled="!scope.isSelected" @clear="cancelSelect" />
        <el-button v-else plain :icon="CircleClose" :disabled="!scope.isSelected" @click="cancelSelect">取消选择</el-button>
      </template>
      <template #operation="{row}">
        <el-button type="primary" link :icon="View" @click="openView(row)">查看</el-button>
        <el-button v-if="kind==='requisition'||kind==='purchase'" type="primary" link :icon="Download" @click="exportCurrent(row)">导出</el-button>
        <el-button v-if="kind==='purchase'&&viewMode==='item'&&purchaseItemStatus(row)!=='已完成'" type="success" link :loading="closingIds.has(row.id)" @click.stop="closeItem(row)">结案</el-button>
        <el-button type="primary" link :icon="EditPen" @click="openEditorFromRow(row)">编辑</el-button>
        <el-button type="danger" link :icon="Delete" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <el-dialog v-model="detailVisible" :title="`${title}明细`" width="90%">
      <el-descriptions v-if="current" :column="3" border class="doc-summary">
        <el-descriptions-item label="单号">{{ numberOf(current) }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ dateOf(current) }}</el-descriptions-item>
        <el-descriptions-item label="状态"><PurchaseStatusTag :status="current.status" /></el-descriptions-item>
      </el-descriptions>
      <el-table :data="current?.items || []" border stripe><el-table-column v-for="c in itemDisplayColumns" :key="c.prop" :prop="c.prop" :label="c.label" :min-width="c.width || 120" :formatter="c.detailFormatter"><template v-if="c.prop==='status'" #default="{row}"><PurchaseStatusTag :status="row.status" /></template></el-table-column></el-table>
    </el-dialog>

    <el-dialog v-model="relatedVisible" :title="kind==='requisition'?'请购明细采购记录':'采购明细回执记录'" width="90%" destroy-on-close>
      <el-descriptions v-if="relatedSource" :column="3" border class="doc-summary">
        <el-descriptions-item :label="kind==='requisition'?'请购单号':'采购单号'">{{ numberOf(relatedSource) }}</el-descriptions-item>
        <el-descriptions-item label="物料编号">{{ relatedSource.materNum }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ relatedSource.rawSpecs }}</el-descriptions-item>
      </el-descriptions>
      <ProTable v-if="relatedVisible && relatedSource" v-loading="relatedLoading" :key="`${relatedSource.id}-${canViewPrice}`" :title="kind==='requisition'?'采购记录':'回执记录'" row-key="id" :columns="relatedColumns" :request-api="requestRelated" :data-callback="dataCallback" :tool-button="['refresh']" ><template #empty>{{ kind==='requisition'?'该请购明细暂无采购记录':'该采购明细暂无回执记录' }}</template></ProTable>
    </el-dialog>

    <el-dialog v-model="editorVisible" :title="`${editing.id?'编辑':'新增'}${title}`" width="94%" top="3vh" :close-on-click-modal="false">
      <el-form label-width="90px" class="header-form" :class="{'receipt-header':kind==='receipt'}">
        <el-form-item v-if="kind==='receipt'" label="回执单号" required><el-input v-model="form.receiptNum" placeholder="请输入回执单号" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="form[dateField]" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item v-if="kind==='purchase'" label="供应商"><el-select v-model="form.supId" filterable @change="syncSupplier"><el-option v-for="o in supplierOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item>
        <el-form-item v-if="kind==='receipt'" label="采购单"><el-select v-model="form.purchaseTableIds" multiple collapse-tags filterable @change="loadPurchases"><el-option v-for="o in purchaseOptions" :key="o.id" :label="o.purchaseNum" :value="o.id" /></el-select></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
      </el-form>
      <div class="item-toolbar">
        <el-button v-if="kind!=='receipt'" type="primary" plain @click="addRow">添加明细</el-button>
        <el-button v-if="kind==='requisition'" type="primary" plain @click="openOrderSelector()">选择订单条目</el-button>
      </div>
      <el-table :data="form.items" border stripe max-height="430">
        <el-table-column v-if="kind==='requisition'" label="产品/原材料" min-width="280"><template #default="{row}"><el-select v-model="row.optionId" filterable @change="(v:any)=>selectRaw(row,v)"><el-option v-for="o in rawOptions" :key="`${o.relationId}-${o.useType}`" :label="`${o.materNum||''} / ${o.rawSpecs||''}`" :value="`${o.relationId}-${o.useType}`" /></el-select></template></el-table-column>
        <el-table-column v-if="kind==='purchase'" label="请购明细" min-width="300"><template #default="{row}"><el-select v-model="row.requisitionItemId" filterable @change="(v:any)=>selectReq(row,v)"><el-option v-for="o in requisitionOptions" :key="o.id" :label="requisitionOptionLabel(o)" :value="o.id" /></el-select></template></el-table-column>
        <el-table-column v-if="kind==='receipt'" prop="materNum" label="物料编码" min-width="150" />
        <el-table-column v-if="kind==='requisition'" label="订单号" min-width="230"><template #default="{row}"><div class="order-links"><el-tag v-for="order in row.orders||[]" :key="order.orderItemId" closable @close="removeOrder(row,order.orderItemId)">{{ order.orderNum }}</el-tag><span v-if="!row.orders?.length">{{ row.custOrderNum }}</span><el-button type="primary" link @click="openOrderSelector(row)">关联订单</el-button></div></template></el-table-column>
        <el-table-column v-else-if="kind==='purchase'" prop="custOrderNum" label="订单号" min-width="150" />
        <el-table-column v-if="kind==='receipt'" prop="purchaseNum" label="采购单号" min-width="160" /><el-table-column v-else prop="rawNum" label="原材料编号" min-width="150" /><el-table-column prop="rawSpecs" label="规格" min-width="190" />
        <el-table-column v-if="kind==='requisition'" prop="orderNumber" label="订单数量" min-width="110" />
        <el-table-column label="生产数" min-width="120"><template #default="{row}"><el-input-number v-model="row.productionNumber" :min="0" :precision="0" :controls="false" :disabled="kind==='receipt'" style="width:100%" @change="syncFromProduction(row)" /></template></el-table-column>
        <el-table-column label="材料数" min-width="150"><template #default="{row}"><div class="number-with-unit"><el-input-number v-model="row[quantityField]" :min="1" :precision="0" :controls="false" @change="syncFromMaterial(row)" /><span>{{ materialUnit(row) }}</span></div></template></el-table-column>
        <el-table-column :label="weightLabel" min-width="130"><template #default="{row}"><el-input-number v-model="row[weightField]" :min="0" :precision="kind==='purchase'?2:4" :controls="false" style="width:100%" @change="syncFromWeight(row)" /></template></el-table-column>
        <el-table-column v-if="kind==='purchase'" label="单价" min-width="130"><template #default="{row}"><el-input-number v-model="row.unitPrice" :min="0" :precision="2" :controls="false" style="width:100%" /></template></el-table-column>
        <el-table-column v-if="kind==='receipt'&&canViewPrice" label="单价" min-width="120"><template #default="{row}">{{ row.unitPrice==null?'':Number(row.unitPrice).toFixed(2) }}</template></el-table-column>
        <el-table-column label="备注" min-width="150"><template #default="{row}"><el-input v-model="row.remark" /></template></el-table-column>
        <el-table-column label="操作" width="80"><template #default="{$index}"><el-button type="danger" link @click="form.items.splice($index,1)">移除</el-button></template></el-table-column>
      </el-table>
      <template #footer><el-button @click="editorVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template>
    </el-dialog>
    <ReceiptMergeDialog ref="mergeDialogRef" />
    <CustOrderItemSelector ref="orderSelectorRef" @confirm="selectOrderItems" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onActivated, onMounted, reactive, ref } from "vue";
import { ElButton, ElMessage, ElMessageBox } from "element-plus";
import { CircleClose, CirclePlus, Delete, Download, EditPen, View } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import ReceiptMergeDialog from "./ReceiptMergeDialog.vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { useAuthStore } from "@/stores/modules/auth";
import CustOrderItemSelector from "../rawPurchase/components/CustOrderItemSelector.vue";
import PurchaseStatusTag from "../components/PurchaseStatusTag.vue";
import SelectionSummary from "@/components/SelectionSummary/index.vue";
import { closePurchaseItem, checkReceiptMerge, type ReceiptMergeCheck, deleteDocument, getDocument, getRawOptions, getSupplierOptions, itemPage, saveDocument, tablePage, unwrap, type DocKind, type RawItem, type RawTable, type RawOrderSource } from "./service";

const mergeDialogRef=ref<InstanceType<typeof ReceiptMergeDialog>>();
const props=defineProps<{kind:DocKind;title:string}>(); const kind=props.kind;
const authStore=useAuthStore();
const canViewPrice=computed(()=>authStore.isExistence("price:view"));
const tableRef=ref<any>(); const viewMode=ref<"table"|"item">("item");
const viewOptions=[{label:"主表",value:"table"},{label:"明细",value:"item"}]; const detailVisible=ref(false);const editorVisible=ref(false);const saving=ref(false);
const current=ref<RawTable>();const editing=reactive<RawTable>({});const form=reactive<any>({items:[]});const rawOptions=ref<any[]>([]);const supplierOptions=ref<any[]>([]);const requisitionOptions=ref<any[]>([]);const purchaseOptions=ref<any[]>([]);const orderSelectorRef=ref<InstanceType<typeof CustOrderItemSelector>|null>(null);
const selectedList=computed<any[]>(()=>tableRef.value?.selectedList||[]);
const sumSelected=(field:string)=>selectedList.value.reduce((total,row)=>total+Number(row[field]||0),0);
const selectionSummary=computed(()=>kind==="receipt"
  ? [{label:"回执重量",value:sumSelected("receiptWeight")}]
  : [
    {label:"采购重量",value:sumSelected("purchaseWeight")},
    {label:"已回执重量",value:sumSelected("incomingWeight")},
    {label:"待回重量",value:sumSelected("notbackWeight")}
  ]);
const dateField=computed(()=>kind==="requisition"?"requisitionDate":kind==="purchase"?"purchaseDate":"receiptDate");
const quantityField=computed(()=>kind==="requisition"?"requisitionNumber":kind==="purchase"?"purchaseNumber":"receiptNumber");const weightField=computed(()=>kind==="requisition"?"requisitionWeight":kind==="purchase"?"purchaseWeight":"receiptWeight");
const weightLabel=computed(()=>kind==="requisition"?"请购重量":kind==="purchase"?"采购重量":"回执重量（kg）");
const numberColumn=(prop:string,label:string):ColumnProps=>({prop,label,minWidth:160,search:{el:"input"},render:({row}:any)=>h(ElButton,{type:"primary",link:true,onClick:()=>openDetail(row)},()=>row[prop])});
const statusOptions=["待处理","部分采购","已采购","部分回执","已完成"].map(value=>({label:value,value}));
const statusColumn:ColumnProps={prop:"status",label:"状态",width:110,enum:statusOptions,search:{el:"select",props:{multiple:true}},render:({row}:any)=>h(PurchaseStatusTag,{status:row.status})};
const purchaseItemStatus=(row:any)=>Number(row.closed)===1?"已完成":row.useType==="roll"?Number(row.incomingWeight)>=Number(row.purchaseWeight)?"已完成":Number(row.incomingWeight)>0?"部分回执":"已采购":Number(row.notbackNumber)<=0?"已完成":Number(row.incomingNumber)>0?"部分回执":"已采购";
const purchaseItemStatusColumn:ColumnProps & {detailFormatter:(row:any)=>string}={prop:"status",label:"状态",width:110,enum:statusOptions.filter(o=>["已采购","部分回执","已完成"].includes(o.value)),render:({row}:any)=>h(PurchaseStatusTag,{status:purchaseItemStatus(row)}),detailFormatter:(row:any)=>purchaseItemStatus(row)};
const applyUserColumn:ColumnProps={prop:"applyUserName",label:"请购人",width:110};
const textSearch:ColumnProps["search"]={el:"input"};
const tableColumns:Record<DocKind,ColumnProps[]>={requisition:[numberColumn("requisitionNum","请购单号"),{prop:"requisitionDate",label:"请购日期",width:120,search:{el:"date-picker",props:{type:"daterange",valueFormat:"YYYY-MM-DD"}}},statusColumn,applyUserColumn,{prop:"remark",label:"备注",minWidth:160,search:textSearch}],purchase:[{prop:"purchaseDate",label:"采购日期",width:120,search:{el:"date-picker",props:{type:"daterange",valueFormat:"YYYY-MM-DD"}}},numberColumn("purchaseNum","采购单号"),{prop:"supName",label:"供应商",minWidth:150,search:textSearch},{prop:"totalAmount",label:"总金额",width:120},statusColumn],receipt:[{prop:"receiptDate",label:"回执日期",width:120,search:{el:"date-picker",props:{type:"daterange",valueFormat:"YYYY-MM-DD"}}},numberColumn("receiptNum","回执单号"),{prop:"supName",label:"供应商",minWidth:150,search:textSearch},{prop:"purchaseNum",label:"采购单号",minWidth:160,search:textSearch},statusColumn]};
const purchasedQuantity=(row:RawItem)=>row.useType==="sheet"?`${row.purchasedNumber??0} 张`:`${row.purchasedWeight??0} kg`;
const displayColumns=(displayKind:DocKind):any[]=>{
  const quantity=`${displayKind}Number`;
  return [
  ...(displayKind==="receipt"?[{prop:"receiptDate",label:"回执日期",width:120}]:displayKind==="purchase"?[{prop:"purchaseDate",label:"采购日期",width:120}]:[]),
  {prop:`${displayKind}Num`,label:displayKind==="requisition"?"请购单号":displayKind==="purchase"?"采购单号":"回执单号",minWidth:160,search:{el:"input"}},
  ...(displayKind==="receipt"?[{prop:"supName",label:"供应商",minWidth:150},{prop:"purchaseNum",label:"采购单号",minWidth:160}]:[]),
  ...(displayKind==="purchase"?[{prop:"supName",label:"供应商",minWidth:150}]:[]),
  ...(displayKind==="requisition"||displayKind==="purchase"?[{prop:"custOrderNum",label:"订单号",minWidth:150,search:{el:"input"}}]:[]),
  {prop:"materNum",label:"物料编号",minWidth:140,search:{el:"input"}},
  {prop:"materName",label:"物料名称",minWidth:150,search:{el:"input"}},
  ...(displayKind==="receipt"?[]:[{prop:"rawNum",label:"原材料编号",minWidth:150,search:{el:"input"}}]),
  {prop:"rawSpecs",label:"规格",minWidth:190,search:{el:"input"}},
  ...(displayKind==="requisition"?[{prop:"orderNumber",label:"订单数量",minWidth:110}]:[]),
  {prop:"productionNumber",label:"生产数",minWidth:110},
  {prop:quantity,label:"材料数",minWidth:120,render:({row}:any)=>`${row[quantity]??''} ${materialUnit(row)}`,detailFormatter:(row:any)=>`${row[quantity]??''} ${materialUnit(row)}`},
  {prop:`${displayKind}Weight`,label:displayKind==="requisition"?"请购重量":displayKind==="purchase"?"采购重量":"回执重量（kg）",minWidth:120},
  ...(displayKind==="requisition"?[{prop:"purchasedNumber",label:"采购数量",minWidth:120,render:({row}:any)=>purchasedQuantity(row),detailFormatter:purchasedQuantity}]:[]),
  ...((displayKind==="purchase"||displayKind==="receipt")&&canViewPrice.value?[{prop:"unitPrice",label:"单价",minWidth:120,render:({row}:any)=>row.unitPrice==null?"":Number(row.unitPrice).toFixed(2),detailFormatter:(row:any)=>row.unitPrice==null?"":Number(row.unitPrice).toFixed(2)}]:[]),
  ...(displayKind==="requisition"?[statusColumn,applyUserColumn]:displayKind==="purchase"?[
    {prop:"incomingNumber",label:"回执数量",minWidth:120,render:({row}:any)=>`${row.useType==="roll"?(row.incomingWeight??0):(row.incomingNumber??0)} ${row.useType==="roll"?"kg":materialUnit(row)}`,detailFormatter:(row:any)=>`${row.useType==="roll"?(row.incomingWeight??0):(row.incomingNumber??0)} ${row.useType==="roll"?"kg":materialUnit(row)}`},
    {prop:"notbackNumber",label:"待回数量",minWidth:120,render:({row}:any)=>`${row.useType==="roll"?(row.notbackWeight??0):(row.notbackNumber??0)} ${row.useType==="roll"?"kg":materialUnit(row)}`,detailFormatter:(row:any)=>`${row.useType==="roll"?(row.notbackWeight??0):(row.notbackNumber??0)} ${row.useType==="roll"?"kg":materialUnit(row)}`},
    purchaseItemStatusColumn
  ]:[]),
  {prop:"remark",label:"备注",minWidth:160,search:{el:"input"}},
  {prop:"tableRemark",label:"整单备注",minWidth:180,search:{el:"input"}}
];
};
const itemDisplayColumns=computed(()=>displayColumns(kind));
const relatedKind=kind==="requisition"?"purchase":"receipt";
const relatedColumns=computed(()=>displayColumns(relatedKind));
const relatedVisible=ref(false);
const relatedSource=ref<RawItem>();
const relatedLoading=ref(false);
const requestRelated=async(params:any)=>{
  relatedLoading.value=true;
  try{return await itemPage(relatedKind,{...params,[kind==="requisition"?"requisitionItemId":"purchaseItemId"]:relatedSource.value!.id})}
  finally{relatedLoading.value=false}
};
const openView=(row:RawItem)=>{
  if((kind==="requisition"||kind==="purchase")&&viewMode.value==="item"){
    relatedSource.value=row;
    relatedVisible.value=true;
  }else openDetail(row);
};
const columns=computed<ColumnProps[]>(()=>[{type:"selection",label:"选择",prop:"id",width:60},{type:"index",label:"序号",width:70},...(viewMode.value==="table"?tableColumns[kind]:itemDisplayColumns.value),{prop:"operation",label:"操作",fixed:"right",width:kind==="purchase"&&viewMode.value==="item"?330:230}]);
const closingIds=reactive(new Set<number>());
const closeItem=async(row:RawItem)=>{
  if(row.id==null||closingIds.has(row.id))return;
  closingIds.add(row.id);
  try{
    await unwrap(closePurchaseItem(row.id));
    row.closed=1;
    row.status="已完成";
    ElMessage.success("结案成功");
    await tableRef.value?.getTableList();
  }finally{closingIds.delete(row.id)}
};
const requestApi=(p:any)=>viewMode.value==="table"?tablePage(kind,p):itemPage(kind,p);const dataCallback=(d:any)=>({list:d.records,total:d.total});
const numberOf=(r:any)=>r.requisitionNum||r.purchaseNum||r.receiptNum;const dateOf=(r:any)=>r.requisitionDate||r.purchaseDate||r.receiptDate;
const openDetail=async(row:any)=>{const id=viewMode.value==="table"?row.id:row.tableId;current.value=await unwrap(getDocument(kind,id));detailVisible.value=true};
const exportCurrent=async(row:any)=>{const id=parentIdOf(row);if(kind==="requisition"){const[{exportRequisitionPdf},document]=await Promise.all([import("../utils/requisitionDocumentPdf"),unwrap<RawTable>(getDocument("requisition",id))]);return exportRequisitionPdf("raw",document)}const[{exportPurchasePdf},document]=await Promise.all([import("../utils/purchaseDocumentPdf"),unwrap<RawTable>(getDocument("purchase",id))]);await exportPurchasePdf("raw",document)};
const parentIdOf=(row:any)=>viewMode.value==="table"?row.id:row.tableId;
const openEditorFromRow=async(row:any)=>openEditor({id:parentIdOf(row)});
const reset=()=>{Object.keys(form).forEach(k=>delete form[k]);form.items=[];Object.keys(editing).forEach(k=>delete (editing as any)[k]);form[dateField.value]=new Date().toISOString().slice(0,10)};
const hasRequisitionRemain=(item:any)=>item.useType==="roll"?Number(item.notPurchaseWeight)>(Number(item.purchasedWeight)>0?0.1:0):Number(item.notPurchaseNumber)>0;
const requisitionOptionLabel=(item:any)=>`${item.materNum||''} / ${item.rawSpecs||''} / ${item.useType==="roll"?`未采重量${item.notPurchaseWeight||0}`:`未采${item.notPurchaseNumber||0}张`}`;
const loadRequisitionOptions=async(includeIds:any[]=[])=>{const req=await unwrap<any>(itemPage("requisition",{pageNum:1,pageSize:1000}));const idSet=new Set(includeIds.filter(Boolean).map(String));requisitionOptions.value=(req.records||[]).filter((item:any)=>hasRequisitionRemain(item)||idSet.has(String(item.id)))};
const loadEditorOptions=async(includeIds:any[]=[],purchaseIds:any[]=[])=>{rawOptions.value=await unwrap(getRawOptions());if(kind==="purchase"){supplierOptions.value=await unwrap(getSupplierOptions());await loadRequisitionOptions(includeIds)}if(kind==="receipt"){const page=await unwrap<any>(tablePage("purchase",{pageNum:1,pageSize:1000}));purchaseOptions.value=(page.records||[]).filter((item:any)=>item.status!=="已完成"||purchaseIds.some(id=>String(id)===String(item.id)))}};
const openEditor=async(row?:any)=>{reset();let data:RawTable|undefined;if(row?.id)data=await unwrap<RawTable>(getDocument(kind,row.id));await loadEditorOptions(data?.items?.map(item=>item.requisitionItemId),data?.items?.map((item:any)=>item.purchaseTableId));if(data){Object.assign(editing,data);Object.assign(form,JSON.parse(JSON.stringify(data)));if(kind==="receipt")form.purchaseTableIds=[...new Set((form.items||[]).map((item:any)=>item.purchaseTableId).filter(Boolean))];form.items.forEach(enrichRow)}editorVisible.value=true};
const addRow=()=>form.items.push({});
const optionFor=(row:any)=>rawOptions.value.find(v=>String(v.relationId)===String(row.relationId)&&v.useType===row.useType)||rawOptions.value.find(v=>String(v.rawId)===String(row.rawId)&&String(v.materId)===String(row.materId));
const enrichRow=(row:any)=>{const o=optionFor(row);if(o)Object.assign(row,{optionId:`${o.relationId}-${o.useType}`,useType:o.useType,sheetOutputNumber:o.sheetOutputNumber,sheetWeight:o.sheetWeight,grossWeight:o.grossWeight})};
const materialUnit=(row:any)=>row.useType==="roll"?"卷":row.useType==="sheet"?"张":"";
const round4=(value:number)=>Math.round(value*10000)/10000;
const syncFromProduction=(row:any)=>{if(kind==="receipt")return;enrichRow(row);const n=Number(row.productionNumber||0);if(row.useType==="sheet"&&Number(row.sheetOutputNumber)>0){row[quantityField.value]=Math.ceil(n/Number(row.sheetOutputNumber));if(Number(row.sheetWeight)>0)row[weightField.value]=round4(row[quantityField.value]*Number(row.sheetWeight))}else if(row.useType==="roll"&&Number(row.grossWeight)>0){if(!row[quantityField.value])row[quantityField.value]=1;row[weightField.value]=round4(n*Number(row.grossWeight)/1000)}};
const syncFromMaterial=(row:any)=>{if(kind==="receipt")return;enrichRow(row);const n=Number(row[quantityField.value]||0);if(row.useType==="sheet"){if(Number(row.sheetOutputNumber)>0)row.productionNumber=n*Number(row.sheetOutputNumber);if(Number(row.sheetWeight)>0)row[weightField.value]=round4(n*Number(row.sheetWeight))}};
const syncFromWeight=(row:any)=>{if(kind==="receipt")return;enrichRow(row);const w=Number(row[weightField.value]||0);if(row.useType==="sheet"&&Number(row.sheetWeight)>0){row[quantityField.value]=Math.ceil(w/Number(row.sheetWeight));if(Number(row.sheetOutputNumber)>0)row.productionNumber=row[quantityField.value]*Number(row.sheetOutputNumber)}else if(row.useType==="roll"&&Number(row.grossWeight)>0){if(!row[quantityField.value])row[quantityField.value]=1;row.productionNumber=Math.ceil(w*1000/Number(row.grossWeight))}};
const selectRaw=(row:any,key:string)=>{const o=rawOptions.value.find(v=>`${v.relationId}-${v.useType}`===key);if(o){if(row.materId!=null&&String(row.materId)!==String(o.materId))setOrders(row,[]);Object.assign(row,o,{optionId:key});if(o.useType==="roll"&&!row[quantityField.value])row[quantityField.value]=1;if(row.productionNumber)syncFromProduction(row)}};
const selectReq=(row:any,id:number)=>{const o=requisitionOptions.value.find(v=>String(v.id)===String(id));if(o){const source={...o};delete source.orderNumber;delete source.orderItemIds;delete source.orders;Object.assign(row,source,{id:undefined,tableId:undefined,requisitionItemId:id,purchaseNumber:o.useType==="roll"?(o.requisitionNumber||1):(o.notPurchaseNumber||o.requisitionNumber),purchaseWeight:o.useType==="roll"?o.notPurchaseWeight:o.requisitionWeight});enrichRow(row)}};
const orderTargetRow=ref<any>();
const openOrderSelector=(row?:any)=>{
  orderTargetRow.value=row;
  return orderSelectorRef.value?.open(rawOptions.value.map(item=>item.materId),false,{materId:row?.orders?.[0]?.materId??row?.materId,excludedIds:row?.orderItemIds||[]});
};
const setOrders=(row:any,orders:RawOrderSource[])=>{
  row.orders=[...new Map(orders.map(order=>[String(order.orderItemId),order])).values()];
  row.orderItemIds=row.orders.map((order:RawOrderSource)=>order.orderItemId);
  row.orderNumber=row.orders.reduce((sum:number,order:RawOrderSource)=>sum+Number(order.orderNumber||0),0);
  row.custOrderNum=[...new Set(row.orders.map((order:RawOrderSource)=>order.orderNum).filter(Boolean))].join(",");
  row.custOrderId=undefined;
};
const removeOrder=(row:any,id:number)=>setOrders(row,(row.orders||[]).filter((order:RawOrderSource)=>order.orderItemId!==id));
const linkOrders=(row:any,orders:any[])=>{
  if(new Set([...(row.orders||[]).map((order:RawOrderSource)=>String(order.materId)),...orders.map(order=>String(order.materId))]).size>1)return ElMessage.warning("同一条请购明细只能关联相同物料的订单");
  setOrders(row,[...(row.orders||[]),...orders.map(order=>({orderItemId:order.id,orderId:order.orderId,orderNum:order.orderNum,materId:order.materId,orderNumber:Number(order.totalNumber||0)}))]);
  if(!row.rawId){const o=rawOptions.value.find(v=>String(v.materId)===String(orders[0].materId));if(o)Object.assign(row,o,{optionId:`${o.relationId}-${o.useType}`})}
  if(row.productionNumber==null){row.productionNumber=orders.reduce((sum,order)=>sum+Number(order.notAlreadyNumber||0),0);syncFromProduction(row)}
};
const selectOrderItems=(orders:any[])=>{
  if(orderTargetRow.value)return linkOrders(orderTargetRow.value,orders);
  const groups=new Map<string,any[]>();
  orders.forEach(order=>{const key=String(order.materId);groups.set(key,[...(groups.get(key)||[]),order])});
  groups.forEach(group=>{const row:any={remark:group[0].remark};linkOrders(row,group);form.items.push(row)});
};
const syncSupplier=(id:any)=>{const o=supplierOptions.value.find(v=>String(v.value)===String(id));form.supName=o?.label};
const loadPurchases=async(ids:number[])=>{const previousIds=new Set((form.items||[]).map((i:any)=>String(i.purchaseTableId)));const previousItems=form.items||[];const list=await Promise.all((ids||[]).map(id=>unwrap<RawTable>(getDocument("purchase",id))));form.purchaseNum=list.map(p=>p.purchaseNum).filter(Boolean).join(",");form.supName=[...new Set(list.map(p=>p.supName).filter(Boolean))].join(",");form.items=list.flatMap(p=>previousIds.has(String(p.id))?previousItems.filter((i:any)=>String(i.purchaseTableId)===String(p.id)):(p.items||[]).filter((i:any)=>Number(i.closed)!==1&&(i.useType==="roll"?Number(i.notbackWeight)>0:Number(i.notbackNumber)>0)).map(i=>{const row:any={...i,id:undefined,tableId:undefined,purchaseItemId:i.id,purchaseTableId:p.id,purchaseNum:p.purchaseNum,receiptNumber:i.useType==="roll"?(i.purchaseNumber||1):i.notbackNumber,receiptWeight:i.notbackWeight,productionNumber:i.notbackProductionNumber};enrichRow(row);return row}))};
const submit=async()=>{
  if(saving.value)return;
  if(kind==="receipt"&&!form.receiptNum?.trim())return ElMessage.warning("请填写回执单号");
  if(!form[dateField.value]||!form.items?.length)return ElMessage.warning("请填写日期和明细");
  if(form.items.some((row:any)=>!row.rawId))return ElMessage.warning("请选择原材料");
  saving.value=true;
  try{
    const payload:RawTable=JSON.parse(JSON.stringify(form));
    if(editing.id)payload.id=editing.id;
    delete payload.mergeChoice;
    delete payload.mergeTargetId;
    delete payload.mergeTargetUpdatedTime;
    if(kind==="receipt"&&payload.id){
      const check=await unwrap<ReceiptMergeCheck>(checkReceiptMerge(payload));
      if(check.conflict&&check.current&&check.existing){
        const choice=await mergeDialogRef.value?.choose(check.current,check.existing);
        if(!choice)return;
        payload.mergeChoice=choice;
        payload.mergeTargetId=check.existing.id;
        payload.mergeTargetUpdatedTime=check.existing.updatedTime;
      }
    }
    const saved=await unwrap<RawTable>(saveDocument(kind,payload));
    ElMessage.success(payload.id&&saved.id!==payload.id?"回执合并成功":"保存成功");
    editorVisible.value=false;
    tableRef.value?.getTableList();
  }finally{saving.value=false}
};
const removeDocuments=async(rows:any[])=>{const ids=[...new Set(rows.map(parentIdOf).filter(Boolean))];if(!ids.length)return;await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 张${props.title}吗？删除主表会同时删除对应明细。`,"删除确认",{type:"warning"});await Promise.all(ids.map(id=>unwrap(deleteDocument(kind,Number(id)))));ElMessage.success("删除成功");tableRef.value?.getTableList()};
const remove=(row:any)=>removeDocuments([row]);
const removeSelected=(rows:any[])=>removeDocuments(rows);
const handleRowClick=(row:any)=>{if(kind!=="requisition")tableRef.value?.element?.toggleRowSelection(row)};
const cancelSelect=()=>tableRef.value?.element?.clearSelection();
const exportExcel=async()=>{const search={...(tableRef.value?.searchParam||{})};const first=await unwrap<any>(requestApi({...search,pageNum:1,pageSize:1}));const records=first.total?(await unwrap<any>(requestApi({...search,pageNum:1,pageSize:first.total}))).records:[];const visible=columns.value.filter((c:any)=>c.prop&&!['id','operation'].includes(c.prop)&&!c.type);const data=records.map((row:any)=>Object.fromEntries(visible.map((c:any)=>[c.label,kind==='requisition'&&c.prop==='purchasedNumber'?purchasedQuantity(row):kind==='purchase'&&viewMode.value==='item'&&c.prop==='status'?purchaseItemStatus(row):row[kind==='purchase'&&viewMode.value==='item'&&c.prop==='notbackNumber'?'notbackWeight':c.prop]??''])));const sheet=XLSX.utils.json_to_sheet(data);const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,viewMode.value==='table'?'主表':'明细');XLSX.writeFile(book,`${props.title}_${viewMode.value}_${new Date().toISOString().slice(0,10)}.xlsx`);ElMessage.success(`成功导出 ${records.length} 条数据`)};
onMounted(async()=>{rawOptions.value=await unwrap(getRawOptions());if(kind==="purchase")supplierOptions.value=await unwrap(getSupplierOptions());await loadRequisitionOptions()});
let activated=false;
onActivated(()=>{if(activated)tableRef.value?.getTableList();activated=true});
</script>
<style scoped>.raw-doc-page{padding:0}.view-switch{display:flex;justify-content:flex-end;margin:0 0 12px}.header-form{display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:0 12px}.header-form.receipt-header{grid-template-columns:minmax(200px,.9fr) minmax(210px,.9fr) minmax(260px,1.3fr) minmax(200px,1fr);gap:0 8px}.receipt-header :deep(.el-form-item__content){min-width:0}.receipt-header :deep(.el-date-editor.el-input){width:100%}.item-toolbar{display:flex;gap:8px;margin:0 0 12px}.order-links{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.number-with-unit{display:flex;align-items:center;gap:8px}.number-with-unit .el-input-number{width:110px}.number-with-unit span{flex:none;color:#606266}.doc-summary{margin-bottom:16px}:deep(.el-select){width:100%}@media(max-width:1100px){.header-form.receipt-header{grid-template-columns:repeat(2,minmax(220px,1fr))}}@media(max-width:600px){.header-form,.header-form.receipt-header{grid-template-columns:1fr}}</style>
