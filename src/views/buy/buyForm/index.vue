<template>
  <section class="office-page">
    <header class="office-heading">
      <div>
        <h1>办公用品</h1>
        <p>{{ manager ? "库存与领用管理" : "申请办公用品，查看领取进度" }}</p>
      </div>
      <el-button v-if="manager" @click="drawer?.open('supply')">新增用品</el-button>
    </header>
    <nav class="office-tabs" aria-label="办公用品功能">
      <button v-for="tab in tabs" :key="tab.key" :class="{ active: active === tab.key }" @click="switchTab(tab.key)">
        {{ tab.label }}<span v-if="tab.key === 'requests' && manager && todoCount">{{ todoCount }}</span>
      </button>
    </nav>
    <el-alert v-if="loadError" title="用品信息加载失败，请刷新重试" type="error" :closable="false" />
    <ProTable
      :key="active"
      ref="table"
      class="office-table"
      :columns="columns"
      :request-api="requestRows"
      :data-callback="pageData"
      :border="false"
      :tool-button="false"
      :virtualized="false"
      row-key="id"
    >
      <template #tableHeader>
        <div class="office-toolbar">
          <div class="filters">
            <template v-if="active === 'stock'">
              <el-input
                v-model="keyword"
                placeholder="搜索用品名称、规格"
                clearable
                aria-label="搜索用品"
                @keyup.enter="search"
                @clear="search"
              />
              <el-select v-model="category" clearable placeholder="全部分类" @change="search">
                <el-option v-for="value in categories" :key="value" :label="value" :value="value" />
              </el-select>
              <el-checkbox v-model="low" @change="search">仅库存不足</el-checkbox>
            </template>
            <el-select
              v-else-if="active !== 'flows'"
              v-model="status"
              multiple
              collapse-tags
              clearable
              placeholder="全部状态"
              @change="search"
            >
              <el-option v-for="value in statuses" :key="value" :label="value" :value="value" />
            </el-select>
            <template v-else>
              <el-select v-model="flowSupply" filterable clearable placeholder="全部用品" @change="search">
                <el-option
                  v-for="supply in supplies"
                  :key="supply.id"
                  :label="supply.name + ' ' + supply.spec"
                  :value="supply.id"
                />
              </el-select>
              <el-select v-if="manager" v-model="flowKind" clearable placeholder="全部出入库" @change="search">
                <el-option label="发放" value="发放" /><el-option label="入库" value="入库" />
              </el-select>
              <el-select v-if="manager" v-model="recipientId" clearable filterable placeholder="全部领取人" @change="search">
                <el-option
                  v-for="user in dict.dictMap.user || []"
                  :key="String(user.value)"
                  :label="String(user.label)"
                  :value="Number(user.value)"
                />
              </el-select>
            </template>
            <el-button @click="search">查询</el-button><el-button @click="refresh">刷新</el-button>
          </div>
          <div class="actions">
            <template v-if="active === 'stock' && manager">
              <el-button @click="drawer?.open('receipt')">入库登记</el-button>
              <el-button type="primary" @click="drawer?.open('issue')">发放登记</el-button>
            </template>
            <el-button v-if="active === 'requests'" type="primary" @click="drawer?.open('request')">新建请购</el-button>
            <el-button v-if="active === 'orders'" type="primary" @click="drawer?.open('order')">新建采购单</el-button>
          </div>
        </div>
      </template>
      <template #name="{ row }"
        ><div class="item-name">{{ row.name }}</div>
        <div class="item-spec">{{ row.spec || "—" }}</div></template
      >
      <template #stock="{ row }">
        <strong :class="{ low: Number(row.stock) <= Number(row.minimum) }">{{ row.stock }}</strong>
        <small v-if="Number(row.stock) <= Number(row.minimum)" class="low"> 库存不足</small>
      </template>
      <template #supplyId="{ row }">
        <div class="item-name">{{ supplyMap.get(row.supplyId)?.name || "#" + row.supplyId }}</div>
        <div class="item-spec">{{ supplyMap.get(row.supplyId)?.spec || "—" }}</div>
      </template>
      <template #status="{ row }"
        ><span class="status" :class="{ closed: row.status === '已取消' }">{{ row.status }}</span></template
      >
      <template #quantity="{ row }">{{ row.quantity }} {{ supplyMap.get(row.supplyId)?.unit }}</template>
      <template #lines="{ row }">
        <div v-for="line in (row.lines || []).slice(0, 2)" :key="line.supplyId" class="document-line">
          <span
            >{{ supplyMap.get(line.supplyId)?.name || "#" + line.supplyId }} × {{ line.quantity }}
            {{ supplyMap.get(line.supplyId)?.unit }}</span
          >
          <small>{{ active === "requests" ? "已领" : "已入库" }} {{ line.issued ?? line.received ?? 0 }}</small>
        </div>
        <small v-if="row.lines?.length > 2">另有 {{ row.lines.length - 2 }} 项，查看详情</small>
      </template>
      <template #amount="{ row }"
        >¥{{ (row.lines || []).reduce((sum, line) => sum + line.quantity * (line.unitPrice || 0), 0).toFixed(3) }}</template
      >
      <template #relation="{ row }">
        <el-button v-if="row.requestId" link type="primary" @click="drawer?.open('requestDetail', { id: row.requestId })"
          >请购 #{{ row.requestId }}</el-button
        >
        <el-button
          v-else-if="row.orderId && manager"
          link
          type="primary"
          @click="drawer?.open('orderDetail', { id: row.orderId })"
          >采购 #{{ row.orderId }}</el-button
        >
        <span v-else>{{ row.kind === "入库" ? "直接入库" : "直接发放" }}</span>
      </template>
      <template #operation="{ row }">
        <template v-if="active === 'stock'">
          <el-button v-if="manager" link type="primary" :disabled="Number(row.stock) <= 0" @click="drawer?.open('issue', row)"
            >发放</el-button
          >
          <el-button v-else link type="primary" @click="drawer?.open('request', row)">请购</el-button>
          <el-dropdown v-if="manager" trigger="click"
            ><el-button link>更多</el-button>
            <template #dropdown
              ><el-dropdown-menu>
                <el-dropdown-item @click="drawer?.open('supply', row)">编辑档案</el-dropdown-item>
                <el-dropdown-item @click="showFlows(row.id)">出入库记录</el-dropdown-item>
              </el-dropdown-menu></template
            >
          </el-dropdown>
        </template>
        <template v-else-if="active === 'requests'">
          <el-button link type="primary" @click="drawer?.open('requestDetail', row)">查看</el-button>
          <el-button v-if="manager && isOpen(row.status)" link type="primary" @click="drawer?.open('issue', undefined, row.id)"
            >发放</el-button
          >
          <el-dropdown v-if="isOpen(row.status)" trigger="click"
            ><el-button link>更多</el-button>
            <template #dropdown
              ><el-dropdown-menu>
                <el-dropdown-item v-if="manager && row.status === '待处理'" @click="markReady(row.id)"
                  >标记已通知领取</el-dropdown-item
                >
                <el-dropdown-item @click="cancelRequest(row.id)">取消剩余请购</el-dropdown-item>
              </el-dropdown-menu></template
            >
          </el-dropdown>
        </template>
        <template v-else-if="active === 'orders'">
          <el-button link type="primary" @click="drawer?.open('orderDetail', row)">查看</el-button>
          <el-dropdown v-if="row.status === '待入库'" trigger="click">
            <el-button link>更多</el-button>
            <template #dropdown
              ><el-dropdown-menu>
                <el-dropdown-item @click="drawer?.open('order', row)">编辑</el-dropdown-item>
                <el-dropdown-item @click="deleteOrder(row.id)">删除</el-dropdown-item>
              </el-dropdown-menu></template
            >
          </el-dropdown>
          <el-button v-if="row.status !== '已入库'" link type="primary" @click="drawer?.open('receipt', row)">到货入库</el-button>
        </template>
      </template>
      <template #empty
        ><div class="office-empty">
          暂无{{ active === "stock" ? "用品" : "记录" }}
          <p>登记后将在这里显示。</p>
        </div></template
      >
      <template #pagination>
        <el-pagination
          v-if="table"
          :current-page="table.pageable.pageNum"
          :page-size="table.pageable.pageSize"
          :total="table.pageable.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="table.handleSizeChange"
          @current-change="table.handleCurrentChange"
        />
      </template>
    </ProTable>
    <SupplyDrawer ref="drawer" :supplies="supplies" @saved="refresh" />
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import SupplyDrawer from "./components/SupplyDrawer.vue";
import { supplyApi, type Supply, type SupplyPage } from "@/api/modules/buy/officeSupply";
import { useAuthStore } from "@/stores/modules/auth";
import { useDictStore } from "@/stores/modules/dict";
import { useOfficeNoticeStore } from "@/stores/modules/officeNotice";
type Tab = "stock" | "requests" | "orders" | "flows";
const auth = useAuthStore();
const dict = useDictStore();
const manager = computed(() => auth.isExistence("buy:purchase"));
const active = ref<Tab>(manager.value ? "stock" : "requests");
const table = ref<InstanceType<typeof ProTable>>();
const drawer = ref<InstanceType<typeof SupplyDrawer>>();
const supplies = ref<Supply[]>([]);
const loadError = ref(false);
const keyword = ref("");
const category = ref("");
const low = ref(false);
const status = ref<string[]>([]);
const flowSupply = ref<number>();
const flowKind = ref("");
const recipientId = ref<number>();
const notice = useOfficeNoticeStore();
const route = useRoute();
const todoCount = computed(() => notice.count);
watch(
  () => route.query.tab,
  (value) => {
    if (value === "requests") switchTab("requests");
  },
  { immediate: true },
);
const tabs = computed(() => [
  { key: "stock" as Tab, label: "用品库存" },
  { key: "requests" as Tab, label: manager.value ? "请购管理" : "我的请购" },
  ...(manager.value ? [{ key: "orders" as Tab, label: "采购入库" }] : []),
  { key: "flows" as Tab, label: manager.value ? "领用记录" : "我的领用" },
]);
const userName = (id?: number) => (id ? String(dict.getLabel("user", id) || id) : "—");
const supplyMap = computed(() => new Map(supplies.value.map((row) => [row.id, row])));
const categories = computed(() => [...new Set(supplies.value.map((row) => row.category).filter(Boolean))].sort());
const statuses = computed(() =>
  active.value === "requests" ? ["待处理", "待领取", "部分发放", "已完成", "已取消"] : ["待入库", "部分入库", "已入库"],
);
async function deleteOrder(id: number) {
  try {
    await ElMessageBox.confirm(`确认删除未入库采购单 #${id}？`, "删除采购单", { type: "warning" });
    await supplyApi.deleteOrder(id);
    await refresh();
  } catch {
    // 取消时保留单据，接口错误由全局拦截器提示。
  }
}
const isOpen = (value: string) => ["待处理", "待领取", "部分发放"].includes(value);
const dateText = (value: string) => value?.replace("T", " ") || "—";
const columns = computed<ColumnProps[]>(() => {
  const operation: ColumnProps = { prop: "operation", label: "操作", width: 190, align: "left" };
  if (active.value === "stock")
    return [
      { prop: "name", label: "用品名称 / 规格", minWidth: 240, align: "left" },
      { prop: "unit", label: "单位", width: 80, align: "left" },
      { prop: "stock", label: "当前库存", width: 150, align: "left" },
      { prop: "category", label: "分类", width: 130, align: "left" },
      { prop: "location", label: "存放位置", minWidth: 130, align: "left" },
      operation,
    ];
  if (active.value === "requests")
    return [
      { prop: "id", label: "请购单号", width: 100 },
      { prop: "userId", label: "请购人", width: 110, render: ({ row }) => userName(row.userId) },
      { prop: "lines", label: "用品 / 领取进度", minWidth: 260, align: "left" },
      { prop: "purpose", label: "用途", minWidth: 180, align: "left" },
      { prop: "createdTime", label: "申请时间", width: 175, render: ({ row }) => dateText(row.createdTime) },
      { prop: "status", label: "状态", width: 110 },
      operation,
    ];
  if (active.value === "orders")
    return [
      { prop: "id", label: "采购单号", width: 100 },
      { prop: "supplier", label: "供应商 / 平台", minWidth: 200, align: "left" },
      { prop: "lines", label: "用品 / 入库进度", minWidth: 240, align: "left" },
      { prop: "amount", label: "采购金额", width: 130 },
      { prop: "buyDate", label: "采购日期", width: 130 },
      { prop: "userId", label: "采购人", width: 110, render: ({ row }) => userName(row.userId) },
      { prop: "status", label: "入库状态", width: 120 },
      { prop: "remark", label: "备注", minWidth: 150, align: "left" },
      operation,
    ];
  return [
    { prop: "createdTime", label: "登记时间", width: 175, render: ({ row }) => dateText(row.createdTime) },
    { prop: "supplyId", label: "用品名称 / 规格", minWidth: 180, align: "left" },
    { prop: "kind", label: "类型", width: 75 },
    { prop: "quantity", label: "数量", width: 100 },
    { prop: "recipientId", label: "领取人", width: 100, render: ({ row }) => userName(row.recipientId) },
    { prop: "purpose", label: "用途 / 说明", minWidth: 180, align: "left" },
    { prop: "relation", label: "关联单据", width: 120 },
    { prop: "userId", label: "经办人", width: 100, render: ({ row }) => userName(row.userId) },
    ...(manager.value ? [{ prop: "balance", label: "变动后库存", width: 110 }] : []),
  ];
});
const pageData = (data: SupplyPage<unknown>) => ({ list: data.records, total: data.total });
const requestRows = (params: { pageNum: number; pageSize: number }) => {
  const page = { pageNum: params.pageNum, pageSize: params.pageSize };
  if (active.value === "stock")
    return supplyApi.stock({ ...page, keyword: keyword.value, category: category.value, low: low.value });
  if (active.value === "requests") return supplyApi.requests({ ...page, status: status.value.join(",") });
  if (active.value === "orders") return supplyApi.orders({ ...page, status: status.value.join(",") });
  return supplyApi.flows({ ...page, supplyId: flowSupply.value, kind: flowKind.value, recipientId: recipientId.value });
};
function switchTab(tab: Tab) {
  status.value = [];
  active.value = tab;
}
function search() {
  table.value?.search();
}
async function showFlows(id: number) {
  flowSupply.value = id;
  switchTab("flows");
  await nextTick();
  search();
}
async function loadOptions() {
  try {
    const { data } = await supplyApi.options();
    supplies.value = data;
    loadError.value = false;
  } catch {
    loadError.value = true;
  }
}
async function loadTodo() {
  if (!manager.value) return;
  try {
    await notice.refresh();
  } catch {
    /* 接口错误统一提示，不用分页数量代替真实待办。 */
  }
}
async function refresh() {
  await Promise.all([loadOptions(), loadTodo()]);
  table.value?.getTableList();
}
async function markReady(id: number) {
  try {
    await ElMessageBox.confirm("确认已在线下通知员工领取？标记后不预留、不扣减库存。", "标记待领取");
    await supplyApi.ready(id);
    await refresh();
  } catch {
    /* 用户取消或接口错误由公共拦截器处理。 */
  }
}
async function cancelRequest(id: number) {
  try {
    const { value } = await ElMessageBox.prompt("请填写取消原因，已发放记录会保留。", "取消剩余请购", {
      inputValidator: (value) => !!value?.trim() || "请填写原因",
    });
    await supplyApi.cancel(id, value);
    await refresh();
  } catch {
    /* 用户取消或接口错误由公共拦截器处理。 */
  }
}
onMounted(async () => {
  await Promise.all([dict.loadDicts(["user"]), loadOptions(), loadTodo()]);
});
</script>
<style scoped lang="scss">
.office-page {
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 24px 28px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.document-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  line-height: 1.8;
}
.document-line small {
  color: var(--el-text-color-secondary);
}
.office-heading {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
}
.office-heading h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.office-heading p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.office-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 28px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;
}
.office-tabs button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 14px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  white-space: nowrap;
}
.office-tabs button.active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
  font-weight: 600;
}
.office-tabs button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.office-tabs span {
  padding: 1px 6px;
  font-size: 12px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.office-table {
  flex: 1;
  min-height: 0;
}
.office-table :deep(.table-main) {
  padding: 0;
  border: 0;
  box-shadow: none;
}
.office-table :deep(.header-button-lf) {
  width: 100%;
}
.office-table :deep(.table-header) {
  margin-bottom: 16px;
}
.office-table :deep(.el-table th.el-table__cell) {
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-weight: 500;
  height: 42px;
}
.office-table :deep(.el-table td.el-table__cell) {
  padding: 13px 0;
}
.office-table :deep(.el-table .cell) {
  padding: 0 14px;
}
.office-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;
}
.filters,
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filters :deep(.el-input) {
  width: 220px;
}
.filters :deep(.el-select) {
  width: 155px;
}
.item-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.item-spec {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
strong {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.low {
  color: var(--el-color-warning);
}
.status {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.status.closed {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.el-dropdown {
  margin-left: 12px;
  vertical-align: middle;
}
.office-empty {
  padding: 50px 20px;
  color: var(--el-text-color-regular);
}
.office-empty p {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .office-page {
    padding: 16px;
  }
  .office-tabs {
    gap: 20px;
    overflow-x: auto;
  }
}
</style>
