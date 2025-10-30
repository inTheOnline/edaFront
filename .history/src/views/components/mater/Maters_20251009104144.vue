<template>
  <div class="mater-detail">
    <el-table :data="localValue" style="width: 100%" border>
      <el-table-column type="index" width="50" label="#"></el-table-column>

      <!-- 料号列 -->
      <el-table-column label="料号 / 编号" width="260">
        <template #default="{ row, $index }">
          <el-autocomplete
            v-model="row.id"
            :fetch-suggestions="(query, cb) => fetchByCode(query, cb, $index)"
            placeholder="输入料号或从下拉选取"
            @select="onSelectCode($event, $index)"
            @blur="onBlurCode($index)"
            :disabled="disabled"
            clearable
          />
        </template>
      </el-table-column>

      <!-- 料名列 -->
      <el-table-column label="料名">
        <template #default="{ row, $index }">
          <el-autocomplete
            v-model="row.name"
            :fetch-suggestions="(query, cb) => fetchByName(query, cb, $index)"
            placeholder="输入料名或从下拉选取"
            @select="onSelectName($event, $index)"
            @blur="onBlurName($index)"
            :disabled="disabled"
            clearable
          />
        </template>
      </el-table-column>

      <!-- 数量 -->
      <el-table-column label="数量" width="120">
        <template #default="{ row }">
          <el-input-number v-model="row.totalNumber" :min="1" :disabled="disabled" />
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="120">
        <template #default="{ row, $index }">
          <el-button type="text" size="small" @click="removeRow($index)" v-if="!disabled">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mater-button" v-if="!disabled">
      <el-button type="primary" size="small" @click="addRow">新增物料</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRaw } from "vue";
import { ElMessage } from "element-plus";

interface OptionItem {
  value: string; // 值，通常是物料 id / 料号
  label: string; // 名称 / 显示
  // 你可以扩展更多字段（例如规格、单位），组件会忽略不需要的字段
}

interface MaterItem {
  id: string;
  name?: string;
  totalNumber: number;
}

const props = defineProps<{
  modelValue: MaterItem[];
  options?: OptionItem[];     // 来自 dictStore.dictMap['mater']
  disabled?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

// 本地拷贝，方便编辑；任何变化都会通过 watch 同步给父组件
const localValue = ref<MaterItem[]>((props.modelValue || []).map(v => ({ id: v.id || "", name: v.name || "", totalNumber: v.totalNumber ?? 1 })));

// 当外部 modelValue 更改时更新本地
watch(() => props.modelValue, (v) => {
  localValue.value = (v || []).map(item => ({ id: item.id || "", name: item.name || "", totalNumber: item.totalNumber ?? 1 }));
}, { deep: true, immediate: true });

// 当本地变更时通知父组件
watch(localValue, (val) => {
  // 深拷贝防止父组件被无意修改
  const out = (val || []).map(item => ({ id: item.id, name: item.name, totalNumber: item.totalNumber }));
  emit("update:modelValue", out);
}, { deep: true });

// 辅助：从 options 中查找匹配项（按 id）
function findOptionById(id: string) {
  if (!props.options) return undefined;
  const idStr = String(id || "").trim().toLowerCase();
  return props.options.find(o => String(o.value || "").toLowerCase() === idStr);
}

// 辅助：从 options 中查找匹配项（按 label）
function findOptionByName(name: string) {
  if (!props.options) return undefined;
  const nameStr = String(name || "").trim().toLowerCase();
  return props.options.find(o => String(o.label || "").toLowerCase() === nameStr);
}

// Autocomplete suggestions 按料号（value）匹配
function fetchByCode(queryString: string, cb: (items: any[]) => void, index: number) {
  const q = String(queryString || "").toLowerCase();
  const hits = (props.options || [])
    .filter(o => String(o.value || "").toLowerCase().includes(q))
    .slice(0, 20)
    .map(o => ({ value: o.value, label: o.label }));
  cb(hits);
}

// Autocomplete suggestions 按料名（label）匹配
function fetchByName(queryString: string, cb: (items: any[]) => void, index: number) {
  const q = String(queryString || "").toLowerCase();
  const hits = (props.options || [])
    .filter(o => String(o.label || "").toLowerCase().includes(q))
    .slice(0, 20)
    .map(o => ({ value: o.value, label: o.label }));
  cb(hits);
}

// 选中料号（autocomplete select）
function onSelectCode(item: any, idx: number) {
  // item = { value, label }
  if (!localValue.value[idx]) return;
  localValue.value[idx].id = item.value;
  localValue.value[idx].name = item.label; // 自动填料名
}

// 选中料名（autocomplete select）
function onSelectName(item: any, idx: number) {
  if (!localValue.value[idx]) return;
  localValue.value[idx].name = item.label;
  localValue.value[idx].id = item.value; // 自动填料号
}

// 失焦时尝试智能匹配（料号失焦）
function onBlurCode(idx: number) {
  const row = localValue.value[idx];
  if (!row) return;
  if (row.id && (!row.name || row.name.trim() === "")) {
    const opt = findOptionById(row.id);
    if (opt) {
      row.name = opt.label;
    } else {
      // 未找到，清空 name 或保留输入的 id（视需求而定）
      row.name = "";
    }
  }
}

// 失焦时尝试智能匹配（料名失焦）
function onBlurName(idx: number) {
  const row = localValue.value[idx];
  if (!row) return;
  if (row.name && (!row.id || row.id.trim() === "")) {
    const opt = findOptionByName(row.name);
    if (opt) {
      row.id = opt.value;
    } else {
      // 未匹配到，保留 name，id 为空
      row.id = "";
    }
  }
}

// 增、删行
function addRow() {
  localValue.value.push({ id: "", name: "", totalNumber: 1 });
  // 自动滚动/聚焦可在这里做增强
}
function removeRow(index: number) {
  if (index < 0 || index >= localValue.value.length) return;
  localValue.value.splice(index, 1);
  if (localValue.value.length === 0) {
    // 至少保留一行（如果你希望允许零行则注释掉）
    localValue.value.push({ id: "", name: "", totalNumber: 1 });
  }
}
</script>

<style scoped>
.mater-detail {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #f2f2f2;
  border-radius: 8px;
  background: #fff;
}
.mater-button {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>
