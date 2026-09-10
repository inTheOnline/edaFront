<template>
  <div class="orderMater-container">
    <ProTable
      ref="proTableRef"
      :columns="columns"
      :request-api="getOrderMater"
      :init-param="initParam"
      :data-callback="dataCallback"
      :pagination="true"
      :tool-button="['refresh', 'setting', 'search']"
      row-key="id"
      title="订单管理"
      :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
      :virtualized="true"
      @row-click="handleRowClick"
    >
      <!-- 🔥 核心功能保留：点击订单号查看出货记录 -->
      <template #orderNum="{ row }">
        <el-link type="primary" @click="openWindow(row)">
          {{ row.orderNum }}
        </el-link>
      </template>

      <!-- 顶部操作栏 -->
      <template #tableHeader="scope">
        <!-- 🔥 替换为：自定义批量添加（原ImportExcel保留不动） -->
        <el-button type="primary" :icon="CirclePlus" @click="openBatchAddDialog"> 批量新增 </el-button>
        <el-button type="primary" plain @click="openQuickRequisition">快速请购</el-button>
        <el-button type="primary" :icon="Download" plain @click="downloadFile"> 导出订单数据 </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          plain
          @click="handleBatchDelete(scope.selectedListIds)"
          :disabled="!scope.isSelected"
        >
          批量删除订单
        </el-button>
        <SelectionSummary :items="selectionSummary" :disabled="!scope.isSelected" @clear="cancelSelect" />

        <div class="filter-box">
          <el-switch v-model="isShowFinish" active-text="显示已完成" inactive-text="隐藏已完成" />
          <el-button type="primary" @click="resetStatus">重置状态</el-button>
        </div>
      </template>

      <!-- 操作列 -->
      <template #operation="scope">
        <el-button type="primary" link :icon="View" @click="openWindow(scope.row)"> 查看 </el-button>
        <el-button type="primary" link :icon="EditPen" @click="openEditDialog(scope.row)"> 编辑 </el-button>
        <el-tooltip :disabled="Number(scope.row.alreadyNumber || 0) === 0" content="已有交货记录，不能删除">
          <span>
            <el-button
              type="danger"
              link
              :icon="Delete"
              :disabled="Number(scope.row.alreadyNumber || 0) > 0"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </span>
        </el-tooltip>
      </template>
    </ProTable>

    <!-- 抽屉/弹窗组件（你原有组件全部保留） -->
    <ImportExcel ref="dialogRef" />

    <!-- 🔥 新增：双模式批量添加弹窗（无报错版） -->
    <BatchAddDialog ref="batchAddDialogRef" />
    <QuickRequisitionDialog ref="quickRequisitionRef" />

    <el-dialog v-model="editDialogVisible" title="编辑订单物料" width="560px" destroy-on-close>
      <el-alert
        v-if="hasDelivered"
        title="已有交货记录，只能修改订单总数和备注"
        type="warning"
        :closable="false"
        show-icon
        class="edit-alert"
      />
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="订单编号" required>
          <el-input v-model="editForm.orderNum" :disabled="hasDelivered" />
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select v-model="editForm.custId" :disabled="hasDelivered" filterable style="width: 100%">
            <el-option v-for="item in dictStore.dictMap['cust'] || []" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料" required>
          <el-select v-model="editForm.materId" :disabled="hasDelivered" filterable style="width: 100%">
            <el-option v-for="item in dictStore.dictMap['mater'] || []" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单总数" required>
          <el-input-number v-model="editForm.totalNumber" :min="Math.max(1, Number(editForm.alreadyNumber || 0))" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 🔥 核心弹窗：订单出货详情（完全保留你的结构） -->
    <el-dialog v-model="openDetailDialog" title="订单出货详情" width="800px" append-to-body>
      <el-table :data="outboundRecordList" stripe border style="width: 100%">
        <el-table-column prop="orderDate" label="操作时间" width="180" />
        <el-table-column prop="outNum" label="出库单号" width="180" />
        <el-table-column prop="number" label="出库数量" align="center" />
        <el-table-column prop="user" label="操作人" />
        <el-table-column prop="remark" label="备注" min-width="150" />
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="openDetailDialog = false"> 关闭 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessageBox, ElMessage, ElLoading } from "element-plus";
import { useRouter } from "vue-router";
import { ColumnProps } from "@/components/ProTable/interface";
import { useMapStore } from "@/stores/modules/map";
import { useDictStore } from "@/stores/modules/dict";
import { useAuthStore } from "@/stores/modules/auth";
import * as XLSX from "xlsx";

// 组件引入（你原有组件全部保留，只加BatchAddDialog）
import ProTable from "@/components/ProTable/index.vue";
import SelectionSummary from "@/components/SelectionSummary/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
// 🔥 仅新增这一行
import BatchAddDialog from "./components/BatchAddDialog.vue";
import QuickRequisitionDialog from "@/views/order/orderTable/components/QuickRequisitionDialog.vue";

// 图标引入（完全不动）
import { CirclePlus, Delete, Download, View, EditPen } from "@element-plus/icons-vue";

// 接口引入（完全不动）
import { getOrderMater, getModel, addManyOrder, addBatchApi, getAboutById, deleteMater, editOrderMater, reset } from "@/api/modules/order";
import { getStateApi } from "@/api/modules/outgoing";
import { c } from "naive-ui";

// 全局状态（完全不动）
const mapStore = useMapStore();
const dictStore = useDictStore();
const authStore = useAuthStore();
const router = useRouter();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const selectedList = computed<any[]>(() => proTableRef.value?.selectedList || []);
const sumSelected = (field: string) => selectedList.value.reduce((total, row) => total + Number(row[field] || 0), 0);
const selectionSummary = computed(() => [
  { label: "订单数量", value: sumSelected("totalNumber") },
  { label: "已交数量", value: sumSelected("alreadyNumber") },
  { label: "未交数量", value: sumSelected("notAlreadyNumber") },
]);
// 🔥 仅新增这一行
const batchAddDialogRef = ref<any>(null);
const quickRequisitionRef = ref<InstanceType<typeof QuickRequisitionDialog> | null>(null);
const orderStatusMap = [
  { label: "未请购材料", value: 31, tagType: "warning" },
  { label: "材料已请购", value: 32, tagType: "primary" },
  { label: "材料已采购", value: 33, tagType: "primary" },
  { label: "材料已到", value: 34, tagType: "primary" },
  { label: "已生产", value: 35, tagType: "primary" },
  { label: "已外发", value: 36, tagType: "primary" },
  { label: "外发回执待全检", value: 37, tagType: "warning" },
  { label: "已完成", value: 1, tagType: "success" }
];
// ====================== 响应式数据（完全不动） ======================
const openDetailDialog = ref(false);
const outboundRecordList = ref<any[]>([]);
const isShowFinish = ref(false);
const editDialogVisible = ref(false);
const editSubmitting = ref(false);
const editForm = reactive<any>({});
const hasDelivered = computed(() => Number(editForm.alreadyNumber || 0) > 0);

// ====================== 表格配置（完全不动） ======================
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", align: "center", width: 55 },
  { label: "创建时间", prop: "localTime", minWidth: 160, align: "center" },
  {
    label: "客户",
    prop: "custId",
    search: {
      el: "select",
      tooltip: "请选择客户",
      enum: computed(() => dictStore.dictMap["cust"] || []),
      props: { placeholder: "请选择" },
    },
    enum: computed(() => dictStore.dictMap["cust"] || []),
    minWidth: 120,
  },
  {
    label: "订单编号",
    prop: "orderNum",
    width: 180,
    search: { el: "input", tooltip: "输入订单编号搜索", props: { placeholder: "请输入订单号" } },
  },
  {
    label: "物料编号",
    prop: "materNum",
    minWidth: 130,
    align: "center",
    search: { el: "input", key: "openTheDog", label: "物料", tooltip: "支持物料编号或物料名称模糊搜索", props: { placeholder: "请输入物料编号或名称" } },
  },
  {
    label: "物料名称",
    prop: "materName",
    minWidth: 200,
  },
  { label: "订单总数", prop: "totalNumber", width: 100, align: "center" },
  { label: "已交数量", prop: "alreadyNumber", width: 100, align: "center" },
  { label: "未交数量", prop: "notAlreadyNumber", width: 100, align: "center" },
  {
    label: "创建人",
    prop: "createUserId",
    width: 100,
    enum: computed(() => dictStore.dictMap["user"] || []),
    search: {
      el: "select",
      enum: computed(() => dictStore.dictMap["user"] || []),
      tooltip: "选择创建人",
      props: { placeholder: "请选择" },
    },
  },
  {
    label: "状态",
    prop: "state",
    tag: true,
    enum: orderStatusMap,
    fieldNames: { label: "label", value: "value" },
    width: 120,
    align: "center",
  },
  { label: "备注", prop: "remark", minWidth: 150 },
  { label: "操作", prop: "operation", fixed: "right", width: 220, align: "center" },
]);

// ====================== 业务逻辑（完全不动，只加一个方法） ======================
const dataCallback = (data) => ({ list: data.records, total: data.total });
const initParam = reactive({ showCompleted: false });
watch(isShowFinish, showCompleted => {
  initParam.showCompleted = showCompleted;
});

// 🔥 核心出货功能（完全不动）
const openWindow = async (row: any) => {
  if (!row?.id) {
    ElMessage.warning("订单ID不存在");
    return;
  }
  const loading = ElLoading.service({ text: "加载出货记录中..." });
  try {
    const { data } = await getAboutById(row.id);
    outboundRecordList.value = data || [];
    openDetailDialog.value = true;
  } catch (error) {
    ElMessage.error("获取出货记录失败");
    console.error(error);
  } finally {
    loading.close();
  }
};

const resetStatus = () => {
  isShowFinish.value = false;
  ElMessage.success("状态已重置");
};
const downloadFile = async () => {
  try {
    await ElMessageBox.confirm("确认导出当前筛选条件下的全部订单物料数据吗？", "导出确认", { type: "warning" });
  } catch {
    return;
  }
  const loading = ElLoading.service({ text: "正在导出..." });
  try {
    const params = { ...initParam, ...(proTableRef.value?.searchParam || {}) };
    const firstPage = (await getOrderMater({ ...params, pageNum: 1, pageSize: 1 } as any)).data;
    const records = firstPage.total
      ? (await getOrderMater({ ...params, pageNum: 1, pageSize: firstPage.total } as any)).data.records
      : [];
    const getDictLabel = (type: string, value: unknown) =>
      dictStore.dictMap[type]?.find(item => String(item.value) === String(value))?.label || value || "";
    const worksheet = XLSX.utils.json_to_sheet(
      records.map(item => ({
        创建时间: item.localTime || "",
        客户: item.custName || getDictLabel("cust", item.custId),
        订单编号: item.orderNum || "",
        物料编号: item.materNum || "",
        物料名称: item.materName || "",
        订单总数: item.totalNumber,
        已交数量: item.alreadyNumber || 0,
        未交数量: item.notAlreadyNumber || 0,
        创建人: item.createUserName || getDictLabel("user", item.createUserId),
        状态: orderStatusMap.find(status => status.value === item.state)?.label || "",
        备注: item.remark || ""
      })),
      { header: ["创建时间", "客户", "订单编号", "物料编号", "物料名称", "订单总数", "已交数量", "未交数量", "创建人", "状态", "备注"] }
    );
    worksheet["!cols"] = [20, 18, 20, 18, 24, 12, 12, 12, 16, 14, 24].map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "订单详情（物料）");
    XLSX.writeFile(workbook, `订单详情（物料）_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`成功导出 ${records.length} 条数据`);
  } catch {
    ElMessage.error("导出失败，请稍后重试");
  } finally {
    loading.close();
  }
};

// 你原有批量导入（保留不动）
const batchAdd = () => {
  const params = { title: "订单", tempApi: getModel, importApi: addManyOrder, getTableList: proTableRef.value?.getTableList };
  dialogRef.value?.acceptParams(params);
};

// 🔥 新增：打开双模式批量弹窗
const openBatchAddDialog = () => {
  batchAddDialogRef.value?.open({
    materList: dictStore.dictMap["mater"] || [],
    getTableList: proTableRef.value?.getTableList,
    submitApi: addBatchApi,
  });
};

const openQuickRequisition = () => quickRequisitionRef.value?.open(proTableRef.value?.getTableList);

const openEditDialog = (row: any) => {
  Object.assign(editForm, {
    id: row.id,
    orderNum: row.orderNum,
    custId: row.custId,
    materId: row.materId,
    totalNumber: Number(row.totalNumber),
    alreadyNumber: Number(row.alreadyNumber || 0),
    remark: row.remark || "",
  });
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  if (!editForm.orderNum?.trim() || !editForm.custId || !editForm.materId || !editForm.totalNumber) {
    ElMessage.warning("请填写完整的订单信息");
    return;
  }
  editSubmitting.value = true;
  try {
    await editOrderMater({ ...editForm });
    ElMessage.success("修改成功");
    editDialogVisible.value = false;
    proTableRef.value?.getTableList();
  } finally {
    editSubmitting.value = false;
  }
};

const handleDelete = async (row: any) => {
  if (Number(row.alreadyNumber || 0) > 0) {
    ElMessage.warning("已有交货记录的订单物料不能删除");
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除订单 ${row.orderNum} 的物料 ${row.materName}？`, "删除确认", { type: "warning" });
    await deleteMater([row.id]);
    ElMessage.success("删除成功");
    proTableRef.value?.getTableList();
  } catch (error: any) {
    if (error !== "cancel" && error !== "close") throw error;
  }
};

const handleBatchDelete = async (ids: any[]) => {
  if (!ids?.length) {
    ElMessage.warning("请选择要删除的订单");
    return;
  }
  try {
    await ElMessageBox.confirm("确定删除选中订单？删除后不可恢复！", "警告", { type: "warning" });
    const loading = ElLoading.service({ text: "删除中..." });
    try {
      await deleteMater(ids);
      ElMessage.success("删除成功");
      proTableRef.value?.getTableList();
    } catch (error) {
      ElMessage.error("删除失败");
      console.error("Batch delete failed:", error);
    } finally {
      loading.close();
    }
  } catch {
    ElMessage.info("已取消删除");
  }
};

const handleRowClick = (row: any) => proTableRef.value?.element?.toggleRowSelection(row);
const cancelSelect = () => proTableRef.value?.element?.clearSelection();

// 初始化（完全不动）
onMounted(async () => {
  try {
    await dictStore.loadDicts(["cust", "user", "mater"]);
  } catch (error) {
    ElMessage.error("字典数据加载失败");
    console.error(error);
  }
  //初始化时自动带上客户ID过滤，并且刷新表格
  proTableRef.value!.searchParam.custId = authStore.defaultInfoGet.custId || null;
  proTableRef.value!.search();
});
</script>

<style lang="scss" scoped>
.orderMater-container {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}
.filter-box {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
}
.dialog-footer {
  text-align: right;
}
.edit-alert {
  margin-bottom: 18px;
}
</style>
