<template>
  <el-dialog
    v-model="visible"
    title="客户订单详情"
    width="1000px"
    destroy-on-close
  >
    <el-descriptions
      v-if="order"
      :column="2"
      border
      size="default"
    >
      <el-descriptions-item label="客户订单号">
        {{ order.orderPo }}
      </el-descriptions-item>
      <el-descriptions-item label="客户">
        {{ dictStore.getLabel('cust', order.custId) }}
      </el-descriptions-item>
      <el-descriptions-item label="下单日期">
        {{ order.orderDate }}
      </el-descriptions-item>
      <el-descriptions-item label="来源系统" v-if="!sizeUp" >
        {{ order.sourceSys }}
      </el-descriptions-item>
      <el-descriptions-item label="订单总价" v-else >
        {{ Number(order.totalAmount).toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">
        {{ order.remark || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="订单详情" :span="2">
        <el-table :data="materItem" style="width: 100%" show-overflow-tooltip>
          <el-table-column prop="materNum" label="物料编号" width="180" />
          <el-table-column prop="materName" label="物料名称" width="360" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="number" label="下单数量" />
          <el-table-column prop="price" label="单价" />
        </el-table>
      </el-descriptions-item>
    </el-descriptions>

    
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="submit">导入订单</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed,onMounted,ref,reactive } from 'vue'
import { Table } from 'ant-design-vue';
import ProTable from "@/components/ProTable/index.vue";
import { getOrderDetail } from "@/api/modules/order"
import { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
import {useAuthStore} from '@/stores/modules/auth'
import { List } from '@element-plus/icons-vue/dist/types';

const authStore = useAuthStore();
const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
//数据加工
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
  };
//传入参数
const props = defineProps({
  modelValue: Boolean,// 控制对话框显示
  order: {
    type: Object,
    default: null
  },// 订单Table详情表格数据
  materItem: {
    type: Array,
    default: () => []
  }// 订单详情物料表格数据
})
// 初始化加载字典
onMounted(async () => {
  // 加载产品字典（与数据库关联的外键表）
  await dictStore.loadDicts(["mater","cust"]);

});
//表格列配置
const tableData = ref([]);


const emit = defineEmits(['update:modelValue'])

const submit = async () => {
  // 导入订单
  console.log('提交订单:', props.order);
  visible.value = false; // 关闭对话框
}

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const sizeUp = function() {
  return authStore.isExistence("price:look"); // 根据实际需求调整宽度阈值
}
</script>
