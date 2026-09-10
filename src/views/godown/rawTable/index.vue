<template>
  <div class="container">
    <RawModuleHeader
      title="原材料入库记录"
      description="按编号、规格和材质查询历史入库数据，并查看单条记录详情。"
      :icon="Document"
    />
    <div class="table-panel">
      <ProTable
        :columns="columns"
        :request-api="getTable"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="入库记录"
        ref="proTableRef"
        striped="true"
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 3, xl: 4 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出原料数据</el-button>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
    <ImportExcel ref="dialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { getTableModel, getTable } from "@/api/modules/raw";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "./components/UserDrawer.vue";
import RawModuleHeader from "../components/RawModuleHeader.vue";
import { Document, Download, View } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dataCallback = (data) => {
  // 数据回调
  return {
    list: data.records,
    total: data.total,
  };
};
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  {
    type: "index",
    label: "序号",
    width: 60,
    align: "center",
    index: (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1,
  },
  {
    label: "原料编号",
    prop: "rawNum",
    search: {
      el: "input",
      tooltip: "输入原料编号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 150,
  },
  {
    label: "规格",
    prop: "rawSpecs",
    search: {
      el: "input",
      tooltip: "输入原料规格进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 250,
  },
  {
    label: "单位重量",
    prop: "utilWeight",
  },
  {
    label: "材质",
    prop: "essence",
  },
  {
    label: "类别",
    prop: "type",
    enum: [
      { label: "板料", value: 1 },
      { label: "卷料", value: 2 },
    ],
  },
  {
    label: "备注",
    prop: "remark",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 250 },
]);

// 打开抽屉
const openDrawer = async (title: string, row: Object = {}) => {
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? add : title === "编辑" ? edit : undefined,
    getTableList: proTableRef.value?.getTableList,
  };
  drawerRef.value?.acceptParams(params);
};

// 导出原料列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getTableModel, "原料列表", proTableRef.value?.searchParam),
  );
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 16px;
}

.table-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 12px;
}

.table-panel :deep(.ProTable) {
  height: 100%;
}

@media (max-width: 768px) {
  .container {
    gap: 12px;
  }
}
</style>
