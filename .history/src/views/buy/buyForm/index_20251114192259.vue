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
          <!-- 新增请购 -->
          <el-button 
            type="primary" 
            :icon="CirclePlus" 
            @click="openDrawer('新增')"
          >
            申请采购
          </el-button>

          <!-- 批量请购 -->
          <el-button 
            type="primary" 
            :icon="Upload" 
            plain 
            @click="batchAdd"
          >
            批量申请采购
          </el-button>

          <!-- 删除 -->
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
          <el-button 
            type="primary" 
            link 
            :icon="EditPen" 
            @click="openDrawer('编辑', scope.row)"
            v-if="scope.row.status === '待采购' && isNormalStaff()"
          >
            编辑
          </el-button>

          <el-button 
            type="success"
            link
            :icon="Check"
            v-if="scope.row.status === '待采购' && !isNormalStaff()"
            @click="goPurchase(scope.row)"
          >
            采购处理
          </el-button>

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

    <!-- 抽屉：新增/编辑/查看 -->
    <PurchaseDrawer ref="drawerRef" />

    <!-- 批量申请窗口 -->
    <BatchPurchaseDialog ref="batchDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import PurchaseDrawer from "./components/PurchaseDrawer.vue";
import BatchPurchaseDialog from "./components/BatchPurchaseDialog.vue";

import { 
  getPurchaseList,
  deletePurchase,
  deleteManyPurchase
} from "@/api/modules/buy";

import { useDictStore } from "@/stores/modules/dict";
import { ElMessageBox, ElMessage } from "element-plus";

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

// 身份判断（你自己写）
const isNormalStaff = () => {
  // TODO: return true 表示普通员工
  return false;
};

onMounted(async () => {
  await dictStore.loadDicts(["staff"]);
});

// 接口选择
const requestApi = (params) => {
  // 普通员工 → 只查自己的
  if (isNormalStaff()) {
    params.applyUserId = dictStore.currentUserId; // 你自己实现
  }
  return getPurchaseList(params);
};

const dataCallback = (data) => ({
  list: data.records,
  total: data.total
});

// table columns
const columns = reactive([
  { type: "selection", width: 60 },
  { type: "index", label: "序号", width: 60 },

  {
    label: "名称",
    prop: "itemName",
    search: {
      el: "input",
      tooltip: "输入名称搜索"
    }
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
    width: 100,
    formatter: (row) => {
      return row.fileUrl ? `<img src="${row.fileUrl}" style="width:40px;height:40px;">` : "无";
    }
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    formatter: (row) =>
      row.status === "待采购"
        ? "🟡 待采购"
        : "🟢 已采购"
  },

  { prop: "operation", label: "操作", fixed: "right", width: 300 }
]);

// 打开抽屉
const openDrawer = (title, row = {}) => {
  const params = {
    title,
    row,
    isView: title === "查看",
    getTableList: proTableRef.value?.getTableList
  };
  drawerRef.value?.acceptParams(params);
};

// 删除
const deleteRecord = async (id) => {
  await deletePurchase(id);
  ElMessage.success("删除成功");
  proTableRef.value.getTableList();
};

const deleteSelected = async (ids) => {
  await deleteManyPurchase(ids);
  ElMessage.success("批量删除成功");
  proTableRef.value.getTableList();
};

// 批量申请
const batchAdd = () => {
  batchDialogRef.value?.open({
    getTableList: proTableRef.value.getTableList
  });
};

// 跳转采购处理
const goPurchase = (row) => {
  window.$router.push({
    path: "/officePurchase/handle",
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
