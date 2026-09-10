<template>
  <div class="raw-relation-container">
    <RawModuleHeader
      title="产品与原材料关系"
      description="集中维护产品对应的张料、卷料及耗用参数，减少生产用料配置错误。"
      :icon="Connection"
    >
      <template #meta><el-tag type="info" effect="plain">工艺基础数据</el-tag></template>
    </RawModuleHeader>
    <div class="table-panel">
      <ProTable
        ref="proTableRef"
        :columns="columns"
        :request-api="getPage"
        :data-callback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="产品原材料关系"
        :search-col="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增关系</el-button>
          <el-button
            type="danger"
            plain
            :icon="Delete"
            :disabled="!scope.isSelected"
            @click="deleteSelected(scope.selectedListIds)"
          >
            批量删除
          </el-button>
        </template>
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="danger" link :icon="Delete" @click="deleteOne(scope.row.id)">删除</el-button>
        </template>
      </ProTable>
    </div>
    <RelationDrawer ref="drawerRef" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { CirclePlus, Connection, Delete, EditPen, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
import { getAll as getRawPage } from "@/api/modules/raw";
import { addRawMater, deleteBatchRawMater, deleteRawMater, editRawMater, getRawMaterPage } from "@/api/modules/buy/rawPurchase";
import type { RawMaterRelation } from "@/api/interface/buy/rawPurchase";
import RelationDrawer from "./components/RelationDrawer.vue";
import RawModuleHeader from "../components/RawModuleHeader.vue";

const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof RelationDrawer> | null>(null);
const materOptions = ref<Array<{ value: string | number; label: string }>>([]);
const rawOptions = ref<Array<{ value: string | number; label: string }>>([]);

const getPage = (params: Record<string, any>) => {
  const { pageNum, pageSize, ...data } = params;
  return getRawMaterPage({ pageNum, pageSize, data });
};

const dataCallback = (data: any) => ({ list: data.records, total: data.total });

const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width: 60, align: "center" },
  { prop: "materNum", label: "产品编号", minWidth: 140, search: { el: "input" } },
  { prop: "materName", label: "产品名称", minWidth: 180, search: { el: "input" } },
  { prop: "sheetRawNum", label: "张料编号", minWidth: 130, search: { el: "input" } },
  { prop: "sheetRawSpecs", label: "张料规格", minWidth: 170, search: { el: "input" } },
  { prop: "sheetOutputNumber", label: "每张产出数", width: 110 },
  { prop: "sheetWeight", label: "张重(kg/张)", width: 120 },
  { prop: "rollRawNum", label: "卷料编号", minWidth: 130, search: { el: "input" } },
  { prop: "rollRawSpecs", label: "卷料规格", minWidth: 170, search: { el: "input" } },
  { prop: "rollUnitWeight", label: "单件耗重", width: 110 },
  { prop: "grossWeight", label: "产品毛重(g/个)", width: 130 },
  { prop: "utilBadWeight", label: "废料重", width: 100 },
  { prop: "remark", label: "备注", minWidth: 140 },
  { prop: "operation", label: "操作", fixed: "right", width: 210 },
]);

const openDrawer = (title: string, row: RawMaterRelation = {}) => {
  drawerRef.value?.acceptParams({
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addRawMater : title === "编辑" ? editRawMater : undefined,
    materOptions: materOptions.value,
    rawOptions: rawOptions.value,
    getTableList: proTableRef.value?.getTableList,
  });
};

const deleteOne = async (id: number) => {
  await ElMessageBox.confirm("确认删除这条产品原材料关系吗？", "提示", { type: "warning" });
  await deleteRawMater(id);
  ElMessage.success("删除成功");
  proTableRef.value?.getTableList();
};

const deleteSelected = async (ids: Array<string | number>) => {
  await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 条关系吗？`, "提示", { type: "warning" });
  await deleteBatchRawMater(ids.map(Number));
  ElMessage.success("批量删除成功");
  proTableRef.value?.clearSelection?.();
  proTableRef.value?.getTableList();
};

onMounted(async () => {
  await dictStore.loadDicts(["mater"]);
  materOptions.value = dictStore.dictMap.mater || [];
  const response: any = await getRawPage({ pageNum: 1, pageSize: 10000 } as any);
  const records = response?.data?.records || response?.data?.data?.records || [];
  rawOptions.value = records.map((item: any) => ({
    value: item.id,
    label: `${item.rawNum || ""} ${item.rawSpecs || ""}`.trim(),
  }));
});
</script>

<style scoped>
.raw-relation-container {
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
  .raw-relation-container {
    gap: 12px;
  }
}
</style>
