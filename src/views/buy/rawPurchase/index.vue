<template>
  <div class="raw-purchase-page">
    <el-tabs v-model="activeTab" class="raw-purchase-tabs">
      <el-tab-pane label="请购明细" name="requisition" lazy>
        <ProTable
          ref="requisitionTableRef"
          row-key="id"
          title="原材料请购明细"
          :columns="requisitionColumns"
          :request-api="requestRequisitionPage"
          :data-callback="dataCallback"
          :pagination="true"
          :tool-button="['refresh', 'setting', 'search']"
          :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
        >
          <template #tableHeader="scope">
            <el-button type="primary" :icon="CirclePlus" @click="openRequisitionDrawer('新增')">新增请购</el-button>
            <el-button type="primary" plain :icon="Upload" @click="openRequisitionBatch">批量添加</el-button>
            <el-button type="primary" plain :icon="Upload" @click="openImport('requisition')">导入</el-button>
            <el-button type="primary" plain :icon="Download" @click="downloadRequisition">导出</el-button>
            <el-button type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="deleteRequisitions(scope.selectedListIds)">
              批量删除
            </el-button>
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link :icon="View" @click="openRequisitionDrawer('查看', row)">查看</el-button>
            <el-button type="primary" link :icon="EditPen" @click="openRequisitionDrawer('编辑', row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteRequisitions([row.id])">删除</el-button>
          </template>
        </ProTable>
      </el-tab-pane>

      <el-tab-pane label="采购订单明细" name="orderItem" lazy>
        <ProTable
          ref="orderItemTableRef"
          row-key="id"
          title="原材料采购订单明细"
          :columns="orderItemColumns"
          :request-api="requestOrderItemPage"
          :data-callback="dataCallback"
          :pagination="true"
          :tool-button="['refresh', 'setting', 'search']"
          :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
        >
          <template #tableHeader="scope">
            <el-button type="primary" :icon="CirclePlus" @click="openOrderItemDrawer('新增')">新增采购</el-button>
            <el-button type="primary" plain :icon="Upload" @click="openOrderItemBatch">批量添加</el-button>
            <el-button type="primary" plain :icon="Upload" @click="openImport('orderItem')">导入</el-button>
            <el-button type="primary" plain :icon="Download" @click="downloadOrderItem">导出</el-button>
            <el-button type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="deleteOrderItems(scope.selectedListIds)">
              批量删除
            </el-button>
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link :icon="View" @click="openOrderItemDrawer('查看', row)">查看</el-button>
            <el-button type="primary" link :icon="EditPen" @click="openOrderItemDrawer('编辑', row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteOrderItems([row.id])">删除</el-button>
          </template>
        </ProTable>
      </el-tab-pane>

      <el-tab-pane label="来料明细" name="incoming" lazy>
        <ProTable
          ref="incomingTableRef"
          row-key="id"
          title="原材料来料明细"
          :columns="incomingColumns"
          :request-api="requestIncomingPage"
          :data-callback="dataCallback"
          :pagination="true"
          :tool-button="['refresh', 'setting', 'search']"
          :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
        >
          <template #tableHeader="scope">
            <el-button type="primary" :icon="CirclePlus" @click="openIncomingDrawer('新增')">新增来料</el-button>
            <el-button type="primary" plain :icon="Upload" @click="openIncomingBatch">批量添加</el-button>
            <el-button type="primary" plain :icon="Upload" @click="openImport('incoming')">导入</el-button>
            <el-button type="primary" plain :icon="Download" @click="downloadIncoming">导出</el-button>
            <el-button type="danger" plain :icon="Delete" :disabled="!scope.isSelected" @click="deleteIncomings(scope.selectedListIds)">
              批量删除
            </el-button>
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link :icon="View" @click="openIncomingDrawer('查看', row)">查看</el-button>
            <el-button type="primary" link :icon="EditPen" @click="openIncomingDrawer('编辑', row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteIncomings([row.id])">删除</el-button>
          </template>
        </ProTable>
      </el-tab-pane>
    </el-tabs>

    <RequisitionDrawer ref="requisitionDrawerRef" />
    <OrderItemDrawer ref="orderItemDrawerRef" />
    <IncomingDrawer ref="incomingDrawerRef" />
    <RequisitionBatchAddDialog ref="requisitionBatchRef" />
    <OrderItemBatchAddDialog ref="orderItemBatchRef" />
    <IncomingBatchAddDialog ref="incomingBatchRef" />
    <ImportExcel ref="importRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { CirclePlus, Delete, Download, EditPen, Upload, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
import { useAuthStore } from "@/stores/modules/auth";
import { useDownload } from "@/hooks/useDownload";
import { getAll as getRawPage } from "@/api/modules/raw";
import { getAllSup } from "@/api/modules/sup";
import type {
  RawPurchaseIncoming,
  RawPurchaseItem,
  RawMaterOption,
  RawPurchaseOption,
  RawPurchaseRequisition
} from "@/api/interface/buy/rawPurchase";
import {
  addIncoming,
  addOrderItem,
  addRequisition,
  batchCreateIncoming,
  batchCreateOrderItem,
  batchCreateRequisition,
  deleteBatchIncoming,
  deleteBatchOrderItem,
  deleteBatchRequisition,
  deleteIncoming,
  deleteOrderItem,
  deleteRequisition,
  editIncoming,
  editOrderItem,
  editRequisition,
  exportIncoming,
  exportOrderItem,
  exportRequisition,
  getIncomingModel,
  getIncomingPage,
  getOrderItemModel,
  getOrderItemOptions,
  getOrderItemPage,
  getRawMaterOptions,
  getRequisitionModel,
  getRequisitionPage,
  importIncoming,
  importOrderItem,
  importRequisition
} from "@/api/modules/buy/rawPurchase";
import RequisitionDrawer from "./components/RequisitionDrawer.vue";
import OrderItemDrawer from "./components/OrderItemDrawer.vue";
import IncomingDrawer from "./components/IncomingDrawer.vue";
import RequisitionBatchAddDialog from "./components/RequisitionBatchAddDialog.vue";
import OrderItemBatchAddDialog from "./components/OrderItemBatchAddDialog.vue";
import IncomingBatchAddDialog from "./components/IncomingBatchAddDialog.vue";

type TabName = "requisition" | "orderItem" | "incoming";

const dictStore = useDictStore();
const authStore = useAuthStore();
const activeTab = ref<TabName>("requisition");
const requisitionTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const orderItemTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const incomingTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const requisitionDrawerRef = ref<InstanceType<typeof RequisitionDrawer> | null>(null);
const orderItemDrawerRef = ref<InstanceType<typeof OrderItemDrawer> | null>(null);
const incomingDrawerRef = ref<InstanceType<typeof IncomingDrawer> | null>(null);
const requisitionBatchRef = ref<InstanceType<typeof RequisitionBatchAddDialog> | null>(null);
const orderItemBatchRef = ref<InstanceType<typeof OrderItemBatchAddDialog> | null>(null);
const incomingBatchRef = ref<InstanceType<typeof IncomingBatchAddDialog> | null>(null);
const importRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const rawOptions = ref<RawPurchaseOption[]>([]);
const rawMaterOptions = ref<RawMaterOption[]>([]);
const supOptions = ref<RawPurchaseOption[]>([]);
const orderItemOptions = ref<RawPurchaseOption[]>([]);

const userOptions = computed(() => dictStore.dictMap.user || []);
const materOptions = computed(() => dictStore.dictMap.mater || []);
const currentUserId = computed(() => Number(authStore.userInfo.id || 0));
const statusOptions = [
  { label: "待采购", value: "待采购", tagType: "warning" },
  { label: "部分采购", value: "部分采购", tagType: "primary" },
  { label: "已采购", value: "已采购", tagType: "success" },
  { label: "已取消", value: "已取消", tagType: "danger" }
];

const dataCallback = (data: { records?: any[]; total?: number }) => ({
  list: data?.records || [],
  total: Number(data?.total || 0)
});

const requestRequisitionPage = (params: any) => getRequisitionPage(params);
const requestOrderItemPage = (params: any) => getOrderItemPage(params);
const requestIncomingPage = (params: any) => getIncomingPage(params);

const requisitionColumns: ColumnProps<RawPurchaseRequisition>[] = reactive([
  { type: "selection", width: 55 },
  { type: "index", label: "序号", width: 70 },
  {
    prop: "requisitionDate",
    label: "请购日期",
    width: 120,
    search: { el: "date-picker", props: { type: "daterange", valueFormat: "YYYY-MM-DD" } }
  },
  { prop: "custOrderNum", label: "客户订单", minWidth: 150, search: { el: "input", props: { placeholder: "请输入客户订单" } } },
  { prop: "materNum", label: "物料编号", minWidth: 130 },
  { prop: "materName", label: "品名", minWidth: 160, search: { el: "input", props: { placeholder: "请输入品名" } } },
  { prop: "rawSpecs", label: "原材料型号", minWidth: 170, search: { el: "input", props: { placeholder: "请输入型号" } } },
  { prop: "rawNum", label: "原材料号", minWidth: 140, search: { el: "input", props: { placeholder: "请输入原材料号" } } },
  { prop: "useType", label: "用料类型", width: 100 },
  { prop: "sheetOutputNumber", label: "每张产出", width: 110 },
  { prop: "rollUnitWeight", label: "单个重量", width: 110 },
  { prop: "requisitionNumber", label: "请购数量", width: 110 },
  { prop: "requisitionWeight", label: "请购重量", width: 120 },
  { prop: "purchasedNumber", label: "已采购数量", width: 120 },
  { prop: "purchasedWeight", label: "已采购重量", width: 120 },
  { prop: "notPurchaseNumber", label: "未采购数量", width: 120 },
  { prop: "status", label: "状态", tag: true, enum: statusOptions, width: 110, search: { el: "select" } },
  { prop: "remark", label: "备注", minWidth: 160 },
  { prop: "operation", label: "操作", fixed: "right", width: 210 }
]);

const orderItemColumns: ColumnProps<RawPurchaseItem>[] = reactive([
  { type: "selection", width: 55 },
  { type: "index", label: "序号", width: 70 },
  {
    prop: "purchaseDate",
    label: "采购日期",
    width: 120,
    search: { el: "date-picker", props: { type: "daterange", valueFormat: "YYYY-MM-DD" } }
  },
  { prop: "purchaseOrderNum", label: "采购订单", minWidth: 150, search: { el: "input", props: { placeholder: "请输入采购订单" } } },
  { prop: "custOrderNum", label: "客户订单", minWidth: 150, search: { el: "input", props: { placeholder: "请输入客户订单" } } },
  { prop: "materNum", label: "物料编号", minWidth: 130 },
  { prop: "materName", label: "品名", minWidth: 160, search: { el: "input", props: { placeholder: "请输入品名" } } },
  { prop: "rawSpecs", label: "原材料型号", minWidth: 170, search: { el: "input", props: { placeholder: "请输入型号" } } },
  { prop: "rawNum", label: "原材料号", minWidth: 140, search: { el: "input", props: { placeholder: "请输入原材料号" } } },
  { prop: "useType", label: "用料类型", width: 100 },
  { prop: "orderNumber", label: "订单数量", width: 110 },
  { prop: "purchaseNumber", label: "采购数量", width: 110 },
  { prop: "purchaseWeight", label: "采购重量", width: 120 },
  { prop: "incomingNumber", label: "来料数量", width: 110 },
  { prop: "incomingWeight", label: "来料重量", width: 120 },
  { prop: "notbackNumber", label: "未到数量", width: 110 },
  { prop: "unitPrice", label: "单价", width: 100 },
  { prop: "supName", label: "供应商", minWidth: 130, search: { el: "input", props: { placeholder: "请输入供应商" } } },
  { prop: "remark", label: "备注", minWidth: 160 },
  { prop: "operation", label: "操作", fixed: "right", width: 210 }
]);

const incomingColumns: ColumnProps<RawPurchaseIncoming>[] = reactive([
  { type: "selection", width: 55 },
  { type: "index", label: "序号", width: 70 },
  {
    prop: "incomingDate",
    label: "来料日期",
    width: 120,
    search: { el: "date-picker", props: { type: "daterange", valueFormat: "YYYY-MM-DD" } }
  },
  { prop: "purchaseOrderNum", label: "采购订单", minWidth: 150, search: { el: "input", props: { placeholder: "请输入采购订单" } } },
  { prop: "custOrderNum", label: "客户订单", minWidth: 150 },
  { prop: "materNum", label: "物料编号", minWidth: 130 },
  { prop: "materName", label: "品名", minWidth: 160 },
  { prop: "rawSpecs", label: "原材料型号", minWidth: 170, search: { el: "input", props: { placeholder: "请输入型号" } } },
  { prop: "rawNum", label: "原材料号", minWidth: 140, search: { el: "input", props: { placeholder: "请输入原材料号" } } },
  { prop: "incomingNumber", label: "来料数量", width: 110 },
  { prop: "incomingWeight", label: "来料重量", width: 120 },
  { prop: "supName", label: "供应商", minWidth: 130, search: { el: "input", props: { placeholder: "请输入供应商" } } },
  { prop: "remark", label: "备注", minWidth: 160 },
  { prop: "operation", label: "操作", fixed: "right", width: 210 }
]);

const loadRawOptions = async () => {
  try {
    const { data } = (await getRawPage({ pageNum: 1, pageSize: 9999 })) as any;
    rawOptions.value = (data?.records || []).map((item: any) => ({
      label: item.rawNum,
      value: item.id,
      rawNum: item.rawNum,
      rawSpecs: item.rawSpecs
    }));
  } catch {
    rawOptions.value = [];
  }
};

const loadRawMaterOptions = async () => {
  try {
    const { data } = await getRawMaterOptions();
    rawMaterOptions.value = data || [];
  } catch {
    rawMaterOptions.value = [];
  }
};

const loadSupOptions = async () => {
  try {
    const { data } = await getAllSup({ pageNum: 1, pageSize: 9999 });
    supOptions.value = (data?.records || []).map((item: any) => ({
      label: item.supName,
      value: item.id
    }));
  } catch {
    supOptions.value = [];
  }
};

const loadOrderItemOptions = async () => {
  try {
    const { data } = await getOrderItemOptions();
    orderItemOptions.value = data || [];
  } catch {
    orderItemOptions.value = [];
  }
};

const openRequisitionDrawer = (title: string, row: Partial<RawPurchaseRequisition> = {}) => {
  requisitionDrawerRef.value?.acceptParams({
    title,
    isView: title === "查看",
    row: { ...row },
    userOptions: userOptions.value,
    materOptions: materOptions.value,
    rawOptions: rawOptions.value,
    submitApi: title === "新增" ? addRequisition : title === "编辑" ? editRequisition : undefined,
    getTableList: requisitionTableRef.value?.getTableList
  });
};

const openOrderItemDrawer = (title: string, row: Partial<RawPurchaseItem> = {}) => {
  orderItemDrawerRef.value?.acceptParams({
    title,
    isView: title === "查看",
    row: { ...row },
    materOptions: materOptions.value,
    rawOptions: rawOptions.value,
    supOptions: supOptions.value,
    submitApi: title === "新增" ? addOrderItem : title === "编辑" ? editOrderItem : undefined,
    getTableList: orderItemTableRef.value?.getTableList
  });
};

const openIncomingDrawer = async (title: string, row: Partial<RawPurchaseIncoming> = {}) => {
  await loadOrderItemOptions();
  incomingDrawerRef.value?.acceptParams({
    title,
    isView: title === "查看",
    row: { ...row },
    orderItemOptions: orderItemOptions.value,
    supOptions: supOptions.value,
    submitApi: title === "新增" ? addIncoming : title === "编辑" ? editIncoming : undefined,
    getTableList: incomingTableRef.value?.getTableList
  });
};

const openRequisitionBatch = () => {
  requisitionBatchRef.value?.open({
    userOptions: userOptions.value,
    materOptions: materOptions.value,
    rawOptions: rawOptions.value,
    rawMaterOptions: rawMaterOptions.value,
    currentUserId: currentUserId.value,
    supOptions: supOptions.value,
    submitApi: batchCreateRequisition,
    getTableList: requisitionTableRef.value?.getTableList
  });
};

const openOrderItemBatch = () => {
  orderItemBatchRef.value?.open({
    materOptions: materOptions.value,
    rawOptions: rawOptions.value,
    supOptions: supOptions.value,
    submitApi: batchCreateOrderItem,
    getTableList: orderItemTableRef.value?.getTableList
  });
};

const openIncomingBatch = () => {
  incomingBatchRef.value?.open({
    supOptions: supOptions.value,
    submitApi: batchCreateIncoming,
    getTableList: incomingTableRef.value?.getTableList
  });
};

const confirmDelete = async (message: string) => {
  await ElMessageBox.confirm(message, "温馨提示", { type: "warning" });
};

const deleteRequisitions = async (ids: number[]) => {
  if (!ids?.length) return;
  await confirmDelete("确定删除选中的请购明细？");
  ids.length === 1 ? await deleteRequisition(ids[0]) : await deleteBatchRequisition(ids);
  ElMessage.success("删除成功");
  requisitionTableRef.value?.getTableList();
};

const deleteOrderItems = async (ids: number[]) => {
  if (!ids?.length) return;
  await confirmDelete("确定删除选中的采购订单明细？");
  ids.length === 1 ? await deleteOrderItem(ids[0]) : await deleteBatchOrderItem(ids);
  ElMessage.success("删除成功");
  orderItemTableRef.value?.getTableList();
  requisitionTableRef.value?.getTableList();
};

const deleteIncomings = async (ids: number[]) => {
  if (!ids?.length) return;
  await confirmDelete("确定删除选中的来料明细？");
  ids.length === 1 ? await deleteIncoming(ids[0]) : await deleteBatchIncoming(ids);
  ElMessage.success("删除成功");
  incomingTableRef.value?.getTableList();
  orderItemTableRef.value?.getTableList();
};

const openImport = (type: TabName) => {
  const map = {
    requisition: {
      title: "原材料请购",
      tempApi: getRequisitionModel,
      importApi: importRequisition,
      getTableList: requisitionTableRef.value?.getTableList
    },
    orderItem: {
      title: "原材料采购订单",
      tempApi: getOrderItemModel,
      importApi: importOrderItem,
      getTableList: orderItemTableRef.value?.getTableList
    },
    incoming: {
      title: "原材料来料",
      tempApi: getIncomingModel,
      importApi: importIncoming,
      getTableList: incomingTableRef.value?.getTableList
    }
  };
  importRef.value?.acceptParams(map[type]);
};

const downloadRequisition = () => useDownload(exportRequisition, "原材料请购明细", requisitionTableRef.value?.searchParam);
const downloadOrderItem = () => useDownload(exportOrderItem, "原材料采购订单明细", orderItemTableRef.value?.searchParam);
const downloadIncoming = () => useDownload(exportIncoming, "原材料来料明细", incomingTableRef.value?.searchParam);

onMounted(async () => {
  await Promise.all([dictStore.loadDicts(["user", "mater"]), loadRawOptions(), loadRawMaterOptions(), loadSupOptions()]);
});
</script>

<style scoped lang="scss">
.raw-purchase-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  background: #f6f8fb;
}

.raw-purchase-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__header) {
    flex-shrink: 0;
    margin-bottom: 12px;
    padding: 0 8px;
    border-radius: 8px;
    background: #ffffff;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
  }

  :deep(.table-main) {
    border-radius: 8px;
  }
}
</style>
