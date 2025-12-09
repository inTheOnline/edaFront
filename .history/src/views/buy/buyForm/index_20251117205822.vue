<template>
  <div class="work-container">
    <div>
      <ProTable
        class="purchase-container"
        :columns="columns"
        :request-api="requestApi"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="purchaseId"
        title="办公用品请购"
        ref="proTableRef"
        striped
        :search-col="{ xs: 1, sm: 1, md: 3, lg: 4, xl: 4 }"
      >
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">
            申请采购
          </el-button>

          <el-button type="primary" :icon="Upload" plain @click="batchAdd">
            批量申请采购
          </el-button>

          <el-button
            v-if="!isNormalStaff()"
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除
          </el-button>
        </template>

        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">
            查看
          </el-button>

          <!-- 普通员工只能编辑待采购的 -->
          <el-button
            type="primary"
            link
            :icon="EditPen"
            @click="openDrawer('编辑', scope.row)"
            v-if="scope.row.status === '待采购' && isNormalStaff()"
          >
            编辑
          </el-button>

          <!-- 管理员采购处理 -->
          <el-button
            type="success"
            link
            :icon="Check"
            v-if="scope.row.status === '待采购' && !isNormalStaff()"
            @click="goPurchase(scope.row)"
          >
            采购处理
          </el-button>

          <!-- 管理员删除 -->
          <el-button
            v-if="!isNormalStaff()"
            type="primary"
            link
            :icon="Delete"
            @click="deleteRecord(scope.row.purchaseId)"
          >
            删除
          </el-button>
        </template>
      </ProTable>
    </div>

    <PurchaseDrawer ref="drawerRef" />
    <BatchPurchaseDialog ref="batchDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import PurchaseDrawer from "./components/PurchaseDrawer.vue";
import BatchPurchaseDialog from "./components/BatchPurchaseDialog.vue";

import {
  getOfficePurchaseList,
  deleteOfficePurchase,
  deleteBatchOfficePurchase
} from "@/api/modules/buy/officePurchase";

import { useDictStore } from "@/stores/modules/dict";
import { ElMessage, ElMessageBox } from "element-plus";

import {
  CirclePlus,
  Delete,
  EditPen,
  Upload,
  View,
  Check
} from "@element-plus/icons-vue";

const dictStore = useDictStore();
const proTableRef = ref();
const drawerRef = ref();
const batchDialogRef = ref();

// ==========================
// 身份判断函数（你来实现逻辑）
// ==========================
const isNormalStaff = () => {
  // ⭐⭐ 你自己写：true=普通员工，false=采购/管理员
  return dictStore.userRole === "staff";
};

// 初始化
onMounted(async () => {
  await dictStore.loadDicts(["staff"]);
});

// ==========================
// 选择接口（普通员工只看自己的）
// ==========================
  const requestApi = (params) => {
  if (isNormalStaff()) {
    params.applyUserId = dictStore.currentUserId;
  }
  return getOfficePurchaseList(params);

const dataCallback = (data) => ({
  list: data.records,
  total: data.total
});

// ==========================
// 表格列
// ==========================
const columns = reactive([
  { type: "selection", width: 60 },
  { type: "index", label: "序号", width: 60 },

  {
    label: "名称",
    prop: "itemName",
    search: { el: "input" }
  },
  {
    label: "数量",
    prop: "itemNumber",
    width: 80
  },
  {
    label: "单价",
    prop: "itemPrice",
    width: 90
  },
  {
    label: "总金额",
    prop: "totalAmount",
    width: 110
  },
  {
    label: "图片",
    prop: "fileUrl",
    width: 110,
    formatter: (row) =>
      row.fileUrl
        ? `<img src="${row.fileUrl}" style="width:45px;height:45px;border-radius:6px;">`
        : "无"
  },
  {
    label: "状态",
    prop: "status",
    width: 120,
    formatter: (row) =>
      row.status === "待采购"
        ? "🟡 待采购"
        : "🟢 已采购"
  },

  { prop: "operation", label: "操作", width: 300, fixed: "right" }
]);

// ==========================
// 打开抽屉
// ==========================
const openDrawer = (title, row = {}) => {
  drawerRef.value?.acceptParams({
    title,
    row,
    isView: title === "查看",
    getTableList: proTableRef.value.getTableList
  });
};

// 删除
const deleteRecord = async (id) => {
  await deleteOfficePurchase(id);

  ElMessage.success("删除成功");
  proTableRef.value.getTableList();
};

// 批量删除
const deleteSelected = async (ids) => {
  await deleteBatchOfficePurchase(ids);
  ElMessage.success("批量删除成功");
  proTableRef.value.getTableList();
};

// 批量申请
const batchAdd = () => {
  batchDialogRef.value.open({
    getTableList: proTableRef.value.getTableList
  });
};

// 采购处理
const goPurchase = (row) => {
  window.$router.push({
    path: "/buy/handle",
    query: { id: row.purchaseId }
  });
};
</script>

<style lang="scss" scoped>
.purchase-container {
  width: 100%;
  height: 91%;
}
</style>
