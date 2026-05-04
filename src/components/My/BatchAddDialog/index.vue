<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="80%"
    :close-on-click-modal="false"
  >
    <div class="batch-add">
      <!-- 顶部表单 -->
      <el-form
        :model="form"
        label-width="100px"
        :rules="autoFormRules"
        class="batch-form"
      >
        <template v-for="col in topColumns" :key="col.prop">
          <el-form-item :label="col.label" :prop="col.prop">
            <el-date-picker
              v-if="col.type === 'date'"
              v-model="form[col.prop]"
              type="date"
              style="width: 220px"
            />
            <el-select
              v-else-if="col.type === 'select'"
              v-model="form[col.prop]"
              style="width: 220px"
            >
              <el-option v-for="item in col.enum" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-input v-else v-model="form[col.prop]" style="width: 220px" />
          </el-form-item>
        </template>

        <!-- 模式切换按钮 -->
        <el-button-group v-if="hasMode" style="margin-left: auto;">
          <el-button
            v-for="item in modeList"
            :key="item.value"
            :type="mode === item.value ? 'primary' : 'default'"
            @click="switchMode(item.value)"
          >
            {{ item.label }}
          </el-button>
        </el-button-group>
      </el-form>

      <!-- 表格（核心修复：无语法错误） -->
      <el-table :data="form.records" border style="width: 100%; margin-top: 10px;">
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 模式列（修复：v-for语法 + 变量作用域） -->
        <template v-if="hasMode">
          <el-table-column
            :label="modeColumn.label"
            :min-width="modeColumn.minWidth"
            align="center"
          >
            <template #default="{ row }">
              <div class="mode-group">
                <!-- 🔥 修复：v-for单独使用，无v-if冲突 -->
                <template v-for="field in currentModeFields" :key="field.prop">
                  <el-input
                    v-if="field.prop !== 'materSelect'"
                    v-model="row[field.prop]"
                    :placeholder="field.placeholder"
                    readonly
                    style="width: 100%"
                  />
                  <el-select
                    v-else
                    v-model="row.materId"
                    placeholder="请选择产品"
                    style="width: 100%"
                    filterable
                  >
                    <el-option v-for="item in materList" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>

                <el-button
                  type="primary"
                  size="small"
                  v-if="mode === modeColumn.default"
                  @click="openSelector(row)"
                >
                  选择
                </el-button>
              </div>
            </template>
          </el-table-column>
        </template>

        <!-- 普通表格列 -->
        <el-table-column
          v-for="col in normalTableColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :min-width="col.minWidth"
          align="center"
        >
          <template #default="{ row }">
            <el-input
              v-if="col.type === 'number'"
              v-model.number="row[col.prop]"
              type="number"
              style="width: 100%"
              @input="handleMaxNum(row)"
            />
            <el-input v-else v-model="row[col.prop]" style="width: 100%" />
          </template>
        </el-table-column>

        <!-- 操作列（删除按钮正常） -->
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="actions">
        <el-button type="primary" @click="addRow">添加一行</el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>

    <!-- 🔥 传递本地list给选择器 -->
    <ItemSelector
      ref="itemSelectorRef"
      v-bind="itemSelectorConfig"
      :list="itemSelectorList"
      @confirm="onSelectItems"
    />
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ItemSelector from "../ItemSelector/index.vue";

const props = defineProps({
  title: { type: String, default: "批量添加" },
  columns: { type: Array, required: true },
  submitApi: { type: Function, required: true },
  itemSelectorConfig: { type: Object, required: true },
  // 🔥 新增：接收选择器本地列表
  itemSelectorList: { type: Array, default: () => [] }
});

// 核心变量
const visible = ref(false);
const mode = ref("");
const form = ref({ records: [] });
const itemSelectorRef = ref(null);
const currentRow = ref(null);
const materList = ref([]);
let refreshTable = null;

// 列解析
const topColumns = computed(() => props.columns.filter(i => i.position === "top"));
const modeColumn = computed(() => props.columns.find(i => i.type === "mode"));
const normalTableColumns = computed(() => props.columns.filter(i => i.position === "table" && i.type !== "mode"));
const hasMode = computed(() => !!modeColumn.value);
const modeList = computed(() => modeColumn.value?.modes || []);
const currentModeFields = computed(() => {
  const target = modeList.value.find(i => i.value === mode.value);
  return target?.fields || [];
});

// 表单校验 + 默认值
const autoFormRules = computed(() => {
  const rules = {};
  topColumns.value.forEach(col => {
    if (col.required) rules[col.prop] = [{ required: true, message: `请填写${col.label}` }];
  });
  return rules;
});

onMounted(() => {
  const defaultForm = { records: [] };
  topColumns.value.forEach(col => defaultForm[col.prop] = col.default ?? "");
  form.value = defaultForm;
  if (hasMode.value) mode.value = modeColumn.value.default;
});

// 新增行（默认值生效）
const addRow = () => {
  const row = {};
  normalTableColumns.value.forEach(col => row[col.prop] = col.default ?? "");
  currentModeFields.value.forEach(field => row[field.prop] = "");
  form.value.records.push({ ...row, materId: "", orderMaterId: null, notAlreadyNumber: null });
};

// 模式切换
const switchMode = (val) => {
  mode.value = val;
  form.value.records.forEach(row => {
    Object.keys(row).forEach(k => row[k] = "");
    normalTableColumns.value.forEach(col => row[col.prop] = col.default ?? "");
  });
};

// 删除行
const removeRow = (index) => form.value.records.splice(index, 1);

// 选择器逻辑
const openSelector = (row) => {
  currentRow.value = row;
  itemSelectorRef.value.open();
};
// 🔥 修复：自动赋值所有同名字段，无硬编码，example/orderId等全部传递
const onSelectItems = (list) => {
  if (!list.length) return ElMessage.warning("请选择数据");
  if (list.length === 1) {
    const item = list[0];
    // 自动合并所有字段，同名覆盖，保留原有字段
    Object.assign(currentRow.value, item);
    // 保留原有逻辑：数量默认赋值为可开单数量
    currentRow.value.number = item.notAlreadyNumber;
    return;
  }
  form.value.records = list.map(item => ({
    ...item, // 🔥 自动携带所有字段（example/orderId等）
    number: item.notAlreadyNumber,
    materId: ""
  }));
};

// 数量限制（修复：仅限制超过最大值的情况，无值时不清空）
const handleMaxNum = (row) => {
  // 无最大值限制时，直接返回，不做任何处理
  if (!row.notAlreadyNumber) return;
  // 仅当输入值超过限制时，才重置为最大值
  if (row.number > row.notAlreadyNumber) {
    row.number = row.notAlreadyNumber;
  }
};

// 打开弹窗
const open = (params) => {
  visible.value = true;
  materList.value = params.materList || [];
  refreshTable = params.refresh;
  form.value.records = [];
  addRow();
};

// 提交校验（必填生效）
const submit = async () => {
  for (const col of topColumns.value) {
    if (col.required && !form.value[col.prop]) return ElMessage.warning(autoFormRules.value[col.prop][0].message);
  }
  if (!form.value.records.length) return ElMessage.warning("请添加数据行");

  for (let i = 0; i < form.value.records.length; i++) {
    const row = form.value.records[i];
    for (const col of normalTableColumns.value) {
      if (col.required && (row[col.prop] === "" || row[col.prop] == null)) {
        return ElMessage.warning(`第${i+1}行【${col.label}】必填`);
      }
    }
  }

  await props.submitApi(form.value);
  ElMessage.success("提交成功");
  visible.value = false;
  refreshTable?.();
};

defineExpose({ open });
</script>

<style scoped>
.batch-add { max-height: 70vh; overflow: auto; }
.batch-form { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.mode-group { display: flex; align-items: center; gap: 6px; width: 100%; }
.actions { margin-top: 10px; text-align: left; }
</style>