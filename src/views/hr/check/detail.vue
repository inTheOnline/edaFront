<template>
  <div class="work-container">
    <div>
      <el-card class="title">
          深圳市意达五金制品有限公司({{ route.query.year }}年{{ route.query.month }}月份)工资明细表
      </el-card>
      <ProTable
       class="table-main"
        :columns="columns"
        :request-api="getAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }"
        v-if="isShow"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">上传员工考勤数据</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出员工考勤数据</el-button>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
    <ImportExcel ref="dialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive,onMounted, computed } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { getAll,addStaff,deleteMany,addManyCheck,getCheckModel,getDateDetails } from "@/api/modules/hr";
import { getDepartmentApi } from "@/api/modules/department";
import { getStateApi } from "@/api/modules/outgoing";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "@/views/hr/staff/components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox,ElCard } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useRoute} from 'vue-router'

// // 接受父组件传递的参数
// const props = defineProps(['year','month'])
const route = useRoute()
const year=route.query.year;
const month=route.query.month;
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const isShow = ref();
let details = ref([]);
//初始化
onMounted(async()=>{
  const { data }=await getDateDetails(year,month);
  details.value=data;
  isShow.value = true;
})
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
  };
const columns: ColumnProps[] = computed(()=> reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  {
    label: "工号",
    prop: "num",
    fixed: "left",
    width: 150,
  },
  {
    label: "姓名",
    prop: "name",
    fixed: "left",
    width: 150,
  },
  ...details.value,
])); 

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
    api: title === "新增" ? addStaff : title === "编辑" ? editStaff : undefined,
    getTableList: proTableRef.value?.getTableList,
    departmentMap,
    stateMap,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await deleteMany(ids);
  ElMessage.success("删除职工成功！`")
  proTableRef.value?.getTableList();
};
// 导出职工列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getCheckModel, "职工列表", proTableRef.value?.searchParam)
  );
};
// 员工考勤
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "员工考勤数据",
    tempApi: getCheckModel,//模版api
    importApi: addManyCheck,//上传api
    getTableList: proTableRef.value?.getTableList
  };
  dialogRef.value?.acceptParams(params);
};
// 编辑职工
const editStaff = async (row: any) => {
  console.log("编辑数据", row);
};
</script>

<style lang="scss" scoped>
.title{
  text-align: center;
  margin-bottom: 10px;
  font-size: 23px;
  font-weight: 700;
  color: var(--el-text-color-regular);
}
.staff-container {
  display: flex;
  width: 100%;
  height: 91%;
}
.table-main {
  overflow-x: auto;
}
</style>
