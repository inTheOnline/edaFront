<template>
  <el-dialog
    v-model="visible"
    title="导入客户订单"
    width="1300px"
    destroy-on-close
  >
    <el-table
      :data="list"
      border
      height="400"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <!-- 序号列 -->
      <el-table-column
        type="index"
        label="序号"
        width="60"
        align="center"
      />
      <el-table-column prop="orderPo" label="客户订单号">
        <template #default="{ row }">
          <el-link
            type="primary"
            :underline="false"
            @click="openOrderDetail(row)"
          >
            {{ row.orderPo }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="custName" label="客户" />
      <el-table-column prop="orderDate" label="下单日期" />
      <el-table-column prop="status" label="状态" enum:stateEnum />
    </el-table>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="selectedIds.length === 0"
        @click="submit"
      >
        导入选中订单
      </el-button>
    </template>
  </el-dialog>
  <OrderDetail v-model="detailVisible" :order="currentOrder" :materItem="materItem"/>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { getCustOrderList, importCustOrders,getOrderDetail } from "@/api/modules/order"
import OrderDetail from "@/views/order/orderTable/components/OrderDetail.vue"; 


const visible = ref(false)
const list = ref([])
const selectedIds = ref<number[]>([])
const stateEnum = [{label:0,value:"待处理"}]
const open = async () => {
  visible.value = true
  const res = await getCustOrderList()
  list.value = res.data
}

defineExpose({ open })

const handleSelectionChange = (rows) => {
  selectedIds.value = rows.map(r => r.id)
}

const submit = async () => {
  await importCustOrders(selectedIds.value)
  visible.value = false
}
//订单详情页功能
const detailVisible = ref(false)
const currentOrder = ref(null)
const materItem = ref(null)

const openOrderDetail = async (row) => {
  currentOrder.value = row
  materItem.value = (await getOrderDetail(row.id)).data;
  
  detailVisible.value = true
}
</script>
