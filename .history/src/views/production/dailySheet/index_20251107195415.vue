<template>
  <div class="work-container">
    <div>
      <ProTable
        class="Production-container"
        :columns="columns"
        :request-api="getProductionAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Production-Records"
        ref="proTableRef"
        striped
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增生产记录</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加</el-button>
          <el-button type="primary" :icon="Upload" plain @click="importAdd">导入生产记录</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出生产数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除生产记录
          </el-button>
        </template>
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteRecord(scope.row.id)">删除</el-button>
        </template>
      </ProTable>
    </div>
    <ProductionDrawer ref="drawerRef" />
    <BatchAddDialog ref="batchDialogRef" />
    <ImportExcel ref="dialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
// 注意：请根据实际项目路径调整API导入
import {
  getProductionAll,
  getProductionModel,
  addManyProduction,
  addBatchApi,
  deleteManyProduction,
  addProduction,
  editProduction,
  deleteProduction,
} from "@/api/modules/production";
import {
  getMapNum
} from "@/api/modules/mater";
import { useDownload } from "@/hooks/useDownload";
// 注意：请创建对应的抽屉组件
import ProductionDrawer from "@/views/production/dailySheet/components/ProductionDrawer.vue";
import BatchAddDialog from "@/views/production/dailySheet/components/BatchAddDialog.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";

const dictStore = useDictStore();
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof ProductionDrawer> | null>(null);
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const map =ref()
// 数据回调处理
const dataCallback = (data) => {
  return {
    list: data.records,
    total: data.total,
  };
};
const add = async(params:any) =>{
  await addProduction(params);
  proTableRef.value?.reset;
}
// 初始化加载字典
onMounted(async () => {
  // 加载产品和员工字典（与数据库关联的外键表）
  await dictStore.loadDicts(["mater", "staff"]);
  map.value=(await getMapNum()).data;

});

// 表格列配置
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  {
    label: "序号",
    prop: "id",
    width: 80,
    align: "center",
  },
  {
    label: "日期",
    prop: "date",
    search: {
      el: "date-picker",
      props: {
        type: "date",
        format: "YYYY-MM-DD",
      },
      tooltip: "选择生产日期搜索",
    },
    width: 120,
    align: "center",
  },
  {
    label: "产品编号",
    prop: "pid",
    enum: computed(()=>  map.value),
    fieldNames: { label: "num", value: "value" },
    // enum: mapTest,
    search: {
      el: "input",
      tooltip: "输入产品编号搜索",
    },
    width: 150,
    align: "center",
  },
  {
    label: "产品名称",
    prop: "pid",
    enum: computed(() => dictStore.dictMap["mater"]),
    search: {
      el: "select",
      enum: computed(() => dictStore.dictMap["mater"]),
      tooltip: "选择产品名称搜索",
    },
    width: 250,
    align: "center",
  },
  {
    label: "工序",
    prop: "process",
    search: {
      el: "input",
      tooltip: "输入工序名搜索",
    },
    align: "center",
  },
  {
    label: "机器序号",
    prop: "machine",
    search: {
      el: "input",
      tooltip: "输入机器序号搜索",
    },
    align: "center",
  },
  {
    label: "姓名",
    prop: "operatorId",
    enum: computed(() => dictStore.dictMap["staff"]),
    formatter: (row) => (row.operator_id ? dictStore.getLabel("staff", row.operatorId) : "无操作员"),
    search: {
      el: "select",
      enum: computed(() => dictStore.dictMap["staff"]),
      tooltip: "选择操作员搜索",
    },
    align: "center",
  },
  {
    label: "生产时间（H）",
    prop: "hours",
    search: {
      el: "input",
      type: "number",
      tooltip: "输入生产时间搜索",
    },
    align: "center",
  },
  {
    label: "数量",
    prop: "qty",
    search: {
      el: "input",
      type: "number",
      tooltip: "输入生产数量搜索",
    },
    align: "center",
  },
  {
    label: "不良品数",
    prop: "defect",
    search: {
      el: "input",
      type: "number",
      tooltip: "输入不良品数搜索",
    },
    align: "center",
  },
  {
    label: "备注",
    prop: "remark",
    search: {
      el: "input",
      tooltip: "输入备注搜索",
    },
    minWidth: 150,
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);

// 打开抽屉（新增/编辑/查看）
const openDrawer = async (title: string, row: Object = {}) => {
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? add : title === "编辑" ? editProduction : undefined,
    getTableList: proTableRef.value?.getTableList,
    // 传递字典数据给抽屉组件
    materialList: dictStore.dictMap["mater"] || [],
    staffList: dictStore.dictMap["staff"] || [],
  };
  drawerRef.value?.acceptParams(params);
};

// 批量删除
const deleteSelected = async (ids: number[]): Promise<void> => {
  await deleteManyProduction(ids);
  ElMessage.success("删除生产记录成功！");
  proTableRef.value?.getTableList();
};

// 单个删除
const deleteRecord = async (id: number) => {
  ElMessageBox.confirm("确定要删除这条生产记录吗？", "确认删除", {
    type: "warning",
  }).then(async () => {
    await deleteProduction(id);
    ElMessage.success("删除成功！");
    proTableRef.value?.getTableList();
  });
};

// 导出数据
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出生产记录数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getProductionModel, "生产记录列表", proTableRef.value?.searchParam),
  );
};
//批量添加
const addBatch=async (){

}
// 批量导入
const importAdd = () => {
  const params = {
    title: "生产记录",
    tempApi: getProductionModel,
    importApi: addManyProduction,
    getTableList: proTableRef.value?.getTableList,
  };
  dialogRef.value?.acceptParams(params);
};
// 批量添加
const batchDialogRef = ref<InstanceType<typeof BatchAddDialog> | null>(null);

const batchAdd = () => {
  const params = {
    materList: dictStore.dictMap["mater"] || [],
    staffList: dictStore.dictMap["staff"] || [],
    getTableList: proTableRef.value?.getTableList
  };
  batchDialogRef.value?.open(params);
};
</script>
<style lang="scss" scoped>
.Production-container {
  display: flex;
  width: 100%;
  height: 91%;
}
</style>
