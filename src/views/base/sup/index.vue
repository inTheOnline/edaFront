<template>
  <div class="sup-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAllSup"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增供应商</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除供应商
          </el-button>
        </template>
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteSupById(scope.row)">删除</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, toRefs,onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { getAllSup, addSup, delectSups, alterSup } from "@/api/modules/sup";
import { getStateApi } from "@/api/modules/outgoing";
import UserDrawer from "@/views/base/sup/components/UserDrawer.vue";
import { CirclePlus, Delete, View, EditPen, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useDictStore} from '@/stores/modules/dict'
import { deleteById } from "@/api/modules/supWork";
const dictStore = useDictStore()
onMounted(async () => {
  await dictStore.loadDicts(['work','state']);
});
const workMap = computed(() => {
  return dictStore.dictMap['work'] || [];
});
const stateMap = computed(() => {
  return (dictStore.dictMap['state'] || []).map(item =>
    item.label === "未合作" ? { ...item, tagType: "info" } : item
  );
});
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
  {
    label: "供应商编号",
    prop: "supNum",
  },
  {
    label: "供应商名称",
    prop: "supName",
    search: {
      el: "input",
      tooltip: "输入供应商名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "简称",
    prop: "callName"
  },
  {
    label: "联系人",
    prop: "contactName"
  },
  {
    label: "联系电话",
    prop: "contactPhone"
  },
  {
    label: "地址",
    prop: "address"
  },
  {
    label: "状态",
    prop: "state", tag: true,
     enum: stateMap,
     fieldNames: { label: "label", value: "value" },
  },
  {
    label: "系数",
    prop: "constant",
  },
  {
    label: "供货类型",
    prop: "workId",
    enum: workMap,
    tag: true,
  },
  {
    label: "备注",
    prop: "remark",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);

// 打开抽屉
const openDrawer = (title: string, row: Object = {}) => {
  console.log(title, row);
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addSup : title === "编辑" ? editSup : undefined,
    getTableList: proTableRef.value?.getTableList,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async(ids: number[]): Promise<void> => {
  await delectSups(ids);
  ElMessage.success("删除供应商成功！`")
  proTableRef.value?.getTableList();
};
const deleteSupById = async(row) =>{
  const ids = [row.id];
  await delectSups(ids);
  ElMessage.success("删除供应商成功！`")
  proTableRef.value?.getTableList();
}
// 编辑供应商
const editSup = async (row: any) => {
  await alterSup(row);
};
</script>

<style lang="scss" scoped>
.Sup-container {
  display: flex;
  height: 91%;
}
</style>
