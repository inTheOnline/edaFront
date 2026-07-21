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
    >
      <!-- 🔥 核心功能保留：点击订单号查看出货记录 -->
      <template #orderNum="{ row }">
        <el-link type="primary" @click="openWindow(row)">
          {{ row.orderNum }}
        </el-link>
      </template>

      <!-- 顶部操作栏 -->
      <template #tableHeader="scope">
        <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')"> 新增 </el-button>
        <!-- 🔥 替换为：自定义批量添加（原ImportExcel保留不动） -->
        <el-button type="primary" :icon="Upload" plain @click="openBatchAddDialog"> 批量添加订单 </el-button>
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

        <div class="filter-box">
          <el-switch v-model="isShowFinish" active-text="显示已完成" inactive-text="隐藏已完成" />
          <el-button type="primary" @click="resetStatus">重置状态</el-button>
        </div>
      </template>

      <!-- 操作列 -->
      <template #operation="scope">
        <el-button type="primary" link :icon="View" @click="openWindow(scope.row)"> 查看 </el-button>
      </template>
    </ProTable>

    <!-- 抽屉/弹窗组件（你原有组件全部保留） -->
    <UserDrawer ref="drawerRef" />
    <ImportExcel ref="dialogRef" />

    <!-- 🔥 新增：双模式批量添加弹窗（无报错版） -->
    <BatchAddDialog ref="batchAddDialogRef" />

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
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessageBox, ElMessage, ElLoading } from "element-plus";
import { useRouter } from "vue-router";
import { ColumnProps } from "@/components/ProTable/interface";
import { useMapStore } from "@/stores/modules/map";
import { useDictStore } from "@/stores/modules/dict";
import { useAuthStore } from "@/stores/modules/auth";
import * as XLSX from "xlsx";

// 组件引入（你原有组件全部保留，只加BatchAddDialog）
import ProTable from "@/components/ProTable/index.vue";
import UserDrawer from "@/views/order/orderTable/components/UserDrawer.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
// 🔥 仅新增这一行
import BatchAddDialog from "./components/BatchAddDialog.vue";

// 图标引入（完全不动）
import { CirclePlus, Delete, Download, Upload, View } from "@element-plus/icons-vue";

// 接口引入（完全不动）
import { getOrderMater, getModel, addManyOrder, addBatchApi, getAboutById, deleteMater, reset } from "@/api/modules/order";
import { getStateApi } from "@/api/modules/outgoing";
import { c } from "naive-ui";

// 全局状态（完全不动）
const mapStore = useMapStore();
const dictStore = useDictStore();
const authStore = useAuthStore();
const router = useRouter();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
// 🔥 仅新增这一行
const batchAddDialogRef = ref<any>(null);
const stateMap = computed(() => dictStore.dictMap["state"] || []);
// ====================== 响应式数据（完全不动） ======================
const openDetailDialog = ref(false);
const outboundRecordList = ref<any[]>([]);
const isShowFinish = ref(false);

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
  { label: "物料编号", prop: "materNum", minWidth: 130, align: "center" },
  {
    label: "物料名称",
    prop: "materName",
    minWidth: 200,
    search: { el: "input", tooltip: "输入物料名称搜索", props: { placeholder: "请输入物料名称" } },
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
    label: "订单状态",
    prop: "state",
    tag: true,
    enum: stateMap,
    fieldNames: { label: "label", value: "value" },
    width: 120,
    align: "center",
  },
  { label: "备注", prop: "remark", minWidth: 150 },
  { label: "操作", prop: "operation", fixed: "right", width: 120, align: "center" },
]);

// ====================== 业务逻辑（完全不动，只加一个方法） ======================
const dataCallback = (data) => ({ list: data.records, total: data.total });
const initParam = computed(() => ({
  state: isShowFinish.value ? 31 : null,
}));

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
    const params = { ...initParam.value, ...(proTableRef.value?.searchParam || {}) };
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
        订单状态: item.stateLabel || getDictLabel("state", item.state),
        备注: item.remark || ""
      })),
      { header: ["创建时间", "客户", "订单编号", "物料编号", "物料名称", "订单总数", "已交数量", "未交数量", "创建人", "订单状态", "备注"] }
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

const handleBatchDelete = async (ids: any[]) => {
  if (!ids?.length) {
    ElMessage.warning("请选择要删除的订单");
    return;
  }
  try {
    await ElMessageBox.confirm("确定删除选中订单？删除后不可恢复！", "警告", { type: "danger" });
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

const openDrawer = (type: string) => {
  drawerRef.value?.acceptParams({
    isView: false,
    title: type,
    row: {
      orderMaterId: "",
      orderNum: "",
      custId: "",
      remark: "",
      maters: [],
    },
    // 这里绑定你的新增接口 + 刷新表格
    api: getOrderMater,
    getTableList: proTableRef.value?.getTableList,
  });
};

// 初始化（完全不动）
onMounted(async () => {
  try {
    await dictStore.loadDicts(["cust", "user", "mater", "state"]);
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
</style>
