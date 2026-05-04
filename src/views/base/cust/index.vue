<template>
  <div class="cust-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAllCust"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增客户</el-button>
        </template>
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteFunction(scope.row.custId)">删除</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, toRefs,onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { getAllCust,addCust,delectCusts,deleteCust } from "@/api/modules/cust.ts";
import { CirclePlus, Delete, EditPen, Download, Upload, View, Refresh,Edit } from "@element-plus/icons-vue"; 
import { getStateApi } from "@/api/modules/outgoing";
import UserDrawer from "@/views/base/cust/components/UserDrawer.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import { useDictStore } from "@/stores/modules/dict";
import { de } from "element-plus/es/locale";

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dictStore = useDictStore();
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
  };
onMounted(async () => {
  await dictStore.loadDicts(['state']);
});
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",fixed: "left",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "客户简称",
    prop: "custNum",
  },
  {
    label: "客户名称",
    prop: "custName",
    search: {
      el: "input",
      tooltip: "输入客户名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "状态",
    prop: "active", tag: true,
     enum: getStateApi, 
     fieldNames: { label: "state", value: "value" },
  },
  {
    label: "备注",
    prop: "remark",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 250 },
]);

// 打开抽屉
const openDrawer = (title: string, row: Object = {}) => {
  console.log(title, row);
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addCust : title === "编辑" ? editCust : undefined,
    getTableList: proTableRef.value?.getTableList,
    stateEnum: dictStore.dictMap['state'],
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await delectCusts(ids);
  ElMessage.success("删除客户成功！`")
  proTableRef.value?.getTableList();
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
    await deleteCust(id);
    ElMessage.success("删除成功!");

    // 刷新表格（根据需要选择 reset 或 getTableList）
    proTableRef.value?.reset();
  } catch (error) {
    // 用户点击了“取消” 或 弹窗被关闭
    ElMessage.info("已取消删除");
  }
};
// 编辑客户
const editCust = async (row: any) => {
  console.log("编辑数据", row);
};
</script>

<style lang="scss" scoped>
.Cust-container {
  display: flex;
  height: 91%;
}
</style>
