<template>
  <el-dialog v-model="visible" title="批量添加订单记录" width="80%" :close-on-click-modal="false">
    <div class="batch-add">
      <el-form
        :model="form"
        label-width="100px"
        class="batch-form"
        :rules="rules"
        style="display: flex; gap: 10px; align-items: center"
      >
        <el-form-item label="订单日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择订单日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledFutureDate"
          />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input style="width: 220px" v-model="form.orderNum" placeholder="请输入订单号" />
        </el-form-item>
        <!-- 模式切换按钮 -->
        <el-button-group style="margin-left: auto">
          <el-button :type="mode === 'withOrder' ? 'primary' : 'default'" @click="mode = 'withOrder'"> 有订单 </el-button>
          <el-button :type="mode === 'withoutOrder' ? 'primary' : 'default'" @click="mode = 'withoutOrder'"> 无订单 </el-button>
        </el-button-group>
      </el-form>

      <el-table :data="form.records" border style="width: 100%; margin-top: 10px">
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 动态融合列 -->
        <el-table-column align="center" :min-width="mode === 'withOrder' ? 460 : 200">
          <template #header>
            <transition name="header-fade">
              <span v-if="mode === 'withOrder'">订单信息</span>
              <span v-else>产品</span>
            </transition>
          </template>

          <template #default="{ row }">
            <div class="merge-cell">
              <!-- 有订单模式 -->
              <div class="order-columns" :class="{ hide: mode === 'withoutOrder' }">
                <div class="order-num-col">
                  <el-input v-model="row.orderNum" placeholder="自动填充订单号" readonly style="width: 100%" />
                </div>
                <div class="order-item-col">
                  <el-input
                    :value="row.materName ? `${row.materName}(${row.materNum || ''})` : ''"
                    placeholder="请选择订单条目"
                    readonly
                  >
                    <template #append>
                      <el-button @click="openSelector(row)">选择</el-button>
                    </template>
                  </el-input>
                </div>
              </div>

              <!-- 无订单模式 -->
              <div class="product-column" :class="{ show: mode === 'withoutOrder' }">
                <el-select
                  v-if="mode === 'withoutOrder'"
                  v-model="row.materId"
                  placeholder="请选择产品"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="item in materList"
                    :key="item.value"
                    :label="`${item.label}（${item.num}）`"
                    :value="item.value"
                  />
                </el-select>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 数量列 -->
        <el-table-column label="订单数量" prop="number" align="center" width="100">
          <template #default="{ row }">
            <el-input
              v-model.number="row.number"
              type="number"
              min="1"
              :max="mode === 'withOrder' ? row.notAlreadyNumber : 999999"
              placeholder=""
              style="width: 100%; text-align: right"
              @input="handleNumberInput(row)"
            />
          </template>
        </el-table-column>

        <!-- 备注+操作 -->
        <el-table-column label="备注" prop="remark" align="center" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="备注" />
          </template>
        </el-table-column>
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
  </el-dialog>

  <!-- 引入订单选择器组件 -->
  <ItemSelector ref="itemSelectorRef" @confirm="onSelectItems" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElLoading, ElMessage } from "element-plus";
import { addBatchApi } from "@/api/modules/order";
import ItemSelector from "./ItemSelector.vue";

const visible = ref(false);
const materList = ref<{ value: number; label: string; num?: string }[]>([]);
let getTableList: (() => void) | null = null;

// 模式控制
const mode = ref<"withOrder" | "withoutOrder">("withoutOrder");
// 获取今日日期
const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 表单数据
const form = ref({
  date: getToday(),
  orderNum: "",
  records: [] as Array<{
    custOrderId: number | null;
    materId?: string | number;
    materNum?: string | number;
    orderId?: number | null;
    materName?: string;
    orderNum?: string;
    number: number | null;
    remark: string;
    notAlreadyNumber: number | null;
  }>,
});

// 表单校验
const rules = {
  date: [{ required: true, message: "请选择订单日期" }],
  orderNum: [{ required: true, message: "请输入订单号" }],
};

// 选择器实例
const itemSelectorRef = ref();
const currentRow = ref<any>(null);

// 打开订单选择器
const openSelector = (row: any) => {
  if (mode.value === "withoutOrder") {
    ElMessage.warning("无订单模式下无需选择订单条目");
    return;
  }
  currentRow.value = row;
  itemSelectorRef.value.open();
};

// 选择订单回调（单选+多选批量添加）
const onSelectItems = (selectedList: any[]) => {
  if (mode.value === "withoutOrder") return;
  if (!selectedList.length) return ElMessage.warning("请选择订单条目");

  // 单选：回填当前行
  if (selectedList.length === 1) {
    const item = selectedList[0];
    Object.assign(currentRow.value, {
      custOrderId: item.id,
      materName: item.materName,
      materNum: item.materNum,
      orderNum: item.orderNum,
      notAlreadyNumber: item.notAlreadyNumber,
      number: item.notAlreadyNumber,
    });
    return;
  }

  // 多选：批量添加行
  form.value.records = selectedList.map((item) => ({
    custOrderId: item.id,
    materName: item.materName,
    materNum: item.materNum,
    orderNum: item.orderNum,
    notAlreadyNumber: item.notAlreadyNumber,
    number: item.notAlreadyNumber,
    remark: "",
    orderId: null,
    materId: "",
  }));
  ElMessage.success(`已批量添加 ${selectedList.length} 条订单`);
};

// 模式切换：清空无关字段
watch(mode, (newMode) => {
  form.value.records.forEach((row) => {
    newMode === "withOrder"
      ? (row.materId = "")
      : Object.assign(row, { orderMaterId: null, orderNum: "", materName: "", materNum: "" });
  });
});

// 禁止未来日期
const disabledFutureDate = (time: Date) => time.getTime() > new Date().setHours(0, 0, 0, 0);

// 打开批量添加弹窗
const open = (params: { materList?: { value: number; label: string; num?: string }[]; getTableList?: () => void }) => {
  visible.value = true;
  materList.value = params.materList || [];
  getTableList = params.getTableList || null;
  // 重置表单
  form.value = { date: getToday(), orderNum: "", records: [] };
  addRow();
};

// 数量输入限制
const handleNumberInput = (row: any) => {
  if (mode.value === "withoutOrder" || !row.notAlreadyNumber) return;
  if (row.number > row.notAlreadyNumber) {
    row.number = row.notAlreadyNumber;
    ElMessage.warning(`最大可订单：${row.notAlreadyNumber}`);
  }
};

// 添加/删除行
const addRow = () => {
  form.value.records.push({
    custOrderId: null,
    materId: "",
    materNum: "",
    orderId: null,
    materName: "",
    orderNum: "",
    number: null,
    remark: "",
    notAlreadyNumber: null,
  });
};
const removeRow = (index: number) => form.value.records.splice(index, 1);

// 提交保存
const submit = async () => {
  // 基础校验
  if (!form.value.date) return ElMessage.warning("请选择订单日期");
  if (!form.value.orderNum) return ElMessage.warning("请输入订单号");
  if (!form.value.records.length) return ElMessage.warning("请添加至少一条记录");

  // 行数据校验
  for (let i = 0; i < form.value.records.length; i++) {
    const r = form.value.records[i];
    if (!r.number || r.number <= 0) return ElMessage.warning(`第 ${i + 1} 行数量无效`);
    if (mode.value === "withOrder") {
      if (!r.orderMaterId) return ElMessage.warning(`第 ${i + 1} 行未选订单`);
      if (r.number > r.notAlreadyNumber) return ElMessage.warning(`第 ${i + 1} 行超出可订单量`);
    } else {
      if (!r.materId) return ElMessage.warning(`第 ${i + 1} 行未选产品`);
    }
  }

  // 构造提交参数
  const payload = form.value.records.map((r) =>
    mode.value === "withOrder"
      ? {
          custOrderId: r.custOrderId,
          totalNumber: r.number,
          remark: r.remark,
          localTime: form.value.date,
          orderNum: form.value.orderNum,
          materNum: r.materNum,
          materName: r.materName,
        }
      : {
          materId: r.materId,
          totalNumber: r.number,
          remark: r.remark,
          localTime: form.value.date,
          orderNum: form.value.orderNum,
        },
  );

  const loading = ElLoading.service({ text: "提交中..." });
  try {
    await addBatchApi(payload);
    ElMessage.success("批量添加成功！");
    visible.value = false;
    getTableList?.();
  } catch (error) {
    ElMessage.error("提交失败，请检查数据");
    console.error("Batch submit failed:", error);
  } finally {
    loading.close();
  }
};

defineExpose({ open });

// ============================================
// ✅ 新增：公共逻辑抽象说明（2026-04-21）
// 本项目已提取公共逻辑到：./useBatchAddCommon.ts
// 该文件包含：useBatchAddCommon hook，封装了以下功能：
//   - 表单初始化（date, records, mode）
//   - 模式切换自动清理无关字段
//   - 行操作（addRow/removeRow）
//   - 数量限制（handleNumberInput）
//   - 日期禁用（disabledFutureDate）
//   - 数据校验（validateRecords）
//   - 参数构建（buildPayload）
//   - 提交方法（submit，含 loading 和错误处理）
//
// 如果未来需要维护或扩展批量添加逻辑，建议优先修改 useBatchAddCommon.ts
// 当前组件保留了原有实现，未强制替换以保持兼容性
// ============================================
</script>

<style scoped>
.batch-add {
  max-height: 70vh;
  overflow: auto;
}
.actions {
  margin-top: 10px;
  text-align: left;
}

/* 融合动画样式 */
.merge-cell {
  position: relative;
  width: 100%;
  height: 32px;
}
.order-columns {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  gap: 10px;
  transition: all 1.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  opacity: 1;
}
.order-columns.hide {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}
.order-num-col {
  width: 200px;
  flex-shrink: 0;
}
.order-item-col {
  flex: 1;
}

.product-column {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  margin: 0 auto;
  opacity: 0;
  transition: all 1.45s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: scale(0.9);
  pointer-events: none;
}
.product-column.show {
  opacity: 1;
  transform: scale(1);
  width: 100%;
  pointer-events: auto;
}
</style>
