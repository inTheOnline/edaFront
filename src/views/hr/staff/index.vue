<template>
  <div class="work-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAll"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="staff"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增职工</el-button>
          <el-button type="primary" :icon="Upload" plain @click="batchAdd">批量添加员工</el-button>
          <el-button type="primary" :icon="Download" plain @click="downloadFile">导出员工数据</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除职工
          </el-button>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteSelected(scope.row.id)">删除</el-button>
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
import { getAll,addStaff,deleteMany,deleteStaff,addManyStaff,getModel,editStaff,getChecksysMap,getExcel } from "@/api/modules/hr";
import { getDepartmentApi } from "@/api/modules/department";
import { getSex } from "@/api/modules/sex";
import { getStateApi } from "@/api/modules/outgoing";
import { useDownload } from "@/hooks/useDownload";
import UserDrawer from "@/views/hr/staff/components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh } from "@element-plus/icons-vue"; 
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
};
const checksysMap = ref()
onMounted(async ()=>{
  const { data:data1 } = await getChecksysMap();
  await dictStore.loadDicts(['depart']);
  checksysMap.value = data1
})
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",fixed: "left",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "工号",
    prop: "num",
    fixed: "left",
  },
  {
    label: "姓名",
    prop: "name",
    search: {
      el: "input",
      tooltip: "输入职工名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    fixed: "left",
  },
  {
    label: "年龄",
    prop: "age",
  },
  {
    label: "性别",
    prop: "sex",
    enum: getSex,
    fieldNames: { label: "sex", value: "id" },
  },
  {
    label: "部门",
    prop: "departmentId",
    tag: true,
        search: {
      el: "select",
      enum: computed(() => dictStore.dictMap['depart']),
      tooltip: "输入部门进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
    width: 150,
    enum: computed(() => dictStore.dictMap['depart']),
  },
  {
    label: "状态",
    prop: "state",
    tag: true,
    width: 150,
    enum: getStateApi,
    fieldNames: { label: "state", value: "value" },
  },
  {
    label: "身份证号",
    prop: "idCard",
    width: 300
  },
  {
    label: "宿舍号",
    prop: "live",
    width: 150,
  },
  {
    label: "手机号",
    prop: "phone",
    width: 150,
  },
  {
    label: "学历",
    prop: "edu",
    width: 150,
  },
  {
    label: "考勤制度",
    prop: "checksysId",
    enum: checksysMap,
    fieldNames: { label: "checksys", value: "id" },
    width: 150,
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);
// 打开抽屉
const openDrawer = async (title: string, row: Object = {}) => {
  // const { data:checksysMap } = await getChecksysMap();
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
    checksysMap,
    stateMap,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(id: number): Promise<void> => {
  await deleteStaff(id);
  ElMessage.success("删除职工成功！`")
  proTableRef.value?.getTableList();
};
// 导出职工列表
const downloadFile = async () => {
  ElMessageBox.confirm("确认导出用户数据?", "温馨提示", { type: "warning" }).then(() =>
    useDownload(getExcel, "职工列表", proTableRef.value?.searchParam)
  );
};
// 批量添加职工
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const batchAdd = () => {
  const params = {
    title: "职工",
    tempApi: getModel,
    importApi: addManyStaff,
    getTableList: proTableRef.value?.getTableList
  };
  dialogRef.value?.acceptParams(params);
};
// 编辑职工
const edit = async (row: any) => {
  await editStaff(row);
};
</script>

<style lang="scss" scoped>
.staff-container {
  display: flex;
  width: 100%;
  height: 91%;
}
</style>
