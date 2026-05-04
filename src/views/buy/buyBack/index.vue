<template>
  <div class="outform">
    <TreeFilter label="supName" value="id" title="产品列表(单选)" :request-api="supTreeApi" @change="changeTreeFilter" />
    <div class="table-box">
      <ProTable
        :columns="columns"
        :request-api="outFormApi"
        :dataCallback="dataMap"
        :initParam="initParam"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }"
      >
        <!-- 1.表格展开Expand -->
        <template #expand="scope">
          <div class="expand_div">
            <el-table :data="scope.row.maters" class="expand" style="width: 100%" v-show="scope.row.maters.length > 0">
              <el-table-column class="column" align="center" prop="materNum" label="物料编号" />
              <el-table-column class="column" align="center" prop="materName" label="物料名称" />
              <el-table-column class="column" align="center" prop="number" label="回执数量" />
              <el-table-column class="column" align="center" prop="backNumber" label="已回数量" />
              <el-table-column class="column" align="center" prop="notbackNumber" label="未回数量" />
            </el-table>
            <div class="no_data" v-show="scope.row.maters.length == 0">
              <SvgIcon name="table404" :icon-style="{ width: '100%' }" />
              <p>暂无物料信息</p>
            </div>
          </div>
        </template>
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="delect(scope.row.id)">删除</el-button>
        </template>
        <!-- 3.表格顶部操作按钮区域 -->
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增回执</el-button>
          <el-button type="primary" :icon="Download" plain @click="updataList(scope.selectedList)">导出回执</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteOutform(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除回执
          </el-button>
        </template>
        <!-- 4.自定义无数据插槽 -->
        <template #empty>
          <SvgIcon name="table404" :icon-style="{ width: '100%' }" />
          <div>暂无数据</div>
        </template>
      </ProTable>
      <UserDrawer ref="drawerRef" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from "vue";
import dayjs from 'dayjs';
import { outFormApi, custDetailApi, getStateApi, getSupMapApi, addOutform, supTreeApi, deleteList } from "@/api/modules/outgoing";
import ProTable from "@/components/ProTable/index.vue";
import TreeFilter from "@/components/TreeFilter/index.vue";
import UserDrawer from "@/views/outgoing/outform/components/UserDrawer.vue";
import { ColumnProps } from "@/components/ProTable/interface";
import { OutformData } from "@/api/interface/outgoing";
import { ResPage } from "@/api/interface/index";
import { CirclePlus, Delete, Download, Upload, View, EditPen, Delete as Delete2 } from "@element-plus/icons-vue";
import { optionMap } from "@/hooks/utils/mater";
import SvgIcon from "@/components/SvgIcon/index.vue";

onMounted(async () => {
  // getAll();
});
// ProTable 的 ref，用于调用方法
const proTableRef = ref<InstanceType<typeof ProTable>>();

// 表格操作方法

//1.树形选择
// 如果表格需要初始化请求参数，直接定义传给 ProTable(之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = reactive({ id: "" });

// 树形筛选切换
const changeTreeFilter = (val: string) => {
  console.log("树形筛选切换", val);
  proTableRef.value!.pageable.pageNum = 1;

  // const first = val.match(/[A-Za-z]/)?.[0];
  // const last = val.match(/\d(?!.*\d)/)?.[0];
  initParam.id = val;
};
const deleteOutform = async (ids :number[]) => {
  deleteList(ids);
  proTableRef.value?.getTableList();
}
const delect = async (id: number) => {
  deleteOutform([id])
}
// 打开 drawer(新增、查看、编辑)
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
// 2.3新增数据
/**
 * 添加用户打开右侧抽屉实现
 * @param title 标题，string类型
 * @param row 类型为 Partial<User.ResUserList>，如果是新增，则为空对象
 * @returns void
 */
const openDrawer = async (title: string, row: Partial<OutformData> = {subcDate : new Date()}) => {
  const { data: datas } = await custDetailApi();
  const { data: supList } = await getSupMapApi();
  const options = datas.map((item) => {
    return optionMap(item);
  });
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addOutform : title === "编辑" ? editOutform : undefined,
    getTableList: proTableRef.value?.getTableList,
    options: options,
    supMapList: supList,
  };
  drawerRef.value?.acceptParams(params);
};
const editOutform = async (row: Partial<OutformData>) => {
  console.log("编辑数据", row);
};
const dataMap = (result: ResPage<OutformData>) => {

  // 数据回调
  const list = result.records.map((item) => ({
    ...item,
    // subcDate: item.subcDate ? new Date(item.subcDate).toISOString().split("T")[0] : "", // 格式化为 'YYYY-MM-DD'
    subcDate: item.subcDate 
    ? dayjs(item.subcDate).tz("Asia/Shanghai").format("YYYY-MM-DD") 
    : "",
  }));
  return {
    list,
    total: result.total,
  };
};

const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "subcId", align: "center" },
  { type: "expand", label: "展开", width: 85 },
  {
    label: "回执时间",
    prop: "subcDate",
    width: 250,
    search: {
      el: "input",
      tooltip: "输入回执时间进行搜索",
    },
  },
  { label: "回执单号", prop: "subcNum", width: 300 },
  { label: "供应商名称", prop: "supName", width: 200 },
  { label: "状态", prop: "state", tag: true, enum: getStateApi, fieldNames: { label: "state", value: "value" }, width: 150 },
  { label: "备注", prop: "remark" },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);
</script>

<style scoped>
.outform {
  display: flex;
  height: 100%;
}
h1 {
  font-size: 24px;
  color: #333333;
}
.no_data p {
  text-align: center;
  margin-bottom: -10px;
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
</style>
