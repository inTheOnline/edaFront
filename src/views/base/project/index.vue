<template>
  <div class="project-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAllProject"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增项目</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除项目
          </el-button>
        </template>
        <!-- Expand -->
        <template #expand="scope">
          <div class="expand_div">
            <el-table :data="scope.row.maters" class="expand" style="width: 100%" v-show="scope.row.maters.length > 0">
              <el-table-column class="column" align="center" prop="mateNum" label="物料编号" />
              <el-table-column class="column" align="center" prop="mateName" label="物料名称" />
            </el-table>
            <div class="no_data" v-show="scope.row.maters.length == 0">
              <SvgIcon name="table404" :icon-style="{ width: '100%' }" />
              <p>暂无物料信息</p>
            </div>
          </div>
        </template>
        <!-- 表格操作 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="delect(scope.row)">删除</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, toRefs } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { getAllProject, addProject, delectProjects } from "@/api/modules/project";
import UserDrawer from "@/views/base/project/components/UserDrawer.vue";
import { CirclePlus, Delete, View, EditPen, Refresh } from "@element-plus/icons-vue";
import { getStateApi } from "@/api/modules/outgoing";
import { getIdMap } from "@/api/modules/cust";
import { ElMessage } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import { Project } from "@/api/interface/project";
import SvgIcon from "@/components/SvgIcon/index.vue";

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
const dataCallback = (data) => {
  // 数据回调
  return {
    list: data.records,
    total: data.total,
  };
};
const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "expand", label: "展开", width: 85 },
  {
    label: "项目编号",
    prop: "num",
  },
  {
    label: "项目名称",
    prop: "name",
    search: {
      el: "input",
      tooltip: "输入项目名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "客户名称",
    prop: "custId",
    search: {
      el: "select",
      tooltip: "输入项目名称进行搜索",
      props: {
        prefixIcon: "search",
        filterable: true,
      },
    },
    enum: getIdMap,
    fieldNames: { label: "custName", value: "custId" },
  },
  {
    label: "状态",
    prop: "active",
    enum: getStateApi,
    fieldNames: { label: "state", value: "value" },
    tag: true,
  },
  {
    label: "备注",
    prop: "remark",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);

// 打开抽屉
const openDrawer = async (title: string, row: Object = {}) => {
  console.log(title, row);
  const { data } = await getIdMap();
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addProject : title === "编辑" ? editProject : undefined,
    getTableList: proTableRef.value?.getTableList,
    custMapList: data,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async (ids: number[]): Promise<void> => {
  await delectProjects(ids);
  ElMessage.success("删除项目成功！`");
  proTableRef.value?.getTableList();
};
// 删除项目
const delect = async (data: Project): Promise<void> => {
  deleteSelected([data.id]);
};
// 编辑项目
const editProject = async (row: any) => {
  console.log("编辑数据", row);
};
</script>

<style lang="scss" scoped>
.project-container {
  display: flex;
  height: 91%;
}
.expand_div {
  margin: 0px 200px 10px 200px;
  padding: 5px;
  border-radius: 10px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.01);
}

.expand {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.el-table {
  font-family: "Arial", sans-serif;
  font-size: 14px;
}

.column {
  text-align: left;
}
.no_data p {
  text-align: center;
  margin-bottom: -10px;
}
</style>
