<template>
  <main class="order-home">
    <header v-if="!canViewPrice" class="home-header">
      <div>
        <h1>订单首页</h1>
        <p>{{ canViewPrice ? "掌握营业额、客户结构与交付情况。" : "集中查看订单与出货，快速进入日常业务。" }}</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" :loading="refreshing" @click="refresh">刷新</el-button>
        <el-button type="primary" :icon="Document" :disabled="!canOpen('orderTable')" @click="openPage('orderTable')">
          订单管理
        </el-button>
      </div>
    </header>

    <RevenueOverview v-if="canViewPrice" @refresh="refresh" />
    <el-alert v-if="summaryError" type="warning" :closable="false" show-icon title="部分概览数据加载失败，点击刷新重试。" />

    <section class="overview" aria-label="订单概览" :aria-busy="refreshing">
      <article v-for="(metric, index) in metrics" :key="metric.label" class="metric" :class="{ 'metric-pending': index === 1 }">
        <span class="metric-label">{{ metric.label }}</span>
        <div class="metric-value">
          <strong>{{ quantity(metric.value) }}</strong
          ><span v-if="metric.value !== null">{{ metric.unit }}</span>
        </div>
        <small>{{ metric.note }}</small>
      </article>
    </section>

    <div class="workspace">
      <section class="panel orders-panel" aria-labelledby="orders-title">
        <header class="panel-header">
          <div>
            <h2 id="orders-title">{{ showCompleted ? "全部订单明细" : "待交订单明细" }}</h2>
            <p>按明细录入顺序倒序，查看每项交付进度</p>
          </div>
          <el-radio-group
            :model-value="showCompleted"
            aria-label="明细范围"
            :disabled="loading"
            @change="changeMode(Boolean($event))"
          >
            <el-radio-button :value="false">待交</el-radio-button>
            <el-radio-button :value="true">全部</el-radio-button>
          </el-radio-group>
        </header>

        <form class="search-bar" @submit.prevent="applySearch">
          <label for="order-home-search">订单编号</label>
          <el-input
            id="order-home-search"
            v-model="keyword"
            :prefix-icon="Search"
            placeholder="输入订单编号"
            clearable
            @clear="applySearch"
          />
          <el-button type="primary" native-type="submit" :loading="loading">搜索</el-button>
        </form>

        <div v-if="listError" class="list-error" role="alert">
          <el-empty description="订单明细加载失败"><el-button @click="loadRows">重新加载</el-button></el-empty>
        </div>
        <div v-else v-loading="loading" class="table-region" :aria-busy="loading">
          <el-table
            :data="rows"
            row-key="id"
            class="order-table"
            stripe
            :empty-text="loading ? '正在加载…' : search ? '没有找到匹配的订单' : showCompleted ? '暂无订单明细' : '暂无待交明细'"
          >
            <el-table-column label="订单 / 物料" min-width="210">
              <template #default="{ row }">
                <div class="order-cell">
                  <strong>{{ row.orderNum || "—" }}</strong
                  ><span :title="`${row.materNum || ''} ${row.materName || ''}`">{{
                    [row.materName, row.materNum].filter(Boolean).join(" · ") || "—"
                  }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="客户" min-width="125" show-overflow-tooltip>
              <template #default="{ row }">{{ customer(row) }}</template>
            </el-table-column>
            <el-table-column label="交付进度" min-width="170">
              <template #default="{ row }">
                <div class="delivery">
                  <div>
                    <span>{{ quantity(row.alreadyNumber) }} / {{ quantity(row.totalNumber) }}</span
                    ><small>{{ progress(row) === null ? "—" : `${progress(row)}%` }}</small>
                  </div>
                  <el-progress v-if="progress(row) !== null" :percentage="progress(row)!" :show-text="false" :stroke-width="5" />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="未交数量" min-width="105" align="right">
              <template #default="{ row }"
                ><span class="remaining">{{ quantity(row.notAlreadyNumber) }}</span></template
              >
            </el-table-column>
            <el-table-column label="操作" width="76" align="right" fixed="right">
              <template #default="{ row }"
                ><el-button
                  type="primary"
                  link
                  :aria-label="`查看 ${row.orderNum || ''} ${row.materName || row.materNum || ''} 明细`"
                  @click="selected = row"
                  >查看</el-button
                ></template
              >
            </el-table-column>
          </el-table>
        </div>

        <footer class="table-footer">
          <span>{{ listError ? "加载失败" : `共 ${quantity(total)} 条明细` }}</span>
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            :disabled="loading || listError"
            :pager-count="5"
            layout="prev, pager, next"
            background
            @current-change="changePage"
          />
        </footer>
      </section>

      <aside class="side-panels">
        <section class="panel shortcuts" aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title">常用入口</h2>
          <button
            v-for="item in shortcuts"
            :key="item.name"
            class="shortcut"
            type="button"
            :disabled="!canOpen(item.name)"
            @click="openPage(item.name)"
          >
            <span class="shortcut-icon"
              ><el-icon aria-hidden="true"><component :is="item.icon" /></el-icon
            ></span>
            <span class="shortcut-copy"
              ><strong>{{ item.title }}</strong
              ><small>{{ canOpen(item.name) ? item.note : "暂无页面访问权限" }}</small></span
            >
            <el-icon aria-hidden="true"><ArrowRight /></el-icon>
          </button>
        </section>

        <section class="panel shipments" aria-labelledby="shipments-title" :aria-busy="refreshing">
          <header class="shipment-heading">
            <h2 id="shipments-title">最新出货</h2>
            <span>最近 5 条记录</span>
          </header>
          <el-empty v-if="shipmentError" description="出货记录加载失败" :image-size="65" />
          <el-empty v-else-if="!shipments.length" :description="refreshing ? '正在加载…' : '暂无出货记录'" :image-size="65" />
          <ul v-else class="shipment-list">
            <li v-for="item in shipments" :key="item.id">
              <span class="shipment-icon" :class="{ 'is-return': Number(item.status) === 2 }"
                ><el-icon aria-hidden="true"><RefreshLeft v-if="Number(item.status) === 2" /><Van v-else /></el-icon
              ></span>
              <div class="shipment-copy">
                <strong :title="item.num">{{ item.num || "未填写单号" }}</strong
                ><small>{{ item.time || "—" }}</small>
              </div>
              <div class="shipment-quantity">
                <strong>{{ quantity(item.number) }}</strong
                ><small>{{ Number(item.status) === 2 ? "客户退货" : "出货数量" }}</small>
              </div>
            </li>
          </ul>
          <p class="shipment-note">退货以负数记录，数量保留原始值。</p>
        </section>
      </aside>
    </div>
    <footer class="home-footer">
      <span>概览统计全部记录，不随明细搜索变化。</span
      ><span v-if="updatedAt">{{ summaryError || listError ? "最近刷新尝试" : "更新于" }} {{ updatedAt }}</span>
    </footer>

    <el-dialog
      :model-value="Boolean(selected)"
      title="订单明细"
      width="600px"
      class="order-home-detail"
      @update:model-value="selected = undefined"
    >
      <template v-if="selected">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ selected.orderNum || "—" }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ customer(selected) }}</el-descriptions-item>
          <el-descriptions-item label="物料"
            >{{ selected.materNum || "—" }} · {{ selected.materName || "—" }}</el-descriptions-item
          >
          <el-descriptions-item label="创建时间">{{ selected.localTime || "—" }}</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ quantity(selected.totalNumber) }}</el-descriptions-item>
          <el-descriptions-item label="已交数量">{{ quantity(selected.alreadyNumber) }}</el-descriptions-item>
          <el-descriptions-item label="未交数量">{{ quantity(selected.notAlreadyNumber) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selected.remark || "—" }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer><el-button @click="selected = undefined">关闭</el-button></template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts" name="orderHome">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowRight, Box, Document, Refresh, RefreshLeft, Search, Van } from "@element-plus/icons-vue";
import { type OrderLine, progress, quantity, useOrderHome } from "./home";
import { useAuthStore } from "@/stores/modules/auth";
import RevenueOverview from "./components/RevenueOverview.vue";

const router = useRouter();
const auth = useAuthStore();
const canViewPrice = computed(() => auth.isExistence("price:view"));
const selected = ref<OrderLine>();
const {
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
  changePage,
} = useOrderHome();
const shortcuts = [
  { name: "orderTable", title: "订单管理", note: "维护订单与快速请购", icon: Document },
  { name: "orderMater", title: "物料明细", note: "查看物料与交付数量", icon: Box },
  { name: "orderOut", title: "出货与退货", note: "登记出货和客户退货", icon: Van },
];
const canOpen = (name: string) => router.hasRoute(name);
const openPage = (name: string) => {
  if (canOpen(name)) void router.push({ name });
};
</script>

<style scoped lang="scss">
.order-home {
  --home-surface: var(--el-bg-color, #fff);
  --home-text: var(--el-text-color-primary, #1f2937);
  --home-muted: var(--el-text-color-regular, #606266);
  --home-line: var(--el-border-color-lighter, #e5e7eb);
  --home-soft: var(--el-fill-color-light, #f5f7fa);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  padding: 12px 8px 24px;
  overflow: auto;
  color: var(--home-text);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  > * {
    flex-shrink: 0;
  }
  h1,
  h2,
  p {
    margin: 0;
  }
  h1 {
    font-size: 28px;
    font-weight: 650;
    letter-spacing: 1px;
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
  }
  p {
    color: var(--home-muted);
    line-height: 1.6;
  }
  small {
    font-size: 12px;
    color: var(--home-muted);
  }
  :deep(.el-button),
  :deep(.el-input__wrapper) {
    min-height: 38px;
  }
  :deep(.el-button.is-link) {
    min-width: 44px;
  }
  :deep(.el-button:focus-visible),
  button:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}
.home-header,
.header-actions,
.panel-header,
.table-footer,
.shipment-heading,
.home-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.home-header {
  padding: 4px 0 6px;
  p {
    margin-top: 9px;
  }
}
.header-actions {
  gap: 10px;
  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
.overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 24px 0;
}
.overview,
.panel {
  border: 1px solid var(--home-line);
  border-radius: 10px;
  background: var(--home-surface);
}
.metric {
  padding: 0 26px;
  border-right: 1px solid var(--home-line);
  &:last-child {
    border: 0;
  }
}
.metric-label {
  font-size: 14px;
  font-weight: 550;
}
.metric-value {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 14px 0 8px;
  strong {
    font-size: 32px;
    font-weight: 650;
    line-height: 1.2;
  }
  > span {
    font-size: 12px;
    color: var(--home-muted);
  }
}
.metric-pending .metric-value strong {
  color: var(--el-color-primary);
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 20px;
  align-items: start;
}
.orders-panel {
  min-width: 0;
  padding: 22px;
}
.panel-header {
  align-items: start;
  flex-wrap: wrap;
  p {
    margin-top: 7px;
    font-size: 12px;
  }
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 16px;
  label {
    white-space: nowrap;
    color: var(--home-muted);
  }
  :deep(.el-input) {
    max-width: 310px;
  }
}
.table-region,
.list-error {
  min-height: 480px;
}
.order-table {
  --el-table-header-bg-color: var(--home-soft);
  font-size: 14px;
  :deep(th.el-table__cell) {
    padding: 12px 0;
    font-weight: 500;
  }
  :deep(td.el-table__cell) {
    padding: 13px 0;
  }
  :deep(.el-table__empty-block) {
    min-height: 430px;
  }
}
.order-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  strong {
    font-weight: 600;
  }
  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    font-size: 11px;
  }
}
.delivery {
  max-width: 200px;
  > div:first-child {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 9px;
  }
  small {
    font-size: 11px;
  }
}
.remaining {
  font-weight: 600;
}
.table-footer {
  margin-top: 18px;
  color: var(--home-muted);
  font-size: 12px;
  flex-wrap: wrap;
}
.side-panels {
  display: grid;
  gap: 18px;
}
.shortcuts,
.shipments {
  padding: 20px;
}
.shortcuts h2 {
  margin-bottom: 8px;
}
.shortcut {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border: 0;
  border-bottom: 1px solid var(--home-line);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background-color 160ms ease;
  &:last-child {
    border: 0;
    padding-bottom: 2px;
  }
  &:hover:not(:disabled) {
    background: var(--home-soft);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  > .el-icon {
    font-size: 13px;
  }
}
.shortcut-icon {
  display: grid;
  flex: 0 0 42px;
  height: 44px;
  place-items: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  font-size: 23px;
}
.shortcut-copy {
  display: grid;
  flex: 1;
  gap: 5px;
  strong {
    font-weight: 550;
  }
  small {
    line-height: 1.5;
  }
}
.shipment-heading {
  gap: 8px;
  > span {
    font-size: 11px;
    color: var(--home-muted);
  }
}
.shipment-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 0;
    border-bottom: 1px solid var(--home-line);
    &:last-child {
      border: 0;
    }
  }
}
.shipment-icon {
  display: grid;
  flex: 0 0 30px;
  height: 32px;
  place-items: center;
  background: var(--home-soft);
  border-radius: 6px;
  color: var(--home-muted);
  font-size: 17px;
  &.is-return {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-9);
  }
}
.shipment-copy,
.shipment-quantity {
  display: grid;
  gap: 5px;
  min-width: 0;
  strong {
    font-size: 12px;
    font-weight: 550;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    font-size: 11px;
  }
}
.shipment-copy {
  flex: 1;
}
.shipment-quantity {
  text-align: right;
}
.shipment-note {
  margin-top: 10px !important;
  padding-top: 12px;
  border-top: 1px solid var(--home-line);
  font-size: 11px;
}
.home-footer {
  color: var(--home-muted);
  font-size: 12px;
  flex-wrap: wrap;
}
:global(.order-home-detail) {
  max-width: calc(100vw - 32px);
}
@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .side-panels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .order-home {
    gap: 14px;
    padding: 8px 0 20px;
  }
  .home-header {
    align-items: start;
    flex-direction: column;
  }
  .home-header h1 {
    font-size: 25px;
  }
  .overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0;
  }
  .metric {
    padding: 20px;
    border-bottom: 1px solid var(--home-line);
    &:nth-child(2) {
      border-right: 0;
    }
    &:nth-child(3) {
      border-bottom: 0;
    }
  }
  .metric-value strong {
    font-size: 28px;
  }
  .side-panels {
    grid-template-columns: minmax(0, 1fr);
  }
  .orders-panel,
  .shortcuts,
  .shipments {
    padding: 16px;
  }
  .search-bar {
    flex-wrap: wrap;
    label {
      flex: 0 0 100%;
    }
    :deep(.el-input) {
      flex: 1;
      min-width: 0;
    }
  }
  .table-footer {
    justify-content: center;
  }
  .order-home :deep(.el-button) {
    min-height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .shortcut {
    transition: none;
  }
}
</style>
