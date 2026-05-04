<template>
  <el-dialog v-model="visible" title="选择客户订单" width="1300px" destroy-on-close>
    <el-table :data="list" border height="400" @row-click="onRowClick">
      <el-table-column prop="orderPo" label="客户订单号" />
      <el-table-column prop="custName" label="客户" />
      <el-table-column prop="orderDate" label="下单日期" />
      <el-table-column prop="status" label="状态" />
    </el-table>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { getCustOrderList } from "@/api/modules/order"
const visible = ref(false)
const list = ref([])
const emit = defineEmits(['confirm'])

const open = async () => {
  visible.value = true
  list.value = (await getCustOrderList()).data
}

const onRowClick = (row: any) => {
  emit('confirm', row)
  visible.value = false
}

defineExpose({ open })
</script>