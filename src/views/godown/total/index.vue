<template>
  <div class="mater-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getTotal"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        striped=true
        :search-col="{ xs: 2, sm: 2, md: 3, lg: 3, xl: 4 }"
      >
        <template #tableHeader="scope">
          <!-- 客户单选下拉框 -->
          <el-select
            v-model="cust"
            placeholder="请选择客户"
            style="width: 200px; margin-right: 10px;"
            clearable 
          >
            <!-- 客户选项列表（可根据实际接口返回数据循环渲染） -->
            <el-option
              v-for="customer in dictStore.dictMap['cust']"
              :key="customer.label"
              :label="customer.label"
              :value="customer.value"
            />
          </el-select>
          <el-button type="primary" :icon="Download" @click="downloadFile">导出仓库数据</el-button>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">详情</el-button>
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
import { getTotal } from "@/api/modules/godown/flow";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "./components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh,Edit } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useAuthStore} from '@/stores/modules/auth'
import {useDictStore} from '@/stores/modules/dict'
import SvgIcon from "@/components/SvgIcon/index.vue";
import dayjs from "dayjs";
const dictStore = useDictStore()
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const cust = ref(null);
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
    label: "客户",
    prop: "cust",
    enum: computed(() => dictStore.dictMap["cust"]),
    fieldNames: { label: "label", value: "value" },
    search: {
      el: "select",
      enum: computed(() => dictStore.dictMap['cust']),
      fieldNames: { label: "label", value: "value" },
      props: { 
        filterable: true, 
        placeholder: "请选择客户",
    },
    width: 100,
    },
  },
  {
    label: "产品编号",
    prop: "materNum",
    search: {
      el: "input",
      props: { 
        filterable: true, 
        placeholder: "输入产品编号或名称搜索",
    },
    },
    minWidth: 150,
    align: "center",
  },
  {
    label: "产品名称",
    prop: "materName",
    search: {
      el: "input",
      props: { 
        filterable: true, 
        placeholder: "输入产品名称搜索",
      },
    },
    minWidth: 300,
    align: "center",
  },
  {
    label: "未检数量(pcs)",
    prop: "readyNumber",
    width: 100,
  },
  {
    label: "库存数量(pcs)",
    prop: "stockNumber",
    width: 100,
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 250,
  },
  { prop: "operation", label: "操作", fixed: "right", width: 100 },
]);

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
// 导出仓库列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getModel, "仓库列表", proTableRef.value?.searchParam)
  );
};

</script>

<style lang="scss" scoped>
.expand_div{
  margin: 0px 200px 10px 200px;
  border-radius: 10px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
}
</style>
