<template>
  <el-dialog v-model="visible" title="选择订单条目" width="60%">
    <!-- 🔥 替换为你的 ProTable 组件 -->
    <ProTable
      ref="proTableRef"
      :columns="tableColumns"
      :request-api="getItemList"
      :data-callback="dataCallback"
      :pagination="true"
      :tool-button="[]"
      row-key="id"
      :virtualized="false"
      table-height="420px"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >

      <template #orderPo="{ row }">
          <el-link type="primary" @click="openOrderDetail(row)">
            {{ row.orderPo }}
          </el-link>
      </template>
    </ProTable>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirmSelect">确认选择</el-button>
    </template>
  </el-dialog>

  <!-- 订单详情组件（无修改） -->
  <OrderDetail v-model="detailVisible" :order="currentOrder" :mater-item="materItem"/>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
// 接口（无修改）
import { getCustTableItem as getItemList } from "@/api/modules/order";
import { getOrderDetail } from "@/api/modules/order";
// 引入你的 ProTable 组件 + 订单详情
import ProTable from "@/components/ProTable/index.vue";
import OrderDetail from "@/views/order/orderTable/components/OrderDetail.vue";


const visible = ref(false);
const proTableRef = ref(); // ProTable 实例
const selectedRows = ref<any[]>([]); // 选中数据
const dictStore = useDictStore();
// 初始化（完全不动）
onMounted(async () => {
  try { await dictStore.loadDicts(["cust", "user", "mater"]);
  } catch (error) { ElMessage.error("字典数据加载失败"); console.error(error); }
});
// 查询条件（无修改）
const query = ref({
  searchIntel: "",
});
const dataCallback = (data) => ({ list: data.records, total: data.total });
// 订单详情相关（无修改）
const detailVisible = ref(false);
const currentOrder = ref(null);
const materItem = ref(null);


const emit = defineEmits(["confirm"]);

// 🔥 ProTable 列配置（替换原表格列）
const tableColumns: ColumnProps[] = reactive([
  { type: "selection", width: 60 }, // 多选列
  {
    prop: "orderPo",
    slot: "orderPo",
    label: "订单号",
    width: 200,
  },
    {
    label: "客户",
    prop: "custId",
    enum: computed(() => dictStore.dictMap["cust"] || []),
    minWidth: 120,
  },
  { prop: "orderDate", label: "下单时间", width: 180 },
  { prop: "sourceSys", label: "来源系统", width: 120 },
  { prop: "totalAmount", label: "订单金额", width: 150, align: "right" },
  { prop: "orderStatus", label: "状态", tag: true, width: 150, align: "right" },
]);

// 打开弹窗（无修改）
const open = () => {
  visible.value = true;
  selectedRows.value = [];
};

// 搜索按钮事件
const handleSearch = () => {
  proTableRef.value?.getTableList(); // 刷新 ProTable 数据
};

// 选择变化（无修改）
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

// 点击行切换选中（无修改）
const handleRowClick = (row: any) => {
  proTableRef.value?.element?.toggleRowSelection(row)
};

// 一键全选（适配 ProTable）
const handleSelectAll = () => {
  if (!proTableRef.value) return;
  proTableRef.value.clearSelection(); // 清空选中
  // 仅选中可开单数据（原有逻辑不变）
  const tableData = proTableRef.value.tableData;
  const availableRows = tableData.filter((item: any) => item.notAlreadyNumber > 0);
  availableRows.forEach((row: any) => proTableRef.value?.element?.toggleRowSelection(row, true));
};

// 确认选择（无修改）
const confirmSelect = () => {
  // 🔥 核心：字段映射，保留A表格显示，给B返回正确字段
  const result = selectedRows.value.map(row => ({
    ...row, // 保留所有原始字段（id、materName、materNum、notAlreadyNumber 全都在）
    orderNum: row.orderPo, // 关键：把 orderPo 赋值给 orderNum，适配B组件
  }))
  console.log("选中数据（映射后）:", result);
  emit("confirm", result);
  visible.value = false;
};

// 打开订单详情（无修改，完全复用你的逻辑）
const openOrderDetail = async (row: any) => {
  currentOrder.value = row;
  materItem.value = (await getOrderDetail(row.id)).data;
  detailVisible.value = true;
};

defineExpose({ open });
</script>

<style scoped>

</style>