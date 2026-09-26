<template>
  <el-dialog v-model="visible" title="批量添加订单记录" width="1100px" :close-on-click-modal="false">
    <el-form inline>
      <el-form-item label="订单日期"><el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="订单号"><el-input v-model.trim="orderNum" /></el-form-item>
      <el-form-item label="来源"
        ><el-radio-group v-model="withOrder" @change="records = []"
          ><el-radio-button :value="false">手工新增</el-radio-button
          ><el-radio-button :value="true">客户订单转入</el-radio-button></el-radio-group
        ></el-form-item
      >
    </el-form>
    <el-table :data="records" border max-height="480">
      <el-table-column type="index" width="50" />
      <el-table-column v-if="withOrder" prop="orderNum" label="客户订单" width="170" />
      <el-table-column label="产品" min-width="240">
        <template #default="{ row }">
          <span v-if="withOrder">{{ row.materName }}（{{ row.materNum }}）</span>
          <el-select v-else v-model="row.materId" filterable placeholder="请选择产品" @change="selectProduct(row)"
            ><el-option
              v-for="item in materList"
              :key="item.value"
              :value="item.value"
              :label="`${item.label}（${item.num || ''}）`"
          /></el-select>
        </template>
      </el-table-column>
      <el-table-column label="订单数量" width="140"
        ><template #default="{ row }"
          ><el-input-number v-model="row.totalNumber" :controls="false" :min="0" style="width: 100%" /></template
      ></el-table-column>
      <el-table-column v-if="canViewPrice" label="含税单价" width="150"
        ><template #default="{ row }"
          ><el-input-number
            :key="`${row.materId}-${row.priceLoading}-${row.priceError}`"
            v-model="row.price"
            :precision="4"
            :min="0"
            :controls="false"
            :disabled="!canEditPrice || row.priceLoading || row.priceError"
            style="width: 100%" /></template
      ></el-table-column>
      <el-table-column label="备注" min-width="150"
        ><template #default="{ row }"><el-input v-model="row.remark" /></template
      ></el-table-column>
      <el-table-column label="操作" width="70"
        ><template #default="{ $index }"
          ><el-button link type="danger" @click="records.splice($index, 1)">删除</el-button></template
        ></el-table-column
      >
    </el-table>
    <el-button class="add-row" @click="withOrder ? selector?.open() : addRow()">{{
      withOrder ? "选择客户订单产品行" : "添加一行"
    }}</el-button>
    <template #footer
      ><el-button @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template
    >
  </el-dialog>
  <ItemSelector ref="selector" @confirm="selectLines" />
</template>
<script setup lang="ts">
import { ref } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { addBatchApi, getOrderProductInfo } from "@/api/modules/order";
import { useOrderPrice, loadProductPrice, type ProductPriceState } from "@/views/order/orderTable/components/useOrderPrice";
import ItemSelector from "./ItemSelector.vue";
type Product = { value: number | string; label: string; num?: string };
type Line = ProductPriceState & {
  custOrderItemId?: number;
  materName?: string;
  materNum?: string;
  orderNum?: string;
  totalNumber: number;
  remark: string;
};
const { canViewPrice, canEditPrice } = useOrderPrice();
const visible = ref(false),
  saving = ref(false),
  withOrder = ref(false),
  date = ref(""),
  orderNum = ref("");
const records = ref<Line[]>([]),
  materList = ref<Product[]>([]),
  selector = ref<InstanceType<typeof ItemSelector>>();
let refresh: (() => void) | undefined;
const addRow = () => records.value.push({ totalNumber: 1, remark: "" });
const selectProduct = loadProductPrice;
const selectLines = (lines: any[]) =>
  records.value.push(
    ...lines.map((line) => ({
      custOrderItemId: line.custOrderItemId,
      materId: line.materId,
      custId: line.custId,
      materName: line.materName,
      materNum: line.materNum,
      orderNum: line.orderNum,
      totalNumber: line.number,
      price: line.price,
      remark: "",
    })),
  );
const open = (params: { materList?: Product[]; getTableList?: () => void; withOrder?: boolean }) => {
  materList.value = params.materList || [];
  refresh = params.getTableList;
  date.value = dayjs().format("YYYY-MM-DD");
  orderNum.value = "";
  withOrder.value = Boolean(params.withOrder);
  records.value = [];
  if (!withOrder.value) addRow();
  visible.value = true;
};
const submit = async () => {
  if (saving.value) return;
  if (records.value.some((row) => row.priceLoading || row.priceError))
    return ElMessage.warning("请等待产品信息加载完成；加载失败时请重新选择产品");
  if (!date.value || !orderNum.value || !records.value.length) return ElMessage.warning("请填写订单日期、订单号及产品行");
  if (
    records.value.some(
      (row) =>
        !Number.isFinite(row.totalNumber) || row.totalNumber <= 0 || (withOrder.value ? !row.custOrderItemId : !row.materId),
    )
  )
    return ElMessage.warning("请完善每行产品和正数数量");
  if (new Set(records.value.map((row) => row.custId).filter(Boolean)).size > 1)
    return ElMessage.warning("同一订单只能包含同一客户的产品");
  saving.value = true;
  try {
    await addBatchApi(
      records.value.map((row) => ({
        materId: row.materId,
        custOrderItemId: row.custOrderItemId,
        totalNumber: row.totalNumber,
        remark: row.remark,
        localTime: date.value,
        orderNum: orderNum.value,
        ...(canEditPrice.value ? { price: row.price } : {}),
      })) as any,
    );
    ElMessage.success("订单已保存");
    visible.value = false;
    refresh?.();
  } finally {
    saving.value = false;
  }
};
defineExpose({ open });
</script>
<style scoped>
.add-row {
  margin-top: 16px;
}
</style>
