<template>
    <!-- <n-card title="生产进度" class="w-full shadow-md">
      <n-steps :current="currentStep" size="large" status="process">
        <n-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
          :icon="step.icon"
        >
        </n-step>
      </n-steps>
      <div class="text-center mt-4 text-xl font-semibold">
        当前状态：{{ steps[currentStep]?.title }} {{ steps[currentStep]?.emoji || '' }}
      </div>
    </n-card> -->
    <template>
  <n-progress
    type="line" 
    :percentage="60"
    :indicator-placement="'inside'" 
    :status="'success'" 
    :processing="true"
  />
</template>
  </template>
  
  <script setup lang="ts">
     import { NProgress } from 'naive-ui'
//   import { NCard, NSteps, NStep } from 'naive-ui'
//   import { h } from 'vue'
//   import {
//     Truck,
//     Package,
//     Settings,
//     ClipboardCheck,
//     Brush,
//     Box,
//   } from '@vicons/tabler'
  
  // ✅ 从父组件接收 currentStep 参数
    defineProps<{
      currentStep: number
    }>()

//   const steps = [
//     { title: '下单', description: '客户已下单', icon: h(ClipboardCheck), emoji: '📝' },
//     { title: '物料准备', description: '准备原材料', icon: h(Box), emoji: '📦' },
//     { title: '加工', description: '进行生产加工', icon: h(Settings), emoji: '🛠️' },
//     { title: '表面处理', description: '喷涂/电镀等', icon: h(Brush), emoji: '🎨' },
//     { title: '包装', description: '产品打包中', icon: h(Package), emoji: '🎁' },
//     { title: '出货', description: '已安排发货', icon: h(Truck), emoji: '🚚' },
//   ]
  
  // 当前步骤从父组件或接口传入，这里默认设置为第 2 步（加工中）
  const currentStep = 2
  </script>
  
  <style scoped>
  .n-card {
    max-width: 800px;
    margin: auto;
    border-radius: 12px;
  }
  </style>
  