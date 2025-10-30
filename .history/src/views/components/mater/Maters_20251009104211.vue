<template>
  <div class="mater-detail">
    <h1>物料列表</h1>
    <div v-for="(material, index) in modelValue" :key="index" class="mater-row">
      <el-select
        v-model="material.materId"
        :options="options"
        placeholder="请选择或输入物料"
        style="width: 60%; margin-right: 20px"
        clearable
        filterable
        allow-create
        default-first-option
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <el-input-number
        v-model="material.totalNumber"
        placeholder="数量"
        :min="1"
        style="width: 20%; margin-right: 20px"
      />

      <el-button
        type="danger"
        icon="Delete"
        @click="remove(index)"
      >删除</el-button>
    </div>

    <el-button class="mater-button" type="primary" icon="Plus" @click="add">添加物料</el-button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Array as () => { id: string | number; number: number }[],
    default: () => [], 
  },
  options: {
    type: Array as () => { label: string; value: string | number }[],
    default: () => [],
  },
})
const emit = defineEmits(['update:modelValue'])

const add = () => {
  const list = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  list.push({ id: '', totalNumber: 1 })
  emit('update:modelValue', list)
}
const remove = (index: number) => {
  const list = [...props.modelValue]
  list.splice(index, 1)
  emit('update:modelValue', list)
}
</script>

<style scoped lang="scss">
h1 {
  margin: 10px auto;
  font-size: 24px;
  font-weight: bold;
  color: #888888;
  text-align: center;
}
.mater-detail {
  width: 100%;
  padding: 10px;
  border: 2px solid #f2f2f2;
  border-radius: 10px;
  box-shadow: 2px 2px rgba(0, 0, 0, 0.3);
}
.mater-button {
  display: flex;
  justify-content: center;
  width: 100px;
  padding: 10px;
  margin: 20px auto 0;
}
.mater-row {
  display: flex;
  justify-content: center;
  padding: 5px;
}
</style>
