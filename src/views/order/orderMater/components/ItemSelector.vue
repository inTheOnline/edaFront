<template>
  <el-dialog v-model="visible" title="选择客户订单产品行" width="1000px" destroy-on-close>
    <el-table :data="orders" v-loading="loading" highlight-current-row height="250" @current-change="selectOrder">
      <el-table-column prop="orderPo" label="客户订单号" min-width="180" />
      <el-table-column label="客户" width="120"
        ><template #default="{ row }">{{ dict.getLabel("cust", row.custId) }}</template></el-table-column
      >
      <el-table-column prop="orderDate" label="下单日期" width="120" />
      <el-table-column prop="sourceSys" label="来源" width="100" />
      <el-table-column v-if="canViewPrice" prop="totalAmount" label="订单金额" width="120" />
      <el-table-column label="备注" min-width="180"
        ><template #default="{ row }">{{ safePriceRemark(row.remark, canViewPrice) }}</template></el-table-column
      >
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="10"
      :total="total"
      layout="prev, pager, next"
      @current-change="loadOrders"
    />
    <p>先选择客户订单，再勾选需要转入的产品行。</p>
    <el-table :data="lines" v-loading="lineLoading" row-key="id" border height="260" @selection-change="selected = $event">
      <el-table-column type="selection" width="50" :selectable="(row) => Boolean(row.materId)" />
      <el-table-column prop="materNum" label="产品编号" min-width="160" />
      <el-table-column prop="materName" label="产品名称" min-width="220" />
      <el-table-column label="匹配状态" width="150"
        ><template #default="{ row }">{{ row.materId ? "已匹配产品" : "未匹配，请先维护物料" }}</template></el-table-column
      >
      <el-table-column prop="number" label="客户订单数量" width="120" />
      <el-table-column v-if="canViewPrice" label="含税单价" width="130"
        ><template #default="{ row }">{{ formatPrice(row.price) }}</template></el-table-column
      >
    </el-table>
    <template #footer
      ><el-button @click="visible = false">取消</el-button
      ><el-button type="primary" :disabled="!selected.length" @click="confirm">确认选择产品行</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { getCustTableItem, getOrderDetail } from "@/api/modules/order";
import { useDictStore } from "@/stores/modules/dict";
import { useOrderPrice, safePriceRemark } from "@/views/order/orderTable/components/useOrderPrice";
const dict = useDictStore();
const { canViewPrice, formatPrice } = useOrderPrice();
const visible = ref(false),
  loading = ref(false),
  lineLoading = ref(false),
  page = ref(1),
  total = ref(0);
const orders = ref<any[]>([]),
  lines = ref<any[]>([]),
  selected = ref<any[]>([]),
  current = ref<any>();
let requestId = 0;
const emit = defineEmits<{ confirm: [any[]] }>();
const loadOrders = async () => {
  loading.value = true;
  try {
    const { data } = await getCustTableItem({ pageNum: page.value, pageSize: 10, data: {} });
    orders.value = data.records || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
};
const selectOrder = async (row: any) => {
  const version = ++requestId;
  current.value = row;
  lines.value = [];
  selected.value = [];
  if (!row) return;
  lineLoading.value = true;
  try {
    const { data } = await getOrderDetail(row.id);
    if (version === requestId) lines.value = data || [];
  } finally {
    if (version === requestId) lineLoading.value = false;
  }
};
const open = async () => {
  visible.value = true;
  page.value = 1;
  lines.value = [];
  selected.value = [];
  current.value = undefined;
  await dict.loadDict("cust");
  await loadOrders();
};
const confirm = () => {
  emit(
    "confirm",
    selected.value.map((line) => ({
      ...line,
      custOrderItemId: line.id,
      custId: current.value.custId,
      orderNum: current.value.orderPo,
    })),
  );
  visible.value = false;
};
defineExpose({ open });
</script>
<style scoped>
.el-pagination {
  justify-content: flex-end;
  margin-top: 12px;
}
p {
  color: var(--el-text-color-secondary);
}
</style>
