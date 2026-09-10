<template>
  <el-dialog v-model="visible" title="开退货单" width="96%" top="4vh" :close-on-click-modal="false">
    <el-form :model="form" label-width="82px" class="order-header">
      <el-form-item label="供应商">
        <el-select v-model="form.supId" filterable style="width: 100%">
          <el-option v-for="item in suppliers" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="form.subcDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="系统单号"><el-input :model-value="form.subcNum" readonly placeholder="保存后自动生成" /></el-form-item>
      <el-form-item label="打印编号"><el-input :model-value="form.printNum" readonly placeholder="保存后自动生成" /></el-form-item>
      <el-form-item label="整单备注" class="full-row"><el-input v-model="form.subcRemark" /></el-form-item>
    </el-form>

    <el-table :data="form.rows" border max-height="520" size="small">
      <el-table-column label="物料编号" min-width="180">
        <template #default="{ row }">
          <el-select v-model="row.materId" filterable style="width:100%" @change="loadMaterial(row)">
            <el-option v-for="item in maters" :key="item.value" :value="item.value" :label="`${item.num || item.label} - ${item.label}`" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="物料名称" min-width="160">
        <template #default="{ row }"><el-input :model-value="row.materName" readonly /></template>
      </el-table-column>
      <el-table-column label="加工工艺" min-width="150">
        <template #default="{ row }">
          <el-select v-model="row.workDetailId" style="width:100%">
            <el-option v-for="item in row.workDetails" :key="item.id" :value="item.id" :label="item.detailName" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="退货原因" min-width="180"><template #default="{ row }"><el-input v-model="row.returnReason" /></template></el-table-column>
      <el-table-column label="单位" width="100">
        <template #default="{ row }"><el-select v-model="row.unit"><el-option v-for="unit in units" :key="unit" :value="unit" /></el-select></template>
      </el-table-column>
      <el-table-column label="数量" width="140"><template #default="{ row }"><el-input-number v-model="row.number" :min="1" controls-position="right" /></template></el-table-column>
      <el-table-column label="备注" min-width="180"><template #default="{ row }"><el-input v-model="row.remark" /></template></el-table-column>
      <el-table-column label="操作" width="70" fixed="right"><template #default="{ $index }"><el-button type="danger" link @click="form.rows.splice($index,1)">删除</el-button></template></el-table-column>
    </el-table>
    <el-button class="add-row" type="primary" plain @click="addRow">新增一行</el-button>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save(false)">保存</el-button>
      <el-button type="success" :loading="saving" @click="save(true)">保存并打印</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import {
  getOutgoingOrderApi, getOutgoingOrderOptionsApi,
  saveOutgoingOrderApi, unwrapData, type OutgoingOrder
} from "../../service";
import { printOutgoingOrderPdf } from "../../utils/outgoingOrderPdf";

type Option = { label: string; value: string | number; num?: string };
type EditRow = OutgoingOrder["rows"][number] & { workDetails: any[] };
const visible=ref(false), saving=ref(false), units=ref<string[]>([]), suppliers=ref<Option[]>([]), maters=ref<Option[]>([]);
const form=ref<OutgoingOrder>({subcDate:dayjs().format("YYYY-MM-DD"),supId:"",subcRemark:"退货返工",rows:[]});
let refresh: (()=>void)|undefined;

const blankRow=():EditRow=>({materId:"",materName:"",workDetailId:"",unit:units.value[0]||"PCS",number:1,sendPvc:false,sendBox:false,workDetails:[]});
const addRow=()=>form.value.rows.push(blankRow());
const loadMaterial=async(row:EditRow,preserve=false)=>{
  if(!row.materId)return;
  const mater=maters.value.find(item=>String(item.value)===String(row.materId));
  row.materName=mater?.label||row.materName;
  const data=await unwrapData(getOutgoingOrderOptionsApi(row.materId));
  row.workDetails=data.workDetails||[];
  if(!preserve)row.workDetailId=row.workDetails[0]?.id||"";
};
const print=async(subcId:number)=>{
  const order=await unwrapData(getOutgoingOrderApi(subcId));
  await printOutgoingOrderPdf(order,"return");
};
const save=async(shouldPrint:boolean)=>{
  if(!form.value.supId||!form.value.subcDate||!form.value.rows.length){ElMessage.warning("请填写供应商、日期和明细");return}
  if(form.value.rows.some(row=>!row.materId||!row.workDetailId||!row.unit||!row.number)){ElMessage.warning("请补全物料、工艺、单位和数量");return}
  if(!form.value.subcRemark?.includes("退货返工"))form.value.subcRemark=`退货返工${form.value.subcRemark?`；${form.value.subcRemark}`:""}`;
  saving.value=true;
  try{const saved=await unwrapData(saveOutgoingOrderApi(form.value));form.value={...saved,rows:saved.rows.map((row:any)=>({...row,workDetails:[]}))};ElMessage.success("退货单保存成功");refresh?.();if(shouldPrint&&saved.subcId)await print(saved.subcId);visible.value=false}
  catch(error:any){ElMessage.error(error?.message||"保存失败")}finally{saving.value=false}
};
const open=async(params:{suppliers:Option[];maters:Option[];subcId?:number;refresh?:()=>void})=>{
  suppliers.value=params.suppliers;maters.value=params.maters;refresh=params.refresh;
  const base=await unwrapData(getOutgoingOrderOptionsApi());units.value=base.units||["PCS"];
  const order=params.subcId?await unwrapData(getOutgoingOrderApi(params.subcId)):{subcDate:dayjs().format("YYYY-MM-DD"),supId:"",subcRemark:"退货返工",rows:[]};
  order.rows=order.rows.map((row:any)=>({...row,workDetails:[]}));form.value=order;
  if(!form.value.rows.length)addRow();
  await Promise.all((form.value.rows as EditRow[]).map(row=>loadMaterial(row,true)));visible.value=true;
};
defineExpose({open,print});
</script>

<style scoped>
.order-header{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0 14px}.full-row{grid-column:1/-1}.add-row{margin-top:12px}
</style>
