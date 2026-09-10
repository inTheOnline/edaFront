<template>
  <el-tooltip :content="text" :disabled="!overflowing" placement="top">
    <span ref="textRef" class="overflow-text" @mouseenter="updateOverflow">{{ text }}</span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ text: string }>();
const textRef = ref<HTMLElement>();
const overflowing = ref(false);
const updateOverflow = () => {
  const element = textRef.value;
  overflowing.value = !!element && element.scrollWidth > element.clientWidth;
};
const resizeObserver = new ResizeObserver(updateOverflow);

onMounted(async () => {
  await nextTick();
  updateOverflow();
  if (textRef.value) resizeObserver.observe(textRef.value);
});
watch(() => props.text, () => nextTick(updateOverflow));
onBeforeUnmount(() => resizeObserver.disconnect());
</script>

<style scoped lang="scss">
.overflow-text{display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>
