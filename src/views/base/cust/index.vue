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
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除客户
          </el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, toRefs } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { getAllCust,addCust,delectCusts } from "@/api/modules/cust.ts";
import { getStateApi } from "@/api/modules/outgoing";
import UserDrawer from "@/views/base/cust/components/UserDrawer.vue";
import { CirclePlus, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dataCallback = (data) => {    // 数据回调
    return {
      list: data.records,
      total: data.total
    };
  };
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",fixed: "left",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
  {
    label: "客户编号",
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
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await delectCusts(ids);
  ElMessage.success("删除客户成功！`")
  proTableRef.value?.getTableList();
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
