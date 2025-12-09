<template>
  <div class="grid grid-cols-[240px_1fr] gap-4 h-full p-4">
    <!-- 左侧角色列表 -->
    <Card class="h-full overflow-hidden">
      <CardContent class="p-2">
        <div class="text-lg font-bold mb-3">角色列表</div>
        <div class="flex flex-col gap-1 overflow-auto h-[calc(100%-40px)]">
          <div
            v-for="role in roles"
            :key="role.id"
            class="w-full"
          >
            <Button
              :variant="currentRole?.id === role.id ? 'default' : 'ghost'"
              class="justify-start w-full"
              @click="selectRole(role)"
            >
              {{ role.name }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 右侧权限编辑部分 -->
    <transition name="slide-fade" mode="out-in">
      <div :key="currentRole?.id || 'empty'" class="h-full">
        <Card class="h-full">
          <CardContent class="p-4">
            <div class="flex items-center gap-2 mb-4">
              <ChevronRight />
              <div class="text-xl font-semibold">权限编辑</div>
              <div v-if="currentRole" class="text-gray-500 ml-2">
                （{{ currentRole.name }}）
              </div>
            </div>

            <div v-if="!currentRole" class="text-gray-500 text-sm">
              请选择左侧角色
            </div>

            <div
              v-else
              class="overflow-auto h-[calc(100%-40px)] pr-2"
            >
              <div v-for="item in permissions" :key="item.id">
                <TreeItem
                  :item="item"
                  :value="value"
                  @toggle="togglePermission"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-vue-next";
import TreeItem from "./TreeItem.vue";

const props = defineProps({
  roles: { type: Array, default: () => [] },
  permissions: { type: Array, default: () => [] },
  value: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:value"]);

const currentRole = ref(null);

const selectRole = (role) => {
  currentRole.value = role;
};

const togglePermission = (id) => {
  const newValue = props.value.includes(id)
    ? props.value.filter((x) => x !== id)
    : [...props.value, id];
  emit("update:value", newValue);
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.96);
}
</style>