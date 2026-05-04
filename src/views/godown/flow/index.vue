<template>
  <div class="mater-container">
    <div class="ProTable">
      <ProTable
        class="ProTable-container"
        height="calc(100vh - 260px)"
        :columns="columns"
        :request-api="getFlow"
        :dataCallback="dataCallback"
        :initParam="initParam"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        striped=true
        :search-col="{ xs: 2, sm: 2, md: 3, lg: 3, xl: 4 }"
        @row-click="handleRowClick"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增仓库流水</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出仓库流水数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除仓库流水
          </el-button>
          <StatisticsBar
            :list="selectedList "
            :config="statConfig"
          >
            <template #extra>
                <el-button type="primary" plain @click="allSelect">当页全选</el-button>
            </template>
          </StatisticsBar>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteFunction(scope.row.id)">删除</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
    <ImportExcel ref="dialogRef" />
    <BatchAddDialog ref="batchDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive,onMounted,computed  } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { getFlow,deleteFlowBatch,addFlow,editFlow,deleteFlow } from "@/api/modules/godown/flow";
import { getDepartmentApi } from "@/api/modules/department";
import { getStateApi } from "@/api/modules/outgoing";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "./components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh,Edit } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useAuthStore} from '@/stores/modules/auth'
import {useDictStore} from '@/stores/modules/dict'
import SvgIcon from "@/components/SvgIcon/index.vue";
import BatchAddDialog from "@/views/godown/flow/components/BatchAddDialog.vue";
import { typeEnum,GodownTypeEnum } from "@/enums/godownEnum";
import StatisticsBar from "@/components/My/StatisticsBar/index.vue";
import dayjs from "dayjs";
const authStore = useAuthStore();
const dictStore = useDictStore()
const priceDialogRef =ref(null);
const initParam =ref({cust:""});
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const materEnum = computed(() => dictStore.dictMap["mater"]);
const selectedList = computed(() => proTableRef.value?.selectedList || []);
// 批量添加
const batchDialogRef = ref<InstanceType<typeof BatchAddDialog> | null>(null);
const formatFlowDate = (value?: string | null) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = dayjs(text);
  if (!parsed.isValid()) return text;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
    return parsed.tz("Asia/Shanghai").format("YYYY-MM-DD");
  }

  return parsed.format("YYYY-MM-DD");
};
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
};
// 🔥 新增：点击行任意位置 选中/取消
const handleRowClick = async (row: any) => {
  // 等待DOM更新
  // await nextTick()
  // 调用ProTable内部表格的切换选中方法
  proTableRef.value?.element?.toggleRowSelection(row)
}
onMounted(async () => {
  await dictStore.loadDicts(['cust','user','mater','project']);
});
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "创建时间",
    prop: "createdAt",
    render: (scope:any) => {
      return formatFlowDate(scope.row.createdAt);
    },
    search: {
      el: "date-picker",
      props: {
        type: "daterange",
        format: "YYYY-MM-DD",
        valueFormat: "YYYY-MM-DD",
        "start-placeholder": "开始日期",
        "end-placeholder": "结束日期",
        style: "width: 100%",
      },
    },
    width:125,
  },
  {
    label: "产品编号",
    prop: "materId",
    enum: computed(() => dictStore.dictMap["mater"]),
    fieldNames: { label: "num", value: "value" },
    search: {
      el: "select",
      props: { 
        filterable: true, 
        placeholder: "输入产品编号搜索",
        'default-first-option': true
    },
    },
    width: 150,
    align: "center",
  },
  {
    label: "产品名称",
    prop: "materId",
    enum: computed(() => dictStore.dictMap["mater"]),
    search: {
      el: "select",
      // enum: computed(() => dictStore.dictMap["mater"]),
      props: { 
        filterable: true, 
        placeholder: "输入产品名称搜索",
        'default-first-option': true
      },
    },
    minWidth:150,
    align: "center",
  },
  {
    label: "流水类型",
    prop: "flowType",
    isFilterEnum:false,
    tag: true,
    enum: GodownTypeEnum,
    search: {
      el: "select",
      tooltip: "请选择流水类型",
      props: {
        clearable: true,
        prefixIcon: "search",
      },
      
    },
    width: 150
  },
  {
    label: "类型",
    prop: "type",
    enum: computed(() => typeEnum),
    isShow: false,
    search: {
      el: "select",
      tooltip: "请选择类型",
      props: {
        prefixIcon: "search",
      },
    },
    width: 100
  },
  {
    label: "数量(pcs)",
    prop: "number",
    width:100,
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    render: (scope:any) => {
      return formatFlowDate(scope.row.updatedAt);
    },
  },
  {
    label: "备注",
    prop: "remark",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 250 },
]);

const statConfig = [
  { label: "总数量", field: "number", type: "sum" },
];
// 打开抽屉
const openDrawer = async (title: string, row: Object = {}) => {
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addFlow : title === "编辑" ? editFlow : undefined,
    getTableList: proTableRef.value?.getTableList,
    materialList: dictStore.dictMap['mater'] // 传递物料列表供下拉选择使用
  };
  drawerRef.value?.acceptParams(params);
};
//全选方法
const allSelect = ()=>{
  proTableRef.value?.element?.toggleAllSelection();
}
// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      "此操作将永久删除 " + ids.length + " 条记录，是否继续？",
      "删除确认",
      {
        confirmButtonText: "OK",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await deleteFlowBatch(ids);
    ElMessage.success("删除成功!");
    proTableRef.value?.getTableList();
  } catch (error) {
    ElMessage.info("取消批量删除");
  }
};
// 导出仓库流水列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getModel, "仓库流水列表", proTableRef.value?.searchParam)
  );
};
// 批量添加仓库流水
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = async () => {
  const params = {
    materList: materEnum.value || [],
    getTableList: proTableRef.value?.getTableList
  };
  batchDialogRef.value?.open(params);
};

const deleteFunction = async (id: number) => {
  try {
    // 弹出二次确认框
    await ElMessageBox.confirm(
      "此操作将永久删除该数据，是否继续？",
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 用户点击了“确定”
    await deleteFlow(id);
    ElMessage.success("删除成功!");

    // 刷新表格（根据需要选择 reset 或 getTableList）
    proTableRef.value?.reset();
  } catch (error) {
    // 用户点击了“取消” 或 弹窗被关闭
    ElMessage.info("已取消删除");
  }
};
</script>

<style lang="scss" scoped>
.expand_div{
  margin: 0px 200px 10px 200px;
  border-radius: 10px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
}
//固定表头
.ProTable{
  height: 75vh;
}
.ProTable-container {
  display: flex;
  width: 100%;
  height: 70%;
}
// 🔥 新增：鼠标悬浮行变成小手，提示可点击
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
