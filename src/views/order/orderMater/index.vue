<template>
    <div class="orderMater-container">
      <div>
        <ProTable
          :columns="columns"
          :request-api="getOrderMater"
          :initParam="initParam"
          :dataCallback="dataCallback"
          :pagination="true"
          :tool-button="['refresh', 'setting', 'search']"
          row-key="id"
          title="orderMater-Form"
          ref="proTableRef"
          :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
        >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="Right" @click="goOut">安排出货</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加订单</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出订单数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="delect(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除订单
          </el-button>
          <el-switch v-model="isShowFinish" active-text="显示已完成" inactive-text="隐藏已完成" />
          <el-button  type="primary" @click="reset()"> 重置状态</el-button>
        </template>
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openWindow(scope.row)">查看</el-button>
        </template>
        </ProTable>
      </div>
      <UserDrawer ref="drawerRef" />
      <ImportExcel ref="dialogRef" />
      <el-dialog
        v-model="openTrue"
        title="订单出货详情"
        width="800"
      >
        <el-table :data="backTable" stripe style="width: 100%">
          <el-table-column prop="orderDate" label="时间" width="180" />
          <el-table-column prop="outNum" label="出库单号" width="180" />
          <el-table-column prop="number" label="数量" />
          <el-table-column prop="user" label="操作人" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
        <template #footer>
          <div class="dialog-footer">
            <!-- <el-button @click="openWindow = false">Cancel</el-button> -->
            <el-button type="primary" @click="openTrue = false">
              关闭
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
</template>
  
  <script lang="ts" setup>
  import { ref, reactive,onMounted,computed } from "vue";
  import ProTable from "@/components/ProTable/index.vue";
  import ImportExcel from "@/components/ImportExcel/index.vue";
  import { getOrderMater,getModel,addManyOrder,deleteMany,addOrder,getAboutById,delect,reset } from "@/api/modules/order";
  import { getStateApi } from "@/api/modules/outgoing";
  import { useDownload } from "@/hooks/useDownload";
  import UserDrawer from "@/views/order/orderTable/components/UserDrawer.vue";
  import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh,Right } from "@element-plus/icons-vue"; 
  import { ElMessageBox } from "element-plus";
  import { ColumnProps } from "@/components/ProTable/interface";
  import {useMapStore} from '@/stores/modules/map'
  import {useDictStore} from '@/stores/modules/dict'
  import {useRouter} from 'vue-router'
import { sortUserPlugins } from "vite";
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
  const router = useRouter()
  const goOut = ()=>{
    console.log(router.push("/order/orderOut"))
  }
  const columns: ColumnProps[] = reactive([
    { type: "selection", label: "选择", prop: "id", align: "center" },
    {
      label: "时间",
      prop: "localTime",
    },
    { label: "客户",prop: "custId", search: {
        el: "select",
        tooltip: "请选择客户",
        enum: computed(() => dictStore.dictMap['cust']),
        props: {
          prefixIcon: "search",
        },
      },
      enum: computed(() => dictStore.dictMap['cust'])},
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
      label: "物料编号",
      prop: "materNum",
      width: 250,
    },
    {
      label: "物料名称",
      prop: "materName",
      search: {
        el: "input",
        tooltip: "输入物料名称进行搜索",
        props: {
          prefixIcon: "search",
        },
      },
    },
    {
      label: "订单总数",
      prop: "totalNumber",
      width: 100
    },
    {
      label: "已交数量",
      prop: "alreadyNumber",
      width: 90
    },
    {
      label: "未交数量",
      prop: "notAlreadyNumber",
      width: 90
    },
    {
      label: "创建人",
      prop: "createUserId",
      enum: computed(() => dictStore.dictMap['user']),
      search: {
        el: "select",
        enum: computed(() => dictStore.dictMap['user']),
        tooltip: "选择创建人",
        props: {
          prefixIcon: "search",
        },
      },
      width: 80
    },
    { label: "状态", prop: "state", tag: true, enum: getStateApi, fieldNames: { label: "state", value: "value" }, width: 150 },
    {
      label: "备注",
      prop: "remark",
    },
    { prop: "operation", label: "操作", fixed: "right", width: 110 },
  ]);
  
  const backTable = ref([])
  let openTrue = ref(false)
  const openWindow = async (row)=>{
    const {data} = await getAboutById(row.id);
    backTable.value = data; //
    openTrue.value = true;
    console.log(backTable)
  }
  const isShowFinish = ref(false)
  const initParam = reactive({state: isShowFinish ? 31 : null })
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
  // .orderMater-container {
  //   display: flex;
  //   width: 100%;
  //   height: 91%;
  // }
  </style>
  