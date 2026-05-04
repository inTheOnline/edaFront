<template>
  <div class="mater-container">
    <div>
      <ProTable
        class="protable"
        :columns="columns"
        :request-api="getAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        striped=true
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 3, xl: 4 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增供应商报价</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加供应商报价</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出供应商报价数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除供应商报价
          </el-button>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteOne(scope.row.id)">删除</el-button>
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
import { getAll,getModel,addMany,deleteMany,add,edit,deleteById } from "@/api/modules/supWork";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "./components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useDictStore} from '@/stores/modules/dict'
import { sortUserPlugins } from "vite";
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
  await dictStore.loadDicts(['mater']);
});
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "供应商名称",
    prop: "supName",
    search: {
      el: "input",
      tooltip: "输入供应商编号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    minWidth: 150,
  },
  {
    label: "工艺名",
    prop: "work",
    minWidth: 150,
    search: {
      el: "input",
      tooltip: "输入工艺名进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "物料编号",
    prop: "materNum",
    minWidth: 250,
    search: {
      el: "input",
      tooltip: "输入物料编号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "物料名称",
    prop: "materName",
    minWidth:300,
    search: {
      el: "input",
      tooltip: "输入物料名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "报价",
    prop: "price",
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

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await deleteMany(ids);
  ElMessage.success("删除供应商报价成功！`")
  proTableRef.value?.getTableList();
};
// 导出供应商报价列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getModel, "供应商报价列表", proTableRef.value?.searchParam)
  );
};
async function deleteOne  (id:number){
  await deleteById(id);
}
// 批量添加供应商报价
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "供应商报价",
    tempApi: getModel,
    importApi: addMany,
  };
  dialogRef.value?.acceptParams(params);
};
</script>

<style lang="scss" scoped>
.protable {
  height: 80%;
  /* 或者只是用于类名标记，不写任何样式也是允许的 */
}
</style>
