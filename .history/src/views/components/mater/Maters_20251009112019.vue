<template>
  <el-form :model="form" label-width="100px">
    <!-- 料号 -->
    <el-form-item label="料号">
      <el-autocomplete
        v-model="form.materialCode"
        :fetch-suggestions="queryByCode"
        placeholder="请输入料号"
        @select="onSelectMaterial"
      />
    </el-form-item>

    <!-- 物料名称 -->
    <el-form-item label="物料名称">
      <el-autocomplete
        v-model="form.materialName"
        :fetch-suggestions="queryByName"
        placeholder="请输入物料名称"
        @select="onSelectMaterial"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟接口返回的物料数据
const allMaterials = [
  { id: 1, code: 'A001', name: '铝板' },
  { id: 2, code: 'B002', name: '铁片' },
  { id: 3, code: 'C003', name: '不锈钢管' },
]

const form = ref({
  materialId: null,
  materialCode: '',
  materialName: ''
})

// 根据料号查询
const queryByCode = (queryString, cb) => {
  const results = allMaterials
    .filter(item => item.code.includes(queryString))
    .map(item => ({ value: item.code, ...item }))
  cb(results)
}

// 根据名称查询
const queryByName = (queryString, cb) => {
  const results = allMaterials
    .filter(item => item.name.includes(queryString))
    .map(item => ({ value: item.name, ...item }))
  cb(results)
}

// 当选择任意一个匹配项时，更新整个物料信息
const onSelectMaterial = (item) => {
  form.value.materialId = item.id
  form.value.materialCode = item.code
  form.value.materialName = item.name
}

// 提交时只带 materialId
const submitForm = () => {
  if (!form.value.materialId) {
    return ElMessage.warning('请先选择有效的物料')
  }
  console.log('提交数据：', { materialId: form.value.materialId })
  ElMessage.success('提交成功')
}
</script>
