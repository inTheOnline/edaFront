<template>
  <el-dialog v-model="visible" title="选择订单条目" width="60%">
    <!-- 查询区 -->
    <div style="margin-bottom: 15px; display: flex; gap: 10px; padding: 0 5px">
      <el-input v-model="query.openTheDog" placeholder="产品名称/编号/订单号" style="width: 220px" @keyup.enter="getList" />
      <el-button type="primary" @click="getList">搜索</el-button>
      <el-button @click="handleSelectAll">一键全选</el-button>
    </div>

    <!-- 表格 -->
    <div style="padding: 0 5px; max-height: 430px">
      <el-table
        class="table"
        ref="tableRef"
        :data="tableData"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        height="420"
        border
        row-key="id"
        style="width: 100%"
      >
        <el-table-column type="selection" width="60" />
        <el-table-column prop="orderNum" label="订单号" width="200" />
        <el-table-column prop="materNum" label="产品编号" width="180" />
        <el-table-column prop="materName" label="产品名称" min-width="220" />
        <el-table-column prop="notAlreadyNumber" label="可开单数量" width="140" />
      </el-table>

      <!-- 👇 新增：分页组件（居中显示） -->
      <div style="text-align: center; margin-top: 10px">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 50, 100, 400]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirmSelect">确认选择</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { ElLoading, ElMessage } from "element-plus";
import { getOrderItem as getItemList } from "@/api/modules/order";

const visible = ref(false);
const tableData = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const tableRef = ref();

// 查询条件
const query = ref({
  openTheDog: "",
  orderNum: "",
  materNum: "",
  materName: "",
});

// 👇 新增：分页参数
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

const emit = defineEmits(["confirm"]);

// 打开弹窗
const open = () => {
  visible.value = true;
  // 重置分页
  pageNum.value = 1;
  getList();
};

// 获取数据（已适配分页）
const getList = async () => {
  console.log("查询参数：", query.value, "分页：", pageNum.value, pageSize.value);
  const loading = ElLoading.service({ text: "加载中..." });
  try {
    const res = await getItemList({
      ...query.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    // 适配后端返回格式：list + total
    tableData.value = res.data.records || res.data || [];
    total.value = res.data.total || 0;

    // 切换分页/搜索 → 清空选中状态
    selectedRows.value = [];
    nextTick(() => tableRef.value?.clearSelection());
  } catch (error) {
    ElMessage.error("加载数据失败");
    console.error("Failed to fetch data:", error);
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.close();
  }
};

// 选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

// 点击行切换选中
const handleRowClick = (row: any) => {
  tableRef.value.toggleRowSelection(row);
};

// 一键全选（仅当前页）
const handleSelectAll = () => {
  if (!tableRef.value) return;
  tableRef.value.clearSelection();
  const availableRows = tableData.value.filter((item) => item.notAlreadyNumber > 0);
  availableRows.forEach((row) => tableRef.value.toggleRowSelection(row, true));
};

// 确认选择
const confirmSelect = () => {
  emit("confirm", selectedRows.value);
  visible.value = false;
};

defineExpose({ open });
</script>

<style scoped>
.table {
  /* 添加内边距和最大高度，启用滚动 */
  padding: 0 5px;
  max-height: 80vh;
  overflow-y: auto;
}
/* 行高宽松 */
:deep(.el-table__cell) {
  padding: 14px 0 !important;
}
:deep(.el-table__header) .el-table__cell {
  padding: 16px 0 !important;
}

/* 鼠标悬浮凸起效果 */
:deep(.el-table__row) {
  transition: all 0.2s ease;
  cursor: pointer;
}
:deep(.el-table__row:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  z-index: 10;
}

/* 选中行高亮样式 */
:deep(.el-table__row--selected) {
  background-color: #f0f9ff !important;
  border: 1px solid #1890ff !important;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}
:deep(.el-table__row--selected:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.25);
}
</style>
