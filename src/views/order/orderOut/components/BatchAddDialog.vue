<template>
  <el-dialog v-model="visible" title="批量添加出货记录" width="80%" :close-on-click-modal="false">
    <div class="batch-add">
      <el-form
        :model="form"
        label-width="100px"
        class="batch-form"
        :rules="rules"
        style="display: flex; gap: 10px; align-items: center"
      >
        <el-form-item label="出货日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择出货日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledFutureDate"
          />
        </el-form-item>
        <el-form-item label="送货单号">
          <el-input style="width: 220px" v-model="form.num" placeholder="请输入送货单号" />
        </el-form-item>
        <!-- 模式切换按钮 -->
        <el-button-group style="margin-left: auto">
          <el-button :type="mode === 'withOrder' ? 'primary' : 'default'" @click="mode = 'withOrder'"> 有订单 </el-button>
          <el-button :type="mode === 'withoutOrder' ? 'primary' : 'default'" @click="mode = 'withoutOrder'"> 无订单 </el-button>
        </el-button-group>
      </el-form>

      <el-table :data="form.records" border style="width: 100%; margin-top: 10px">
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 🔥 核心：融合切换列 - 有订单显示两列，无订单融合为产品列 -->
        <el-table-column align="center" :min-width="mode === 'withOrder' ? 460 : 200">
          <!-- 动态列标题：有订单=订单信息，无订单=产品 -->
          <template #header>
            <!-- 👇 新增：淡入淡出过渡动画 -->
            <transition name="header-fade">
              <span v-if="mode === 'withOrder'">订单信息</span>
              <span v-else>产品</span>
            </transition>
          </template>

          <template #default="{ row }">
            <!-- 外层容器，实现融合动画 -->
            <div class="merge-cell">
              <!-- 有订单：订单号 + 订单条目 两列布局 -->
              <div class="order-columns" :class="{ hide: mode === 'withoutOrder' }">
                <!-- 订单号 -->
                <div class="order-num-col">
                  <el-input v-model="row.orderNum" placeholder="自动填充订单号" readonly style="width: 100%" />
                </div>
                <!-- 订单条目 -->
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

              <!-- 无订单：产品选择列（和上面融合切换） -->
              <div class="product-column" :class="{ show: mode === 'withoutOrder' }">
                <!-- 👇 关键：只有无订单模式才渲染这个下拉框 -->
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

        <!-- 剩余列：数量、备注、操作 完全不动 -->
        <el-table-column label="送货数量" prop="number" align="center" width="100">
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
  <ItemSelector ref="itemSelectorRef" @confirm="onSelectItems" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElLoading, ElMessage } from "element-plus";
import { addBatchApi } from "@/api/modules/orderOut";
import ItemSelector from "./ItemSelector.vue";

const visible = ref(false);
const materList = ref<{ value: number; label: string; num?: string }[]>([]);
let getTableList: (() => void) | null = null;

// 模式控制：默认【有订单】
const mode = ref<"withOrder" | "withoutOrder">("withOrder");
// ====================== 核心：获取今日日期（YYYY-MM-DD） ======================
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
  num: "",
  records: [] as Array<{
    orderMaterId: number | null;
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
const rules = {
  date: [{ required: true, message: "请选择出货日期" }],
  num: [{ required: true, message: "请输入送货单号" }],
};

// 选择器相关
const itemSelectorRef = ref();
const currentRow = ref<any>(null);

// 打开选择器
const openSelector = (row: any) => {
  if (mode.value === "withoutOrder") {
    ElMessage.warning("无订单模式下无需选择订单条目");
    return;
  }
  currentRow.value = row;
  itemSelectorRef.value.open();
};

// 选择订单条目回调
const onSelectItems = (selectedList: any[]) => {
  if (mode.value === "withoutOrder") return;
  if (!selectedList || selectedList.length === 0) {
    ElMessage.warning("请选择订单条目");
    return;
  }

  // 1. 单选
  if (selectedList.length === 1) {
    const item = selectedList[0];
    currentRow.value.orderMaterId = item.id;
    currentRow.value.materName = item.materName;
    currentRow.value.materNum = item.materNum;
    currentRow.value.orderNum = item.orderNum;
    currentRow.value.notAlreadyNumber = item.notAlreadyNumber; // 👈 存最大值
    currentRow.value.number = item.notAlreadyNumber; // 默认填最大值
    return;
  }

  // 2. 多选批量添加
  form.value.records = [];
  selectedList.forEach((item) => {
    form.value.records.push({
      orderMaterId: item.id,
      materName: item.materName,
      materNum: item.materNum,
      orderNum: item.orderNum,
      notAlreadyNumber: item.notAlreadyNumber, // 👈 存最大值
      number: item.notAlreadyNumber, // 默认填最大值
      remark: "",
      orderId: null,
      materId: "",
    });
  });
  ElMessage.success(`已批量添加 ${selectedList.length} 条订单条目`);
};

// 切换模式时自动清空无关字段
watch(mode, (newMode) => {
  form.value.records.forEach((row) => {
    if (newMode === "withOrder") {
      // 有订单：清空产品相关字段
      row.materId = "";
    } else {
      // 无订单：清空订单相关字段
      row.orderMaterId = null;
      row.orderNum = "";
      row.materName = "";
      row.materNum = "";
    }
  });
});

// 禁止选择未来日期
const disabledFutureDate = (time: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() > today.getTime();
};

// 打开弹窗
const open = (params: { materList?: { value: number; label: string; num?: string }[]; getTableList?: () => void }) => {
  visible.value = true;
  materList.value = params.materList || [];
  getTableList = params.getTableList || null;
  form.value.date = getToday();
  form.value.num = "";
  form.value.records = [];
  addRow();
};
// 实时限制数量不超过可开单数量
const handleNumberInput = (row: any) => {
  if (mode.value === "withoutOrder") return;
  if (!row.notAlreadyNumber) return;

  // 超过最大值，强制回显最大值
  if (row.number > row.notAlreadyNumber) {
    row.number = row.notAlreadyNumber;
    ElMessage.warning(`最多可出货：${row.notAlreadyNumber}`);
  }
};
// 添加一行
const addRow = () => {
  form.value.records.push({
    orderMaterId: null,
    materId: "",
    materNum: "",
    orderId: null,
    materName: "",
    orderNum: "",
    number: null,
    remark: "",
    notAlreadyNumber: null, // 👈 初始化
  });
};

// 删除一行
const removeRow = (index: number) => {
  form.value.records.splice(index, 1);
};

// 提交（根据模式适配字段）
const submit = async () => {
  if (!form.value.date) {
    return ElMessage.warning("请选择出货日期");
  }
  if (!form.value.num) {
    return ElMessage.warning("请输入送货单号");
  }
  if (!form.value.records.length) {
    return ElMessage.warning("请至少添加一条记录");
  }

  // 校验数据
  for (let i = 0; i < form.value.records.length; i++) {
    const item = form.value.records[i];
    if (!item.number || item.number <= 0) {
      ElMessage.warning(`第 ${i + 1} 行数量不能为空`);
      return;
    }
    if (mode.value === "withOrder" && !item.orderMaterId) {
      ElMessage.warning(`第 ${i + 1} 行未选择订单条目`);
      return;
    }
    // 👇 新增：校验数量不能超过可开单数量
    if (mode.value === "withOrder" && item.number > item.notAlreadyNumber) {
      ElMessage.warning(`第 ${i + 1} 行数量不能超过可开单数量：${item.notAlreadyNumber}`);
      return;
    }
    if (mode.value === "withoutOrder" && !item.materId) {
      ElMessage.warning(`第 ${i + 1} 行未选择产品`);
      return;
    }
  }

  // 按模式构造提交参数
  const payload = form.value.records.map((r) => {
    if (mode.value === "withOrder") {
      return {
        orderMaterId: r.orderMaterId,
        number: r.number,
        remark: r.remark,
        time: form.value.date,
        num: form.value.num,
        materNum: r.materNum,
        materName: r.materName,
        orderNum: r.orderNum,
      };
    } else {
      return {
        materId: r.materId,
        number: r.number,
        remark: r.remark,
        time: form.value.date,
        num: form.value.num,
      };
    }
  });

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
// 本项目已提取公共逻辑到：../orderMater/components/useBatchAddCommon.ts
// 该文件包含：useBatchAddCommon hook，封装了批量添加的核心公共逻辑
//
// 当前组件保留了原有实现。未来可重构为：
//   import { useBatchAddCommon } from "../orderMater/components/useBatchAddCommon";
//   const { form, rules, mode, submit, addRow, ... } = useBatchAddCommon({
//     mode: 'withOrder',
//     submitApi: addBatchApi,
//     dateFieldLabel: "出货日期",
//     numFieldLabel: "送货单号"
//   });
//
// 这样可消除两个组件间 90% 的重复代码，便于统一维护
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

/* 融合单元格基础样式 */
.merge-cell {
  position: relative;
  width: 100%;
  height: 32px;
}

/* 订单两列布局 */
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
/* 隐藏时：收缩+透明+禁止交互 */
.order-columns.hide {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none; /* 彻底禁止点击/输入 */
}

/* 订单号列宽度 */
.order-num-col {
  width: 200px;
  flex-shrink: 0;
}
/* 订单条目列宽度 */
.order-item-col {
  flex: 1;
}

/* 产品列：默认隐藏+禁止交互 */
.product-column {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  margin: 0 auto;
  opacity: 0;
  transition: all 1.45s cubic-bezier(0.25, 0.8, 0.25, 1); /*无订单产品列展开*/
  transform: scale(0.9);
  pointer-events: none; /* 彻底禁止交互 */
}
/* 显示时：展开+放大+恢复交互 */
.product-column.show {
  opacity: 1;
  transform: scale(1);
  width: 100%;
  pointer-events: auto; /* 恢复点击/输入 */
}
</style>
