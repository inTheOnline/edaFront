import { defineStore } from "pinia";
import { ref } from "vue";
import { supplyApi } from "@/api/modules/buy/officeSupply";

// 页面待办和跨页面提醒共用同一份服务端结果。
export const useOfficeNoticeStore = defineStore("office-notice", () => {
  const count = ref(0);
  const latestId = ref(0);
  let pending: Promise<void> | undefined;
  function refresh() {
    if (pending) return pending;
    pending = supplyApi
      .requests({ pageNum: 1, pageSize: 1, status: "active" })
      .then(({ data }) => {
        count.value = data.total;
        latestId.value = data.records[0]?.id || 0;
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  }
  function reset() {
    count.value = 0;
    latestId.value = 0;
  }
  return { count, latestId, refresh, reset };
});
