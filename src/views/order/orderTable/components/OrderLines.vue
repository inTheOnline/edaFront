<template>
  <div class="order-lines">
    <el-table :data="modelValue" border>
      <el-table-column label="产品" min-width="220">
        <template #default="{ row }">
          <el-select v-model="row.materId" filterable placeholder="请选择产品" @change="selectProduct(row)">
            <el-option v-for="item in options" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="数量" width="135">
        <template #default="{ row }"
          ><el-input-number v-model="row.totalNumber" :min="1" :controls="false" style="width: 100%"
        /></template>
      </el-table-column>
      <el-table-column v-if="canViewPrice" label="含税单价" width="150">
        <template #default="{ row }">
          <el-input-number
            :key="`${row.materId}-${row.priceLoading}-${row.priceError}`"
            v-model="row.price"
            :precision="4"
            :min="0"
            :controls="false"
            :disabled="!canEditPrice || row.priceLoading || row.priceError"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="70">
        <template #default="{ $index }"><el-button link type="danger" @click="remove($index)">删除</el-button></template>
      </el-table-column>
    </el-table>
    <el-button class="add-line" @click="add">添加产品</el-button>
  </div>
</template>
<script setup lang="ts">
import { useOrderPrice, loadProductPrice } from "./useOrderPrice";
type Line = { id?: number; materId?: number | string; totalNumber: number; price?: number | null; remark?: string };
const props = defineProps<{ modelValue: Line[]; options: { value: number | string; label: string }[] }>();
const emit = defineEmits<{ "update:modelValue": [Line[]] }>();
const { canViewPrice, canEditPrice } = useOrderPrice();
const selectProduct = loadProductPrice;
const add = () => emit("update:modelValue", [...(props.modelValue || []), { totalNumber: 1 }]);
const remove = (index: number) =>
  emit(
    "update:modelValue",
    props.modelValue.filter((_, i) => i !== index),
  );
</script>
<style scoped>
.order-lines {
  width: 100%;
}
.add-line {
  margin-top: 12px;
}
</style>
