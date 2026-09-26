import { computed, onActivated, onBeforeUnmount, onMounted, ref } from "vue";
import { getOrderAll, getOrderMater } from "@/api/modules/order";
import { getOrderOut } from "@/api/modules/orderOut";
import { useDictStore } from "@/stores/modules/dict";

export interface OrderLine {
  id: number;
  orderNum?: string;
  materNum?: string;
  materName?: string;
  custId?: number;
  cust?: string;
  localTime?: string;
  totalNumber?: number;
  alreadyNumber?: number;
  notAlreadyNumber?: number;
  remark?: string;
}

export interface Shipment {
  id: number;
  num?: string;
  orderNum?: string;
  number?: number;
  time?: string;
  status?: number;
}

const numberFormat = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 20 });
const pageParams = (pageNum: number, pageSize: number, filters: Record<string, unknown> = {}) => ({
  pageNum,
  pageSize,
  data: {},
  ...filters
});
export const quantity = (value?: number | null) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : numberFormat.format(Number(value));

export const progress = (row: OrderLine) => {
  const total = Number(row.totalNumber);
  const delivered = Number(row.alreadyNumber);
  if (
    row.totalNumber == null ||
    row.alreadyNumber == null ||
    !Number.isFinite(total) ||
    !Number.isFinite(delivered) ||
    total <= 0
  ) {
    return null;
  }
  return Math.round(Math.min(100, Math.max(0, (delivered / total) * 100)));
};

export function useOrderHome() {
  const dict = useDictStore();
  const rows = ref<OrderLine[]>([]);
  const shipments = ref<Shipment[]>([]);
  const counts = ref<(number | null)[]>([null, null, null, null]);
  const page = ref(1);
  const pageSize = 6;
  const total = ref(0);
  const keyword = ref("");
  const search = ref("");
  const showCompleted = ref(false);
  const refreshing = ref(false);
  const loading = ref(false);
  const listError = ref(false);
  const summaryError = ref(false);
  const shipmentError = ref(false);
  const updatedAt = ref("");
  let requestId = 0;
  let disposed = false;

  const metrics = computed(() => [
    { label: "订单总数", value: counts.value[0], note: "全部订单", unit: "单" },
    { label: "待交明细", value: counts.value[1], note: "未完成且仍有未交数量", unit: "条" },
    { label: "物料明细", value: counts.value[2], note: "含已完成明细", unit: "条" },
    { label: "出货记录", value: counts.value[3], note: "出货及客户退货明细", unit: "条" }
  ]);

  const customer = (row: OrderLine) => {
    if (row.cust) return row.cust;
    if (row.custId == null) return "—";
    const label = dict.getLabel("cust", row.custId);
    return label === row.custId ? `客户 #${row.custId}` : String(label);
  };

  async function loadRows() {
    const current = ++requestId;
    loading.value = true;
    listError.value = false;
    try {
      const { data } = await getOrderMater(
        pageParams(page.value, pageSize, {
          showCompleted: showCompleted.value,
          ...(search.value ? { orderNum: search.value } : {})
        })
      );
      if (disposed || current !== requestId) return;
      rows.value = data.records || [];
      total.value = Number(data.total) || 0;
      // 数据减少时回到最后一个有效页，避免出现空白分页。
      const lastPage = Math.max(1, Math.ceil(total.value / pageSize));
      if (page.value > lastPage) {
        page.value = lastPage;
        await loadRows();
      }
    } catch {
      if (!disposed && current === requestId) {
        rows.value = [];
        total.value = 0;
        listError.value = true;
      }
    } finally {
      if (!disposed && current === requestId) loading.value = false;
    }
  }

  async function loadSummary() {
    // 主表实体自带日期默认值，必须显式清空，才是全部订单。
    const [orders, pending, all, out, customers] = await Promise.allSettled([
      getOrderAll(pageParams(1, 1, { createTime: null, updateTime: null })),
      getOrderMater(pageParams(1, 1, { showCompleted: false })),
      getOrderMater(pageParams(1, 1, { showCompleted: true })),
      getOrderOut(pageParams(1, 5)),
      dict.loadDict("cust")
    ]);
    if (disposed) return;
    const results = [orders, pending, all, out];
    counts.value = results.map(result => (result.status === "fulfilled" ? Number(result.value.data.total) : null));
    summaryError.value = results.some(result => result.status === "rejected") || customers.status === "rejected";
    shipmentError.value = out.status === "rejected";
    shipments.value = out.status === "fulfilled" ? out.value.data.records || [] : [];
  }

  async function refresh() {
    if (refreshing.value) return;
    refreshing.value = true;
    try {
      await Promise.all([loadRows(), loadSummary()]);
    } catch {
      if (!disposed) summaryError.value = true;
    } finally {
      if (!disposed) {
        updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
        refreshing.value = false;
      }
    }
  }

  function applySearch() {
    search.value = keyword.value.trim();
    page.value = 1;
    void loadRows();
  }

  function changeMode(value: boolean) {
    showCompleted.value = value;
    page.value = 1;
    void loadRows();
  }

  function changePage(value: number) {
    page.value = value;
    void loadRows();
  }

  onMounted(refresh);
  onActivated(() => {
    if (updatedAt.value) void refresh();
  });
  onBeforeUnmount(() => {
    disposed = true;
    requestId++;
  });

  return {
    rows,
    shipments,
    metrics,
    page,
    pageSize,
    total,
    keyword,
    search,
    showCompleted,
    refreshing,
    loading,
    listError,
    summaryError,
    shipmentError,
    updatedAt,
    customer,
    refresh,
    loadRows,
    applySearch,
    changeMode,
    changePage
  };
}
