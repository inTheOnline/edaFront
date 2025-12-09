<template>
  <el-drawer
    :title="drawerTitle"
    :model-value="visible"
    size="500px"
    @close="onClose"
  >
    <el-form :model="form" label-width="100px" :disabled="mode === 'view'">
      <el-form-item label="采购数量" prop="purchaseQty">
        <el-input-number v-model="form.purchaseQty" :min="1" />
      </el-form-item>

      <el-form-item label="单价" prop="price">
        <el-input-number v-model="form.price" :min="0" :step="0.1" />
      </el-form-item>

      <el-form-item label="总价">
        <el-input-number :model-value="form.totalPrice" disabled />
      </el-form-item>

      <el-form-item label="供应商" prop="supplier">
        <el-input v-model="form.supplier" placeholder="请输入供应商名称" />
      </el-form-item>

      <el-form-item label="采购日期" prop="purchaseDate">
        <el-date-picker v-model="form.purchaseDate" type="date" />
      </el-form-item>

      <el-form-item label="到货日期" prop="arrivalDate">
        <el-date-picker v-model="form.arrivalDate" type="date" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button v-if="mode !== 'view'" type="primary" @click="onSubmit">保存</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, watch, reactive } from 'vue'
import type { OfficePurchaseProcessDTO, OfficePurchaseVO } from '@/types/officePurchase'

const props = defineProps<{
  visible: boolean
  mode: 'add' | 'edit' | 'view'
  detail?: OfficePurchaseVO
}>()

const emit = defineEmits(['update:visible', 'submit'])

const form = reactive<OfficePurchaseProcessDTO>({...{
  purchaseId: 0,
  purchaseUserId: 0,
  purchaseQty: 1,
  price: 0,
  totalPrice: 0,
  supplier: '',
  purchaseDate: '',
  arrivalDate: '',
  remark: ''
}})

watch(
  () => props.detail,
  val => {
    if (val && props.mode !== 'add') {
      Object.assign(form, val)
    }
  },
  { immediate: true }
)

watch(
  () => [form.purchaseQty, form.price],
  () => {
    form.totalPrice = Number((form.purchaseQty * form.price).toFixed(2))
  }
)

const drawerTitle = computed(() => {
  return props.mode === 'add'
    ? '新增采购信息'
    : props.mode === 'edit'
    ? '编辑采购信息'
    : '查看采购信息'
})

const onClose = () => emit('update:visible', false)
const onSubmit = () => emit('submit', form)
</script>
