<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormProps, DrawerProps } from './type/type'

const props = defineProps<{
  model: Record<string, any>
  fields: FormProps[]
  api: (data: any) => Promise<any>
  idKey?: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const handleSubmit = async () => {
  try {
    loading.value = true
    await formRef.value?.validate()
    const data = await props.api(props.model)
    ElMessage.success(props.label ? `${props.label}成功` : '操作成功')
    emit('success')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as any).message || '提交失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="fields.reduce((acc, cur) => {
      if (cur.required) {
        acc[cur.prop] = [
          {
            required: true,
            message: `${cur.label}不能为空`,
            trigger: 'blur',
          },
        ]
      }
      return acc
    }, {} as Record<string, any>)"
    label-width="100px"
  >
    <el-form-item
      v-for="item in fields"
      :key="item.prop"
      :label="item.label"
      :prop="item.prop"
    >
      <component
        :is="item.component || 'el-input'"
        v-model="model[item.prop]"
        v-bind="item.componentProps"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.el-form {
  padding: 20px;
}
</style>
