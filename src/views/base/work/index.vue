<template>
  <div class="work-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAllWork"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增工艺</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除工艺
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
import { getAllWork,addWork,delectWorks } from "@/api/modules/work";
import UserDrawer from "@/views/base/work/components/UserDrawer.vue";
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
    label: "工艺名称",
    prop: "workName",
    search: {
      el: "input",
      tooltip: "输入工艺名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
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
    api: title === "新增" ? addWork : title === "编辑" ? editWork : undefined,
    getTableList: proTableRef.value?.getTableList,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await delectWorks(ids);
  ElMessage.success("删除工艺成功！`")
  proTableRef.value?.getTableList();
};

// 编辑工艺
const editWork = async (row: any) => {
  console.log("编辑数据", row);
};
</script>

<style lang="scss" scoped>
.work-container {
  display: flex;
  width: 100%;
  height: 91%;
}
</style>
