<template>
  <div>
    <h2>生成二维码</h2>
    <!-- 文本输入框，用于输入二维码内容 -->
    <input v-model="qrContent" placeholder="输入二维码内容" />
    <!-- 二维码的容器 -->
    <canvas ref="qrcodeContainer" class="qrcode-container"></canvas>
    <button @click="generateQRCode">生成二维码</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import QRCode from 'qrcode'

// 用ref来引用容器
const qrcodeContainer = ref(null)
// 用ref来管理二维码的内容
const qrContent = ref('https://example.com')

// 生成二维码的方法
const generateQRCode = () => {
  // 清空之前的二维码（如果有的话）
  qrcodeContainer.value.innerHTML = '';
  // 使用qrcode.js生成二维码
  QRCode.toCanvas(qrcodeContainer.value, qrContent.value, {
    width: 200,              // 二维码的宽度
    color: {
      dark: '#000000',       // 二维码的颜色
      light: '#ffffff'       // 背景颜色
    },
    errorCorrectionLevel: 'H' // 错误校正级别
  }, function (error) {
    if (error) {
      console.error(error);
    } else {
      console.log('二维码生成成功');
    }
  });
}

// 在组件挂载时生成二维码
onMounted(() => {
  generateQRCode(); // 自动生成二维码
});

// 监听qrContent的变化，实时生成二维码
watch(qrContent, () => {
  generateQRCode();
});
</script>

<style scoped>
.qrcode-container {
  margin-top: 20px;
}
</style>
