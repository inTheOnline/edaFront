<template>
  <div class="work-container">
    <div>
      <!-- {{dictStore.loadDict('cust')}} -->
      <ProTable
      class="\"
        :columns="columns"
        :request-api="getOrderAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        striped=true
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
      >
        <!-- 1.表格展开Expand -->
        <template #expand="scope">
          <div class="expand_div">
            <el-table :data="scope.row.maters" class="expand" style="width: 100%" v-show="scope.row.maters.length > 0">
              <el-table-column class="column" align="center" prop="materId" label="物料名称" 
              :formatter="(row) => dictStore.getLabel('mater',row.materId) || '未知物料'"
              />
              <el-table-column class="column" align="center" prop="totalNumber" label="订单数量" />
              <el-table-column class="column" align="center" prop="alreadyNumber" label="已交数量" />
              <el-table-column class="column" align="center" prop="notAlreadyNumber" label="未交数量" />
            </el-table>
            <div class="no_data" v-show="scope.row.maters.length == 0">
              <SvgIcon name="table404" :icon-style="{ width: '100%' }" />
              <p>暂无物料信息</p>
            </div>
          </div>
        </template>
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增订单</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加订单</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出订单数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除订单
          </el-button>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="delect(scope.row.id)">删除</el-button>
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
import { getOrderAll,getModel,addManyOrder,deleteMany,addOrder,editOrder,delect } from "@/api/modules/order";
import { getDepartmentApi } from "@/api/modules/department";
import { getStateApi } from "@/api/modules/outgoing";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "@/views/order/orderTable/components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useMapStore} from '@/stores/modules/map'
import {useDictStore} from '@/stores/modules/dict'
import SvgIcon from "@/components/SvgIcon/index.vue";
const mapStote = useMapStore();
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
  await dictStore.loadDicts(['cust','user','mater']);
  
});
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "expand", label: "展开", width: 85 },
  {
    label: "订单编号",
    prop: "orderNum",
    search: {
      el: "input",
      tooltip: "输入订单编号进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 150
  },
  {
    label: "开始时间",
    prop: "createTime",
  },
  {
    label: "完成时间",
    prop: "lateTime",
  },
  {
    label: "状态",
    prop: "state",
    tag: true,
    enum: getStateApi,
    fieldNames: { label: "state", value: "value" },
  },
  {
    label: "客户",
    prop: "custId",
    enum: computed(() => dictStore.dictMap['cust']),
    // fieldNames: { label: "custName", value: "custId" },
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
    label: "创建人",
    prop: "createUserId",
    enum: computed(() => dictStore.dictMap['user']),
    search: {
      el: "select",
      enum: computed(() => dictStore.dictMap['user']),
      tooltip: "输入创建人进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);

// 打开抽屉
const openDrawer = async (title: string, row: Object = {}) => {
  const { data:departmentMap} = await getDepartmentApi()
  const { data } = await getStateApi()
   // 过滤出 value 能被 5 整除的对象
   const stateMap = data.filter(item => item.value % 5 === 0);
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addOrder : title === "编辑" ? editOrder : undefined,
    getTableList: proTableRef.value?.getTableList,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await deleteMany(ids);
  ElMessage.success("删除订单成功！`")
  proTableRef.value?.getTableList();
};
// 导出订单列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getModel, "订单列表", proTableRef.value?.searchParam)
  );
};
// 批量添加订单
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "订单",
    tempApi: getModel,
    importApi: addManyOrder,
    getTableList: proTableRef.value?.getTableList
  };
  dialogRef.value?.acceptParams(params);
};
</script>

<style lang="scss" scoped>
.Order-container {
  display: flex;
  width: 100%;
  height: 91%;
}
.expand_div{
  margin: 0px 200px 10px 200px;
  border-radius: 10px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
}
</style>
