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
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import dayjs from "dayjs";
import ProTable from "@/components/ProTable/index.vue";
import { ColumnProps } from "@/components/ProTable/interface";
import { getAll } from "@/api/modules/priceHistory";

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
