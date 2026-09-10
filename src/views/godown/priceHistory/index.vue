<template>
  <div class="price-history-container">
    <div class="ProTable">
      <ProTable
        ref="proTableRef"
        :columns="columns"
        :request-api="getAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="价格调整记录"
        :search-col="{ xs: 2, sm: 2, md: 3, lg: 3, xl: 4 }"
      >
        <template #tableHeader>
          <el-button type="primary" plain :icon="Download" @click="exportExcel">导出 Excel</el-button>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import dayjs from "dayjs";
import { Download } from "@element-plus/icons-vue";
import { ElLoading, ElMessage, ElMessageBox } from "element-plus";
import * as XLSX from "xlsx";
import ProTable from "@/components/ProTable/index.vue";
import { ColumnProps } from "@/components/ProTable/interface";
import { getAll, PriceHistoryRecord } from "@/api/modules/priceHistory";

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);

const dataCallback = data => ({
  list: data.records,
  total: data.total
});

const formatRate = (row: { changeRate?: number | null }) => {
  if (row.changeRate === null || row.changeRate === undefined) return "";
  return `${(Number(row.changeRate) * 100).toFixed(2)}%`;
};

const formatCreateTime = (row: { createTime?: string | null }) => {
  if (!row.createTime) return "";
  return dayjs(row.createTime).format("YYYY-MM-DD HH:mm:ss");
};

const exportExcel = async () => {
  try {
    await ElMessageBox.confirm("确认导出当前筛选条件下的全部价格调整记录吗？", "导出确认", { type: "warning" });
  } catch {
    return;
  }

  const loading = ElLoading.service({ text: "正在导出..." });
  try {
    const searchParam = { ...(proTableRef.value?.searchParam || {}) };
    const firstPage = (await getAll({ ...searchParam, pageNum: 1, pageSize: 1 })).data as any;
    const records: PriceHistoryRecord[] = firstPage.total
      ? (((await getAll({ ...searchParam, pageNum: 1, pageSize: firstPage.total })).data as any).records ?? [])
      : [];
    const data = records.map(item => ({
      物料ID: item.materId,
      物料编号: item.materNum || "",
      物料名称: item.materName || "",
      原价: item.oldPrice,
      新价: item.price,
      价差: item.diffPrice,
      涨幅比例: formatRate(item),
      调价批次: item.batchName || "",
      生效日期: item.effectiveDate || "",
      调价原因: item.changeReason || "",
      操作人: item.changeBy || "",
      创建时间: formatCreateTime(item)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: [
        "物料ID",
        "物料编号",
        "物料名称",
        "原价",
        "新价",
        "价差",
        "涨幅比例",
        "调价批次",
        "生效日期",
        "调价原因",
        "操作人",
        "创建时间"
      ]
    });
    worksheet["!cols"] = [10, 18, 24, 12, 12, 12, 12, 16, 14, 28, 12, 20].map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "价格调整记录");
    XLSX.writeFile(workbook, `价格调整记录_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    ElMessage.success(`成功导出 ${records.length} 条数据`);
  } catch {
    ElMessage.error("导出失败，请稍后重试");
  } finally {
    loading.close();
  }
};

const columns: ColumnProps[] = reactive([
  {
    type: "index",
    label: "序号",
    width: 60,
    align: "center",
    index: index => {
      const pageNum = proTableRef.value?.pageable.pageNum || 1;
      const pageSize = proTableRef.value?.pageable.pageSize || 10;
      return (pageNum - 1) * pageSize + index + 1;
    }
  },
  { label: "物料ID", prop: "materId", width: 90, align: "center" },
  {
    label: "物料编号",
    prop: "materNum",
    minWidth: 140,
    search: { el: "input", tooltip: "输入物料编号搜索", props: { prefixIcon: "search" } }
  },
  {
    label: "物料名称",
    prop: "materName",
    minWidth: 220,
    search: { el: "input", tooltip: "输入物料名称搜索", props: { prefixIcon: "search" } }
  },
  { label: "原价", prop: "oldPrice", width: 100, align: "center" },
  { label: "新价", prop: "price", width: 100, align: "center" },
  { label: "价差", prop: "diffPrice", width: 100, align: "center" },
  { label: "涨幅比例", prop: "changeRate", width: 110, align: "center", render: scope => formatRate(scope.row) },
  {
    label: "调价批次",
    prop: "batchName",
    width: 120,
    search: { el: "input", tooltip: "输入调价批次搜索", props: { prefixIcon: "search" } }
  },
  { label: "生效日期", prop: "effectiveDate", width: 120, align: "center" },
  { label: "调价原因", prop: "changeReason", minWidth: 220 },
  { label: "操作人", prop: "changeBy", width: 100, align: "center" },
  { label: "创建时间", prop: "createTime", width: 170, align: "center", render: scope => formatCreateTime(scope.row) }
]);
</script>

<style lang="scss" scoped>
.ProTable {
  height: 100%;
  min-height: 0;
}
</style>
