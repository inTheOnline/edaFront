<template>
  <div class="purchase-workbench">
    <section class="hero">
      <div class="hero-main">
        <p class="hero-eyebrow">Buy Center / Request Board</p>
        <h1>请购记录</h1>
        <span>统一跟踪请购、审核、采购、领取和取消流程</span>
      </div>
      <div class="hero-actions">
        <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">申请请购</el-button>
        <el-button
          v-if="canPurchase"
          type="success"
          :icon="ShoppingCart"
          plain
          @click="openBatchPurchaseByTop"
        >
          批量采购录入
        </el-button>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card audit">
        <p>待审核</p>
        <strong>{{ stats.pendingAudit }}</strong>
      </article>
      <article class="summary-card reject">
        <p>已驳回</p>
        <strong>{{ stats.rejected }}</strong>
      </article>
      <article class="summary-card purchase">
        <p>待采购</p>
        <strong>{{ stats.pendingPurchase }}</strong>
      </article>
      <article class="summary-card done">
        <p>已完成</p>
        <strong>{{ stats.finished }}</strong>
      </article>
    </section>

    <section class="visual-layout">
      <div class="kanban-wrap">
        <div v-for="lane in lanes" :key="lane.status" class="lane">
          <header>
            <span class="dot" :style="{ backgroundColor: lane.color }" />
            <h3>{{ lane.status }}</h3>
            <em>{{ lane.list.length }}</em>
          </header>
          <div class="lane-body">
            <div v-if="lane.list.length" v-for="card in lane.list.slice(0, 4)" :key="getRowId(card)" class="lane-card">
              <p class="card-title">{{ card.itemName || "未命名物品" }}</p>
              <div class="card-meta">
                <span>请购人：{{ getUserLabel(card.applyUserId) }}</span>
                <span>操作人：{{ getUserLabel(card.userId) }}</span>
                <span>数量：{{ card.itemNumber || 0 }}</span>
              </div>
              <div class="card-foot">
                <el-tag size="small" :type="Number(card.fast || 0) === 1 ? 'danger' : 'info'">
                  {{ Number(card.fast || 0) === 1 ? "加急" : "普通" }}
                </el-tag>
                <span>{{ card.expectedDate || "-" }}</span>
              </div>
            </div>
            <div v-else class="lane-empty">暂无记录</div>
          </div>
        </div>
      </div>

      <aside class="timeline-wrap">
        <header>
          <h3>最近动态</h3>
          <span>按更新时间排序</span>
        </header>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in timelineList"
            :key="`${getRowId(item)}-${index}`"
            :timestamp="item.updatedTime || item.createdTime || '-'"
            placement="top"
          >
            <div class="timeline-item">
              <strong>{{ item.itemName || "未命名物品" }}</strong>
              <p>
                状态：<span :class="statusClassMap[item.status || '待审核']">{{ item.status || "待审核" }}</span>
              </p>
              <p>请购人：{{ getUserLabel(item.applyUserId) }} · 操作人：{{ getUserLabel(item.userId) }}</p>
            </div>
          </el-timeline-item>
          <div v-if="!timelineList.length" class="timeline-empty">暂无动态</div>
        </el-timeline>
      </aside>
    </section>

    <ProTable
      class="purchase-table"
      :columns="columns"
      :request-api="requestApi"
      :dataCallback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'setting', 'search']"
      row-key="id"
      title="请购记录列表"
      ref="proTableRef"
      striped
      :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
    >
      <template #tableHeader="scope">
        <el-button v-if="canPurchase" type="success" :icon="ShoppingCart" plain @click="openBatchPurchase(scope.selectedListIds)">
          批量采购录入
        </el-button>

        <el-button
          v-if="canPurchase"
          type="warning"
          :icon="Delete"
          plain
          @click="deleteSelected(scope.selectedListIds)"
          :disabled="!scope.isSelected"
        >
          批量删除
        </el-button>
      </template>

      <template #filePreview="{ row }">
        <el-image
          v-if="row.fileUrl"
          :src="row.fileUrl"
          :preview-src-list="[row.fileUrl]"
          fit="cover"
          class="thumb-img"
        />
        <span v-else>无</span>
      </template>

      <template #statusTag="{ row }">
        <el-tag :class="['status-tag', statusClassMap[row.status || '待审核']]" effect="dark" disable-transitions>
          {{ row.status || "待审核" }}
        </el-tag>
      </template>

      <template #operation="scope">
        <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>

        <el-button
          type="primary"
          link
          :icon="EditPen"
          @click="openDrawer('编辑', scope.row)"
          v-if="canEditRow(scope.row)"
        >
          编辑
        </el-button>

        <el-button
          v-if="canAudit && canPassAudit(scope.row)"
          type="success"
          link
          :icon="Select"
          @click="passRecord(scope.row)"
        >
          通过
        </el-button>

        <el-button
          v-if="canAudit && canReject(scope.row)"
          type="danger"
          link
          :icon="CloseBold"
          @click="rejectRecord(scope.row)"
        >
          驳回
        </el-button>

        <el-button
          v-if="canPurchase && canPurchaseRow(scope.row)"
          type="success"
          link
          :icon="ShoppingCart"
          @click="openSinglePurchase(scope.row)"
        >
          采购
        </el-button>

        <el-button
          v-if="canReceive(scope.row)"
          type="success"
          link
          :icon="CircleCheck"
          @click="receiveRecord(scope.row)"
        >
          领取
        </el-button>

        <el-button
          v-if="canCancel(scope.row)"
          type="warning"
          link
          :icon="SwitchButton"
          @click="cancelRecord(scope.row)"
        >
          取消
        </el-button>

        <el-button
          v-if="canPurchase"
          type="danger"
          link
          :icon="Delete"
          @click="deleteRecord(getRowId(scope.row))"
        >
          删除
        </el-button>
      </template>
    </ProTable>

    <PurchaseDrawer ref="drawerRef" />
    <BatchPurchaseDialog ref="batchDialogRef" />
    <PurchaseRecordDialog ref="purchaseRecordDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import PurchaseDrawer from "./components/PurchaseDrawer.vue";
import BatchPurchaseDialog from "./components/BatchPurchaseDialog.vue";
import PurchaseRecordDialog from "./components/PurchaseRecordDialog.vue";
import {
  getPurchaseList,
  deletePurchase,
  deleteBatchPurchase,
  passPurchase,
  rejectPurchase,
  cancelPurchase,
  receivePurchase
} from "@/api/modules/buy/officePurchase";
import type { OfficePurchase, OfficePurchaseQuery, PurchaseStatus } from "@/api/interface/buy/officePurchase";
import { useDictStore } from "@/stores/modules/dict";
import { useAuthStore } from "@/stores/modules/auth";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  CirclePlus,
  Delete,
  EditPen,
  View,
  ShoppingCart,
  Select,
  CloseBold,
  CircleCheck,
  SwitchButton
} from "@element-plus/icons-vue";

const dictStore = useDictStore();
const authStore = useAuthStore();
const proTableRef = ref<any>(null);
const drawerRef = ref<any>(null);
const batchDialogRef = ref<any>(null);
const purchaseRecordDialogRef = ref<any>(null);

const tableRecords = ref<OfficePurchase[]>([]);

const currentUserId = computed(() => Number(authStore.userInfo.id || 0));
const canAssistApply = computed(() => authStore.isExistence("buy:apply:assist"));
const canPurchase = computed(() => authStore.isExistence("buy:purchase"));
const canAudit = computed(() => authStore.isExistence("buy:audit"));
const canViewAll = computed(() => authStore.isExistence("buy:view:all"));

const statusList: PurchaseStatus[] = ["待审核", "已驳回", "待采购", "已采购", "已完成", "已取消"];

const statusClassMap: Record<PurchaseStatus, string> = {
  待审核: "status-audit",
  已驳回: "status-reject",
  待采购: "status-purchase",
  已采购: "status-bought",
  已完成: "status-finished",
  已取消: "status-cancel"
};

const laneColorMap: Record<PurchaseStatus, string> = {
  待审核: "#6366f1",
  已驳回: "#ef4444",
  待采购: "#f59e0b",
  已采购: "#16a34a",
  已完成: "#0ea5e9",
  已取消: "#94a3b8"
};

// 初始化字典
onMounted(async () => {
  await dictStore.loadDicts(["user"]);
});

// 请求参数组装
const requestApi = (params: OfficePurchaseQuery) => {
  const query: any = { ...params };
  // 后端待上线 relatedUserId 过滤前，前端先把该字段透传
  if (!canViewAll.value) {
    query.relatedUserId = currentUserId.value;
  }
  return getPurchaseList(query as OfficePurchaseQuery);
};

// 数据回调
const dataCallback = (data: any) => {
  const rawList: OfficePurchase[] = (data?.records || []).map((item: OfficePurchase) => ({
    ...item,
    id: item.id || item.purchaseId
  }));

  // 后端未上线 relatedUserId 前，前端补一层本地相关数据过滤
  const list = canViewAll.value
    ? rawList
    : rawList.filter(item => Number(item.applyUserId) === currentUserId.value || Number(item.userId) === currentUserId.value);

  tableRecords.value = list;
  return {
    list,
    total: canViewAll.value ? Number(data?.total || 0) : list.length
  };
};

const stats = computed(() => {
  const result = {
    pendingAudit: 0,
    rejected: 0,
    pendingPurchase: 0,
    finished: 0
  };
  tableRecords.value.forEach(item => {
    const status = (item.status || "待审核") as PurchaseStatus;
    if (status === "待审核") result.pendingAudit += 1;
    if (status === "已驳回") result.rejected += 1;
    if (status === "待采购") result.pendingPurchase += 1;
    if (status === "已完成") result.finished += 1;
  });
  return result;
});

const lanes = computed(() =>
  statusList.map(status => ({
    status,
    color: laneColorMap[status],
    list: tableRecords.value.filter(item => (item.status || "待审核") === status)
  }))
);

const timelineList = computed(() => {
  return [...tableRecords.value]
    .sort((a, b) => {
      const aTime = new Date(a.updatedTime || a.createdTime || 0).getTime();
      const bTime = new Date(b.updatedTime || b.createdTime || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 8);
});

const getRowId = (row: Partial<OfficePurchase>) => Number(row.id || row.purchaseId || 0);

const getUserLabel = (userId?: number) => {
  if (!userId) return "-";
  return String(dictStore.getLabel("user", userId) || userId);
};

const isRelatedUser = (row: Partial<OfficePurchase>) =>
  Number(row.applyUserId) === currentUserId.value || Number(row.userId) === currentUserId.value;

const canEditRow = (row: Partial<OfficePurchase>) => {
  const status = (row.status || "待审核") as PurchaseStatus;
  if (!["待审核", "已驳回", "待采购"].includes(status)) return false;
  return isRelatedUser(row);
};

const canPassAudit = (row: Partial<OfficePurchase>) => {
  const status = (row.status || "待审核") as PurchaseStatus;
  return status === "待审核" || status === "已驳回";
};

const canReject = (row: Partial<OfficePurchase>) => {
  const status = (row.status || "待审核") as PurchaseStatus;
  return status === "待审核" || status === "待采购";
};

const canPurchaseRow = (row: Partial<OfficePurchase>) => {
  const status = (row.status || "待审核") as PurchaseStatus;
  if (status === "待采购") return true;
  // 未审核先采购：必须同时具备采购和审核权限
  return status === "待审核" && canAudit.value;
};

const canReceive = (row: Partial<OfficePurchase>) => {
  const status = (row.status || "待审核") as PurchaseStatus;
  if (status !== "已采购") return false;
  return isRelatedUser(row);
};

const canCancel = (row: Partial<OfficePurchase>) => {
  const status = (row.status || "待审核") as PurchaseStatus;
  if (!["待审核", "已驳回", "待采购"].includes(status)) return false;
  return isRelatedUser(row);
};

const columns = reactive<any[]>([
  { type: "selection", width: 56 },
  {
    type: "index",
    label: "序号",
    width: 68,
    index: (index: number) =>
      (proTableRef.value?.pageable?.pageNum - 1) * proTableRef.value?.pageable?.pageSize + index + 1
  },
  {
    label: "物品",
    prop: "itemName",
    minWidth: 160,
    search: { el: "input", tooltip: "输入物品名称搜索" }
  },
  {
    label: "规格型号",
    prop: "itemSpec",
    minWidth: 130
  },
  {
    label: "数量",
    prop: "itemNumber",
    width: 90
  },
  {
    label: "请购人",
    prop: "applyUserId",
    minWidth: 120,
    formatter: (row: OfficePurchase) => getUserLabel(row.applyUserId)
  },
  {
    label: "操作人",
    prop: "userId",
    minWidth: 120,
    formatter: (row: OfficePurchase) => getUserLabel(row.userId)
  },
  {
    label: "加急",
    prop: "fast",
    width: 90,
    formatter: (row: OfficePurchase) => (Number(row.fast || 0) === 1 ? "是" : "否"),
    search: {
      el: "select",
      enum: [
        { label: "全部", value: undefined },
        { label: "普通", value: 0 },
        { label: "加急", value: 1 }
      ]
    }
  },
  {
    label: "状态",
    prop: "status",
    width: 110,
    slot: "statusTag",
    search: {
      el: "select",
      enum: [{ label: "全部", value: undefined }, ...statusList.map(status => ({ label: status, value: status }))]
    }
  },
  {
    label: "驳回理由",
    prop: "rejectReason",
    minWidth: 160
  },
  {
    label: "期望到货",
    prop: "expectedDate",
    width: 130,
    search: {
      el: "date-picker",
      props: { type: "date", format: "YYYY-MM-DD", "value-format": "YYYY-MM-DD" }
    }
  },
  {
    label: "图片",
    prop: "fileUrl",
    width: 110,
    slot: "filePreview"
  },
  {
    label: "创建时间",
    prop: "createdTime",
    width: 170,
    search: {
      el: "date-picker",
      props: { type: "daterange", format: "YYYY-MM-DD", "value-format": "YYYY-MM-DD" }
    }
  },
  { prop: "operation", label: "操作", width: 460, fixed: "right" }
]);

const openDrawer = (title: string, row: Partial<OfficePurchase> = {}) => {
  drawerRef.value?.acceptParams({
    title,
    row,
    isView: title === "查看",
    canAssistApply: canAssistApply.value,
    getTableList: proTableRef.value?.getTableList
  });
};

const openSinglePurchase = (row: Partial<OfficePurchase>) => {
  purchaseRecordDialogRef.value?.open({
    purchaseId: getRowId(row),
    getTableList: proTableRef.value?.getTableList
  });
};

const openBatchPurchase = (ids: number[]) => {
  if (!ids?.length) {
    ElMessage.warning("请先选择请购记录");
    return;
  }
  batchDialogRef.value?.open({
    purchaseIds: ids,
    getTableList: proTableRef.value?.getTableList
  });
};

const openBatchPurchaseByTop = () => {
  ElMessage.info("请先在下方列表勾选请购记录后，再点击“批量采购录入”");
};

const deleteRecord = async (id: number) => {
  await ElMessageBox.confirm("确认删除该请购记录吗？", "提示", { type: "warning" });
  await deletePurchase(id);
  ElMessage.success("删除成功");
  proTableRef.value?.getTableList();
};

const deleteSelected = async (ids: number[]) => {
  if (!ids?.length) {
    ElMessage.warning("请先勾选请购记录");
    return;
  }
  await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 条记录吗？`, "提示", { type: "warning" });
  await deleteBatchPurchase(ids);
  ElMessage.success("批量删除成功");
  proTableRef.value?.getTableList();
};

const passRecord = async (row: Partial<OfficePurchase>) => {
  await passPurchase(getRowId(row));
  ElMessage.success("审核通过成功");
  proTableRef.value?.getTableList();
};

const rejectRecord = async (row: Partial<OfficePurchase>) => {
  try {
    const { value } = await ElMessageBox.prompt("可填写驳回理由（非必填）", "驳回请购", {
      inputPlaceholder: "请输入驳回理由",
      confirmButtonText: "确认驳回",
      cancelButtonText: "取消",
      inputType: "textarea"
    });
    await rejectPurchase(getRowId(row), value || "");
    ElMessage.success("驳回成功");
    proTableRef.value?.getTableList();
  } catch (error) {
    // 用户主动取消驳回，不提示错误
  }
};

const receiveRecord = async (row: Partial<OfficePurchase>) => {
  await receivePurchase(getRowId(row));
  ElMessage.success("领取成功");
  proTableRef.value?.getTableList();
};

const cancelRecord = async (row: Partial<OfficePurchase>) => {
  await ElMessageBox.confirm("确认取消该请购记录吗？", "取消确认", { type: "warning" });
  await cancelPurchase(getRowId(row));
  ElMessage.success("取消成功");
  proTableRef.value?.getTableList();
};
</script>

<style lang="scss" scoped>
.purchase-workbench {
  min-height: 100%;
  padding: 16px;
  background:
    radial-gradient(circle at 100% 0%, rgba(45, 212, 191, 0.16), transparent 28%),
    #f4f8fb;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #0f766e, #0ea5a6 65%, #22c55e);
  border-radius: 14px;
  box-shadow: 0 16px 30px rgba(15, 118, 110, 0.28);

  .hero-main {
    color: #f8fafc;

    h1 {
      margin: 8px 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    span {
      font-size: 13px;
      opacity: 0.92;
    }
  }

  .hero-eyebrow {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    opacity: 0.86;
  }

  .hero-actions {
    display: flex;
    gap: 10px;
    padding-top: 4px;

    :deep(.el-button) {
      border-radius: 9px;
    }
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  background: #ffffff;

  p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 26px;
    line-height: 1;
  }

  &.audit strong {
    color: #4f46e5;
  }

  &.reject strong {
    color: #dc2626;
  }

  &.purchase strong {
    color: #b45309;
  }

  &.done strong {
    color: #0f766e;
  }
}

.visual-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  margin-bottom: 14px;
}

.kanban-wrap {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.lane {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;

  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px;
    border-bottom: 1px solid #e2e8f0;

    h3 {
      margin: 0;
      flex: 1;
      font-size: 13px;
      color: #0f172a;
    }

    em {
      font-size: 12px;
      font-style: normal;
      color: #64748b;
    }
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .lane-body {
    min-height: 180px;
    padding: 8px;
  }
}

.lane-card {
  margin-bottom: 8px;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9px;

  .card-title {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .card-meta {
    display: grid;
    gap: 4px;
    font-size: 12px;
    color: #64748b;
  }

  .card-foot {
    margin-top: 7px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }
}

.lane-empty {
  padding-top: 26px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.timeline-wrap {
  padding: 12px 12px 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;

  header {
    margin-bottom: 6px;

    h3 {
      margin: 0;
      font-size: 15px;
      color: #0f172a;
    }

    span {
      font-size: 12px;
      color: #64748b;
    }
  }
}

.timeline-item {
  strong {
    color: #0f172a;
    font-size: 13px;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #64748b;
  }
}

.timeline-empty {
  padding: 18px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.purchase-table {
  :deep(.card) {
    border-radius: 12px;
  }
}

.thumb-img {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  cursor: zoom-in;
  transition: transform 0.2s;
}

.thumb-img:hover {
  transform: scale(1.75);
  z-index: 99;
}

.status-tag {
  border: none;

  &.status-audit {
    background: #4f46e5;
  }
  &.status-reject {
    background: #dc2626;
  }
  &.status-purchase {
    background: #d97706;
  }
  &.status-bought {
    background: #16a34a;
  }
  &.status-finished {
    background: #0284c7;
  }
  &.status-cancel {
    background: #64748b;
  }
}

@media (max-width: 1600px) {
  .visual-layout {
    grid-template-columns: 1fr;
  }

  .kanban-wrap {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kanban-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero {
    flex-direction: column;
    .hero-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 768px) {
  .purchase-workbench {
    padding: 10px;
  }

  .kanban-wrap {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
