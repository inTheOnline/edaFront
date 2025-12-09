<template>
  <div class="mater-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        striped=true
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 5, xl: 4 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增物料</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加物料</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出物料数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除物料
          </el-button>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive,onMounted,computed } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { getAll,getModel,addMany,deleteMany,addMater,editMater,deleteMaterById } from "@/api/modules/mater";
import { getDepartmentApi } from "@/api/modules/department";
import { getStateApi } from "@/api/modules/outgoing";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "./components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useAuthStore} from '@/stores/modules/auth'
import {useDictStore} from '@/stores/modules/dict'
import SvgIcon from "@/components/SvgIcon/index.vue";
import { deleteById } from "@/api/modules/supWork";
const authStore = useAuthStore();
const dictStore = useDictStore()
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
};
onMounted(async () => {
  await dictStore.loadDicts(['cust','user','mater','project']);
});
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "项目",
    prop: "projectId",
    enum: computed(() => dictStore.dictMap['project']),
  },
  {
    label: "物料编号或名称",
    prop: "mateNum",
    search: {
      el: "input",
      tooltip: "输入物料编号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 150
  },
  {
    label: "终端客户物料编号",
    prop: "finalSpecs",
    search: {
      el: "input",
      tooltip: "输入终端客户物料编号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 150
  },
  {
    label: "客户",
    prop: "custId",
    enum: computed(() => dictStore.dictMap['cust']),
    search: {
      el: "select",
      enum: computed(() => dictStore.dictMap['cust']),
      tooltip: "输入客户进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 100
  },
  {
    label: "实际重量(kg)",
    prop: "weight",
  },
  {
    label: "表面积(mm²)",
    prop: "s",
  },
  {
    label: "理论重量(g)",
    prop: "theoryWeight",
  },
  {
    label: "价格(元)",
    prop: "price",
    isShow:authStore.isExistence("price:look")
  },
  { prop: "operation", label: "操作", fixed: "right", width: 250 },
]);

// 打开抽屉
const openDrawer = async (title: string, row: Object = {}) => {
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addMater : title === "编辑" ? editOrder : undefined,
    getTableList: proTableRef.value?.getTableList,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await deleteMany(ids);
  ElMessage.success("删除物料成功！`")
  proTableRef.value?.getTableList();
};
// 导出物料列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getModel, "物料列表", proTableRef.value?.searchParam)
  );
};
// 批量添加物料
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "物料",
    tempApi: getModel,
    importApi: addMany,
    getTableList: proTableRef.value?.getTableList
  };
  dialogRef.value?.acceptParams(params);
};
// 编辑物料
const editOrder = async (row: any) => {
  await editMater(row);
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
    await deleteMaterById(id);
    ElMessage.success("删除成功");

    // 刷新表格（根据需要选择 reset 或 getTableList）
    proTableRef.value?.getTableList();
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
</style>
