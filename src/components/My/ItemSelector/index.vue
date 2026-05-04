<template>
  <el-dialog v-model="visible" :title="title" width="60%">
    <!-- 查询区 -->
    <div style="margin-bottom: 15px; display: flex; gap: 10px; padding: 0 5px;">
      <el-input 
        v-model="query.searchWord" 
        :placeholder="searchPlaceholder" 
        style="width: 220px;" 
        @keyup.enter="getList" 
      />
      <el-button type="primary" @click="getList">搜索</el-button>
      <el-button @click="handleSelectAll">一键全选</el-button>
    </div>

    <!-- 表格 -->
    <div style="padding: 0 5px;">
      <el-table
        ref="tableRef"
        :data="tableData"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick" 
        height="420"
        border
        :row-key="rowKey"
        style="width: 100%;"
      >
        <el-table-column type="selection" width="60" />
        <!-- 🔥 修复：先过滤再渲染，无v-if+v-for，彻底解决ESLint+报错 -->
        <el-table-column
          v-for="col in showColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :align="col.align || 'left'"
        />
      </el-table>

      <!-- 分页 -->
      <div style="text-align: center; margin-top: 10px;">
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
import { ref, nextTick, computed } from "vue";

// TS类型
interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  isShow?: boolean
}

// 配置化Props
const props = defineProps({
  title: { type: String, default: '选择数据' },
  columns: { type: Array as () => TableColumn[], required: true },
  fetchApi: { type: Function },
  searchPlaceholder: { type: String, default: '请输入搜索内容' },
  rowKey: { type: String, default: 'id' },
  selectEnableField: { type: String, default: 'notAlreadyNumber' },
  list: { type: Array, default: () => [] }
})

const visible = ref(false);
const tableData = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const tableRef = ref();

// 查询条件
const query = ref({
  searchWord: "",
});

// 分页
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

const emit = defineEmits(["confirm"]);

// 🔥 核心修复：计算属性过滤列（无isShow默认true，解决所有报错）
const showColumns = computed(() => {
  return props.columns.filter(col => col.isShow ?? true)
})

// 打开弹窗
const open = () => {
  visible.value = true;
  pageNum.value = 1;
  query.value.searchWord = "";
  getList();
};

// 获取数据
const getList = async () => {
  try {
    if (props.fetchApi) {
      const res = await props.fetchApi({
        keyword: query.value.searchWord,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      });
      tableData.value = res.data.records || res.data || [];
      total.value = res.data.total || 0;
    } else {
      let data = [...props.list];
      if (query.value.searchWord) {
        const keyword = query.value.searchWord.toLowerCase();
        data = data.filter(item => {
          return Object.values(item).some(val => 
            String(val).toLowerCase().includes(keyword)
          );
        });
      }
      total.value = data.length;
      const start = (pageNum.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      tableData.value = data.slice(start, end);
    }
  } catch (err) {
    console.error('获取数据失败：', err)
  } finally {
    selectedRows.value = [];
    nextTick(() => tableRef.value?.clearSelection());
  }
};

// 选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

// 点击行切换选中
const handleRowClick = (row: any) => {
  tableRef.value?.toggleRowSelection(row);
};

// 一键全选
const handleSelectAll = () => {
  if (!tableRef.value) return;
  tableRef.value.clearSelection();
  const availableRows = tableData.value.filter(item => item[props.selectEnableField] > 0);
  availableRows.forEach(row => tableRef.value.toggleRowSelection(row, true));
};

// 确认选择
const confirmSelect = () => {
  emit("confirm", selectedRows.value);
  visible.value = false;
};

defineExpose({ open });
</script>

<style scoped>
/* 完全保留你的样式 */
:deep(.el-table__cell) {
  padding: 14px 0 !important;
}
:deep(.el-table__header) .el-table__cell {
  padding: 16px 0 !important;
}
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
:deep(.el-table__body-wrapper) {
  overflow: visible !important;
}
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