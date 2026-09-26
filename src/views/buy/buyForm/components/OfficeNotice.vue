<template><span v-if="false" /></template>
<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElNotification } from "element-plus";
import { useAuthStore } from "@/stores/modules/auth";
import { useUserStore } from "@/stores/modules/user";
import { useOfficeNoticeStore } from "@/stores/modules/officeNotice";
const auth = useAuthStore();
const user = useUserStore();
const notice = useOfficeNoticeStore();
const router = useRouter();
let timer: ReturnType<typeof setInterval> | undefined;
let seen = 0;
let active = false;
async function check() {
  if (!active || document.hidden) return;
  try {
    await notice.refresh();
    if (!active) return;
    if (notice.latestId > seen && notice.count) {
      seen = notice.latestId;
      ElNotification({
        title: "办公用品请领通知",
        message: "有 " + notice.count + " 张请购单待处理，点击查看。",
        type: "info",
        duration: 10000,
        onClick: () => {
          const route = auth.flatMenuListGet.find((row) => String(row.component || "").includes("buy/buyForm"));
          if (route) void router.push({ path: route.path, query: { tab: "requests" } });
        },
      });
    }
  } catch {
    /* 请求失败由接口层处理；下一轮恢复后继续获取待办。 */
  }
}
function stop() {
  active = false;
  if (timer) clearInterval(timer);
  timer = undefined;
}
watch(
  () => [user.token, auth.userInfo.id, auth.isExistence("buy:purchase")],
  () => {
    stop();
    seen = 0;
    notice.reset();
    if (!user.token || !auth.isExistence("buy:purchase")) return;
    active = true;
    void check();
    timer = setInterval(check, 30000);
  },
  { immediate: true },
);
onUnmounted(stop);
</script>
