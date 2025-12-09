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
  getPurchaseList,
  deletePurchase,
  deleteBatchPurchase
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
  // if (isNormalStaff()) {
  //   params.applyUserId = dictStore.currentUserId;
  // }
  return getPurchaseList(params);
};

const dataCallback = (data) => ({
  list: data.records,
  total: data.total
});

// ==========================
// 表格列（基于实体类）
// ==========================
const columns = reactive([
  { type: "selection", width: 60 },
  {
    type: "index",
    label: "序号",
    width: 60,
    index: (index) =>
      (proTableRef.value?.pageable?.pageNum - 1) * proTableRef.value?.pageable?.pageSize +
      index +
      1
  },

  {
    label: "采购物品",
    prop: "itemName",
    minWidth: 160,
    search: { el: "input", tooltip: "输入物品名称搜索" }
  },
  {
    label: "规格型号",
    prop: "itemSpec",
    minWidth: 140,
  },
  {
    label: "计量单位",
    prop: "itemUnit",
    width: 100
  },
  {
    label: "数量",
    prop: "itemNumber",
    width: 100,
  },

  // 申请人（显示姓名，如果没有字典则显示 id）
  {
    label: "申请人",
    prop: "applyUserId",
    minWidth: 120,
    formatter: (row) => {
      try {
        return dictStore?.getLabel ? dictStore.getLabel("staff", row.applyUserId) || row.applyUserId : row.applyUserId;
      } catch (e) {
        return row.applyUserId;
      }
    },
    search: { el: "input", tooltip: "申请人姓名/ID 搜索" }
  },

  // 申请理由
  {
    label: "申请理由",
    prop: "applyReason",
    minWidth: 180,
  },

  {
    label: "期望到货",
    prop: "expectedDate",
    width: 140,
    search: {
      el: "date-picker",
      props: { type: "date", format: "YYYY-MM-DD", "value-format": "YYYY-MM-DD" },
      tooltip: "选择期望到货日期搜索"
    }
  },

  // 图片（通过 itemFileId 链接查看或下载）
  {
    label: "图片",
    prop: "itemFileId",
    width: 120,
    formatter: (row) =>
      row.itemFileId
        ? `<a href="/api/file/download/${row.itemFileId}" target="_blank">查看</a>`
        : "无"
  },

  // 是否审核
  {
    label: "审核",
    prop: "uphold",
    width: 100,
    formatter: (row) => (row.uphold === 1 ? "已审核" : "未审核"),
    search: {
      el: "select",
      enum: [
        { label: "全部", value: undefined },
        { label: "未审核", value: 0 },
        { label: "已审核", value: 1 }
      ]
    }
  },

  // 状态
  {
    label: "状态",
    prop: "status",
    width: 120,
    formatter: (row) => {
      if (row.status === "待采购" || row.status === "0") return "🟡 待采购";
      if (row.status === "已采购" || row.status === "1") return "🟢 已采购";
      if (row.status === "已入库") return "🔵 已入库";
      if (row.status === "已取消") return "⚪ 已取消";
      return row.status ?? "";
    },
    search: {
      el: "select",
      enum: [
        { label: "全部", value: undefined },
        { label: "待采购", value: "待采购" },
        { label: "已采购", value: "已采购" },
        { label: "已入库", value: "已入库" },
        { label: "已取消", value: "已取消" }
      ]
    }
  },

  {
    label: "备注",
    prop: "remark",
    minWidth: 180,
  },

  {
    label: "创建时间",
    prop: "createdTime",
    width: 160,
    search: {
      el: "date-picker",
      props: { type: "daterange", format: "YYYY-MM-DD", "value-format": "YYYY-MM-DD" },
      tooltip: "按创建时间区间搜索"
    }
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
