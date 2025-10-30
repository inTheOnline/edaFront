<template>
    <div class="orderMater-container">
      <div>
        <ProTable
          :columns="columns"
          :request-api="getOrderOut"
          :dataCallback="dataCallback"
          :pagination="true"
          :tool-button="['refresh', 'setting', 'search']"
          row-key="id"
          title="Outgoing-Form"
          ref="proTableRef"
          :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
        >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="Right" @click="goOut">出货登记</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加出货</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出出货数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除出货
          </el-button>
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
  import { getOrderOut,getModel,addMany,deleteMany,addOrderOut } from "@/api/modules/orderOut";
  import { getDepartmentApi } from "@/api/modules/department";
  import { getStateApi } from "@/api/modules/outgoing";
  import { useDownload } from "@/hooks/useDownload";
  import UserDrawer from "@/views/order/orderTable/components/UserDrawer.vue";
  import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh,Right } from "@element-plus/icons-vue"; 
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
    {
      label: "时间",
      prop: "time",
    },
    {
      label: "送货单号",
      prop: "num",
      search: {
        el: "input",
        tooltip: "输入送货单号进行搜索",
        props: {
          prefixIcon: "search",
        },
      },
      width: 150
    },
    {
      label: "订单号",
      prop: "orderId",
      search: {
        el: "input",
        tooltip: "输入出货号进行搜索",
        props: {
          prefixIcon: "search",
        },
      },
      width: 150
    },
    {
      label: "物料编号",
      prop: "materId",
    },
    {
      label: "物料名称",
      prop: "materId",
      width: 250,
      search: {
        el: "input",
        tooltip: "输入物料名称进行搜索",
        props: {
          prefixIcon: "search",
        },
      },
    },
    {
      label: "送货数量",
      prop: "number",
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
      width: 80
    },
    {
      label: "备注",
      prop: "remark",
    },
    // { prop: "operation", label: "操作", fixed: "right", width: 330 },
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
      departmentMap,
      stateMap,
    };
    drawerRef.value?.acceptParams(params);
  };
  
  // 删除已选项目
  const deleteSelected = async(ids: number[]): Promise<void> => {
    await deleteMany(ids);
    ElMessage.success("删除出货成功！`")
    proTableRef.value?.getTableList();
  };
  // 导出出货列表
  const downloadFile = async () => {
    ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
      useDownload(getModel, "出货列表", proTableRef.value?.searchParam)
    );
  };
  // 批量添加出货
  const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
  const batchAdd = () => {
    const params = {
      title: "送货数据",
      tempApi: getModel,
      importApi: addMany,
      getTableList: proTableRef.value?.getTableList
    };
    dialogRef.value?.acceptParams(params);
  };
  // 编辑出货
  const editOrder = async (row: any) => {
    console.log("编辑数据", row);
  };
  </script>
  
  <style lang="scss" scoped>
  .orderMater-container {
    height: 91%;
  }
  </style>
  