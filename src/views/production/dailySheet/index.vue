<template>
  <div class="work-container">
    <div class="ProTable">
      <ProTable
        class="ProTable-container"
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
        :virtualized="true"
        :table-height="'70vh'"
        @row-click="handleRowClick"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加</el-button>
          <el-button type="primary" :icon="Upload" plain @click="importAdd">导入记录</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除
          </el-button>
          <div class="card-header" style="display: flex; align-items: center; gap: 20px; margin-top: 8px;">
            <!-- 精简版 Descriptions，去掉边框，缩小字体 -->
            <el-descriptions :column="2" size="small" style="display: flex; gap: 30px;">
              <el-descriptions-item>
                <template #label>
                  <span class="totalLabel">数量总计：</span>
                </template>
                <span class="totalValue">
                  {{ Number(numnberTotal).toLocaleString() }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label>
                  <span class="totalLabel" >生产时间总计(H)：</span>
                </template>
                <span class="totalValue">
                  {{ Number(timeTotal).toLocaleString() }}
                </span>
              </el-descriptions-item>
            </el-descriptions>
          
            <el-button type="primary" plain @click="allSelect">当页全选</el-button>
            <el-button type="primary" plain @click="cancelSelect">取消选择</el-button>
          </div>
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
import { ref, reactive, onMounted, computed,watch } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
// 注意：请根据实际项目路径调整API导入
import {
  getProductionAll,
  getProductionModel,
  addManyProduction,
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

const materEnum = computed(() => dictStore.dictMap["mater"]);
const staffEnum = computed(() => dictStore.dictMap["staff"]);
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
// 🔥 新增：点击行任意位置 选中/取消
const handleRowClick = async (row: any) => {
  // 调用ProTable内部表格的切换选中方法
  proTableRef.value?.element?.toggleRowSelection(row)
}
// 初始化加载字典
onMounted(async () => {
  // 加载产品和员工字典（与数据库关联的外键表）
  if (!materEnum.value?.length) {
    await dictStore.loadDicts(["mater", "staff"]);
  }
  map.value = (await getMapNum()).data;

});

// watch(
//   () => proTableRef.value?.selectedList,
//   (val) => {
//     numnberTotal.value = 0;
//     timeTotal.value = 0;
//     val.forEach(e => {
//       numnberTotal.value+=e.qty;
//       timeTotal.value = (Number(timeTotal.value) + Number(e.hours)).toFixed(2);
//     });
//   },
//   { deep: true }
// );
//解决上一段代码watch太重
const selectedList = computed(() => proTableRef.value?.selectedList || []);

const numnberTotal = computed(() =>
  selectedList.value.reduce((sum, e) => sum + (e.qty || 0), 0)
);

const timeTotal = computed(() =>
  selectedList.value
    .reduce((sum, e) => sum + Number(e.hours || 0), 0)
    .toFixed(2)
);
// 表格列配置
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "日期",
    prop: "date",
    search: {
    el: "date-picker",
    props: {
      type: "daterange",
      format: "YYYY-MM-DD",
      valueFormat: "YYYY-MM-DD",
      startPlaceholder: "开始日期",
      endPlaceholder: "结束日期",
    },
    tooltip: "选择生产日期区间搜索",
    },
    width: 120,
    align: "center",
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
    minWidth: 150,
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
    enum: staffEnum,
    search: {
      el: "select",
      props: { 
        filterable: true, 
        placeholder: "输入姓名进行搜索",
        'default-first-option': true
      },
    },
    align: "center",
  },
  {
    label: "生产时间（H）",
    prop: "hours",
    search: {
      el: "input",
      tooltip: "输入生产时间搜索",
    },
    align: "center",
  },
  {
    label: "数量",
    prop: "qty",
    search: {
      el: "input",
      tooltip: "输入生产数量搜索",
    },
    align: "center",
  },
  {
    label: "不良品数",
    prop: "defect",
    search: {
      el: "input",
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
  { prop: "operation", label: "操作", fixed: "right", width: 220 },
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
    materialList: materEnum || [],
    staffList: staffEnum || [],
  };
  drawerRef.value?.acceptParams(params);
};
//全选方法
const allSelect = ()=>{
  proTableRef.value?.element?.toggleAllSelection();
}
//取消选择方法
const cancelSelect = ()=>{
  proTableRef.value?.element?.clearSelection();
}
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
// 批量导入
const importAdd = async () => {
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

const batchAdd = async () => {
  const params = {
    materList: materEnum.value || [],
    staffList: staffEnum.value || [],
    getTableList: proTableRef.value?.getTableList
  };
  batchDialogRef.value?.open(params);
};
</script>
<style lang="scss" scoped>
// .card-header {
//   display: flex;
//   align-items: center;
// }

// .total {
//   font-size: 15px;
//   width: 100px;
//   // margin: 5px 30px  5px 0; /* 按钮往右挪一点 */
// }
.ProTable-container {
  display: flex;
  width: 100%;
  height: 70%;
}
.ProTable{

  height: 75vh;
}

.totalLabel {
  font-size: 14px;
  font-weight: normal;
}
.totalValue {
  font-size: 18px;
  margin-right: 8px;
  color: var(--el-color-primary);
}
// 🔥 新增：鼠标悬浮行变成小手，提示可点击
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
