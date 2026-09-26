<template>
  <div class="orderMater-container">
    <div class="table-panel">
      <ProTable
        :columns="columns"
        :request-api="getOrderOut"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
        @row-click="handleRowClick"
      >
        <template #operation="scope">
          <el-button type="primary" link :icon="EditPen" @click.stop="openEdit(scope.row)"> 编辑 </el-button>
        </template>
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDialog">新增</el-button>
          <el-button type="primary" :icon="Upload" plain @click="openDialog">批量添加</el-button>
          <el-button
            type="warning"
            plain
            @click="returnDialogRef?.open({ materList: materEnum || [], getTableList: () => proTableRef?.getTableList() })"
            >退货</el-button
          >
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">Excel导入</el-button>
          <el-dropdown trigger="click" @command="handleTool">
            <el-button type="primary" :icon="Tools" plain>工具箱<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="excel" :icon="Download">Excel导出</el-dropdown-item>
                <el-dropdown-item command="statement" :icon="Document" :disabled="!canViewPrice">导出对账单</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除出货
          </el-button>
          <SelectionSummary :items="selectionSummary" :disabled="!scope.isSelected" @clear="cancelSelect" />
        </template>
      </ProTable>
    </div>
    <EditDialog ref="editDialogRef" />
    <BatchAddDialog ref="batchDialogRef" />
    <ReturnDialog ref="returnDialogRef" />
    <ImportExcel ref="dialogRef" />
    <StatementDialog ref="statementDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onActivated, computed } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import SelectionSummary from "@/components/SelectionSummary/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { getOrderOut, getModel, addMany, deleteMany } from "@/api/modules/orderOut";
import { outTypeEnum } from "@/enums/orderOutEnum";
import BatchAddDialog from "./components/BatchAddDialog.vue";
import ReturnDialog from "./components/ReturnDialog.vue";
import EditDialog from "./components/EditDialog.vue";
import StatementDialog from "./components/StatementDialog.vue";
import { sumAmounts, useOrderPrice } from "@/views/order/orderTable/components/useOrderPrice";
const { canViewPrice, formatPrice, formatAmount } = useOrderPrice();
import * as XLSX from "xlsx";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh, Right, Tools, ArrowDown, Document } from "@element-plus/icons-vue";
import { ElLoading, ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import { useMapStore } from "@/stores/modules/map";
import { useDictStore } from "@/stores/modules/dict";
import SvgIcon from "@/components/SvgIcon/index.vue";
const mapStote = useMapStore();
const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const statementDialogRef = ref<InstanceType<typeof StatementDialog>>();
const handleTool = (command: string) => {
  if (command === "excel") void downloadFile();
  if (command === "statement" && canViewPrice.value) statementDialogRef.value?.open();
};
let activatedOnce = false;
onActivated(() => {
  if (activatedOnce) void proTableRef.value?.getTableList();
  activatedOnce = true;
});
const returnDialogRef = ref<InstanceType<typeof ReturnDialog>>();
const editDialogRef = ref<InstanceType<typeof EditDialog>>();
const openEdit = (row: any) =>
  editDialogRef.value?.open(row.id, { materList: materEnum.value || [], getTableList: () => proTableRef.value?.getTableList() });

const materEnum = computed(() => dictStore.dictMap["mater"]);
const userEnum = computed(() => dictStore.dictMap["user"]);
const orderEnum = computed(() => dictStore.dictMap["order"]);
const selectedList = computed<any[]>(() => proTableRef.value?.selectedList || []);
const selectionSummary = computed(() => [
  { label: "送货数量", value: selectedList.value.reduce((total, row) => total + Number(row.number || 0), 0) },
  ...(canViewPrice.value ? [{ label: "含税金额", value: sumAmounts(selectedList.value.map((row) => row.amount)) }] : []),
]);
const dataCallback = (data) => {
  // 数据回调
  return {
    list: data.records,
    total: data.total,
  };
};
onMounted(async () => {
  await dictStore.loadDicts(["order", "user", "mater", "cust"]);
});
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  {
    label: "时间",
    prop: "time",
    width: 150,
  },
  {
    label: "送货单号",
    prop: "num",
    search: {
      el: "input",
      tooltip: "输入送货单号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 200,
  },
  {
    label: "订单号",
    prop: "orderNum",
    search: {
      el: "input",
      tooltip: "输入出货号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 200,
  },
  {
    label: "产品编号",
    prop: "materId",
    enum: materEnum,
    fieldNames: { label: "num", value: "value" },
    search: {
      el: "select",
      props: {
        filterable: true,
        placeholder: "输入产品编号搜索",
      },
    },
    width: 200,
    align: "center",
  },
  {
    label: "产品名称",
    prop: "materId",
    enum: materEnum,
    search: {
      el: "select",
      props: {
        filterable: true,
        placeholder: "输入产品名称搜索",
      },
    },
    minWidth: 250,
    align: "center",
  },
  {
    label: "送货数量",
    prop: "number",
    width: 100,
  },
  {
    label: "客户",
    prop: "custId",
    width: 140,
    enum: computed(() => dictStore.dictMap.cust || []),
    search: { el: "select", props: { filterable: true } },
  },
  { label: "含税单价", prop: "price", width: 130, isShow: canViewPrice, render: ({ row }) => formatPrice(row.price) },
  { label: "含税金额", prop: "amount", width: 140, isShow: canViewPrice, render: ({ row }) => formatAmount(row.amount) },
  {
    label: "创建人",
    prop: "createUserId",
    enum: userEnum,

    search: {
      el: "select",
      tooltip: "输入创建人进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 100,
  },
  {
    label: "状态",
    prop: "status",
    enum: [...outTypeEnum],
    tag: true,
    width: 110,
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 200,
  },

  { prop: "operation", label: "操作", fixed: "right", width: 160 },
]);

// 批量添加
const batchDialogRef = ref<InstanceType<typeof BatchAddDialog> | null>(null);

const openDialog = async () => {
  const params = {
    materList: materEnum.value,
    getTableList: proTableRef.value?.getTableList,
  };
  batchDialogRef.value?.open(params);
};
// 删除已选项目
const deleteSelected = async (ids: (number | string)[]) => {
  if (!ids?.length) {
    ElMessage.warning("请选择要删除的订单");
    return;
  }
  try {
    await ElMessageBox.confirm("确定删除选中订单？删除后不可恢复！", "警告", { type: "warning" });
    const loading = ElLoading.service({ text: "删除中..." });
    try {
      await deleteMany(ids.map(Number));
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
// 导出出货列表
const downloadFile = async () => {
  try {
    await ElMessageBox.confirm("确认导出当前筛选条件下的全部订单出货数据吗？", "导出确认", { type: "warning" });
  } catch {
    return;
  }
  const loading = ElLoading.service({ text: "正在导出..." });
  try {
    const searchParam = { ...(proTableRef.value?.searchParam || {}) };
    const firstPage = (await getOrderOut({ ...searchParam, pageNum: 1, pageSize: 1 } as any)).data;
    const records = firstPage.total
      ? (await getOrderOut({ ...searchParam, pageNum: 1, pageSize: firstPage.total } as any)).data.records
      : [];
    const getOption = (options: readonly any[] = [], value: unknown) =>
      options.find((item) => String(item.value) === String(value));
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((item) => {
        const mater = getOption(materEnum.value, item.materId);
        return {
          时间: item.time || "",
          送货单号: item.num || "",
          订单号: item.orderNum || getOption(orderEnum.value, item.orderId)?.label || "",
          产品编号: item.materNum || mater?.num || "",
          产品名称: item.materName || mater?.label || "",
          送货数量: item.number,
          客户: item.custName || dictStore.getLabel("cust", item.custId),
          ...(canViewPrice.value ? { 含税单价: item.price, 含税金额: item.amount } : {}),
          创建人: item.createUserName || getOption(userEnum.value, item.createUserId)?.label || "",
          状态: item.statusLabel || getOption(outTypeEnum, item.status)?.label || item.status,
          备注: item.remark || "",
        };
      }),
      {
        header: [
          "时间",
          "送货单号",
          "订单号",
          "产品编号",
          "产品名称",
          "送货数量",
          "客户",
          ...(canViewPrice.value ? ["含税单价", "含税金额"] : []),
          "创建人",
          "状态",
          "备注",
        ],
      },
    );
    worksheet["!cols"] = [20, 20, 20, 18, 24, 12, 16, 12, 24].map((wch) => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "订单出货表");
    XLSX.writeFile(workbook, `订单出货表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`成功导出 ${records.length} 条数据`);
  } catch {
    ElMessage.error("导出失败，请稍后重试");
  } finally {
    loading.close();
  }
};
// 批量添加出货
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "送货数据",
    tempApi: getModel,
    importApi: addMany,
    getTableList: proTableRef.value?.getTableList,
  };
  dialogRef.value?.acceptParams(params);
};
</script>

<style lang="scss" scoped>
.orderMater-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.table-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
