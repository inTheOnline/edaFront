<template>
  <el-dialog
    v-model="visible"
    title="录入退货"
    width="640px"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" :disabled="saving">
      <el-form-item label="退货单号" prop="num">
        <el-input v-model.trim="form.num" maxlength="20" show-word-limit placeholder="请输入退货单号" />
      </el-form-item>
      <el-form-item label="退货日期" prop="time">
        <el-date-picker v-model="form.time" type="date" value-format="YYYY-MM-DD" placeholder="请选择退货日期" />
      </el-form-item>
      <el-form-item label="关联订单">
        <el-input :model-value="selectedOrder?.orderNum || ''" readonly placeholder="可选，不选订单则只记录退货">
          <template #append><el-button @click="selectorRef?.open(true)">选择订单</el-button></template>
        </el-input>
        <el-button v-if="selectedOrder" link type="primary" @click="clearOrder">取消关联</el-button>
      </el-form-item>
      <el-form-item label="退货产品" prop="materId">
        <el-select
          v-model="form.materId"
          filterable
          :disabled="!!selectedOrder"
          placeholder="请选择产品"
          style="width: 100%"
          @change="selectProduct"
        >
          <el-option
            v-for="item in materList"
            :key="item.value"
            :value="item.value"
            :label="`${item.label}（${item.num || ''}）`"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="客户" prop="custId">
        <el-select
          :model-value="form.custId ?? undefined"
          @update:model-value="form.custId = $event"
          filterable
          :disabled="!!selectedOrder"
          placeholder="请选择客户"
          style="width: 100%"
          ><el-option v-for="item in dict.dictMap.cust || []" :key="item.value" :value="item.value" :label="item.label"
        /></el-select>
      </el-form-item>
      <el-form-item v-if="canViewPrice" label="含税单价">
        <el-input-number
          :key="`${form.orderMaterId || 'independent'}-${form.priceLoading}`"
          :model-value="form.price ?? undefined"
          @update:model-value="form.price = $event"
          :precision="4"
          :min="0"
          :controls="false"
          :disabled="!!selectedOrder || !canEditPrice || form.priceLoading || form.priceError"
        />
      </el-form-item>
      <el-form-item label="退货数量" prop="number">
        <el-input-number v-model="form.number" :min="0" :controls="false" />
        <span v-if="selectedOrder" class="quantity-hint">当前已出货：{{ selectedOrder.alreadyNumber }}</span>
      </el-form-item>
      <el-form-item label="同步库存">
        <el-switch v-model="form.syncStock" />
        <span class="quantity-hint">开启后增加不良品库存，备注“客户退货”</span>
      </el-form-item>
      <el-form-item label="退货备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="可填写退货原因" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存退货</el-button>
    </template>
  </el-dialog>
  <ItemSelector ref="selectorRef" @confirm="selectOrder" />
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import dayjs from "dayjs";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { addOrderReturn, type OrderReturn } from "@/api/modules/orderOut";
import ItemSelector from "./ItemSelector.vue";
import { getOrderProductInfo } from "@/api/modules/order";
import { useDictStore } from "@/stores/modules/dict";
import { useOrderPrice, loadProductPrice, type ProductPriceState } from "@/views/order/orderTable/components/useOrderPrice";
const dict = useDictStore();
const { canViewPrice, canEditPrice } = useOrderPrice();

type Product = { value: number | string; label: string; num?: string };
type SelectedOrder = {
  id: number;
  materId: number;
  orderNum: string;
  alreadyNumber: number;
  custId: number;
  price?: number | null;
};
const visible = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const selectorRef = ref<InstanceType<typeof ItemSelector>>();
const materList = ref<Product[]>([]);
const selectedOrder = ref<SelectedOrder>();
const defaults = (): OrderReturn => ({ num: "", number: 0, time: dayjs().format("YYYY-MM-DD"), remark: "", syncStock: true });
const form = ref<OrderReturn & ProductPriceState>(defaults());
let refresh: (() => void) | undefined;
const rules: FormRules = {
  num: [{ required: true, whitespace: true, message: "请输入退货单号", trigger: "blur" }],
  time: [{ required: true, message: "请选择退货日期", trigger: "change" }],
  materId: [{ required: true, message: "请选择退货产品", trigger: "change" }],
  custId: [{ required: true, message: "请选择客户", trigger: "change" }],
  number: [
    {
      validator: (_rule, value, callback) => {
        if (!Number.isFinite(value) || value <= 0) return callback(new Error("退货数量必须大于0"));
        if (selectedOrder.value && value > selectedOrder.value.alreadyNumber)
          return callback(new Error("退货数量不能超过订单已出货数"));
        callback();
      },
      trigger: ["blur", "change"],
    },
  ],
};
const clearOrder = () => {
  selectedOrder.value = undefined;
  form.value.orderMaterId = undefined;
  formRef.value?.clearValidate("number");
};
const selectOrder = (rows: SelectedOrder[]) => {
  if (rows.length !== 1) return ElMessage.warning("请选择一条订单明细");
  selectedOrder.value = rows[0];
  form.value.orderMaterId = rows[0].id;
  form.value.custId = rows[0].custId;
  form.value.price = rows[0].price;
  form.value.priceLoading = false;
  form.value.priceError = false;
  form.value.materId = materList.value.find((item) => String(item.value) === String(rows[0].materId))?.value ?? rows[0].materId;
  formRef.value?.validateField(["materId", "number"]).catch(() => {});
};
const open = async (params: { materList: Product[]; getTableList?: () => void }) => {
  await dict.loadDict("cust");
  materList.value = params.materList || [];
  refresh = params.getTableList;
  form.value = defaults();
  selectedOrder.value = undefined;
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};
const submit = async () => {
  if (form.value.priceLoading || form.value.priceError)
    return ElMessage.warning("请等待产品信息加载完成；加载失败时请重新选择产品");
  if (saving.value || !(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    const payload = { ...form.value };
    delete payload.priceLoading;
    delete payload.priceError;
    if (payload.orderMaterId || !canEditPrice.value) delete payload.price;
    await addOrderReturn(payload);
    ElMessage.success("退货保存成功");
    visible.value = false;
    refresh?.();
  } finally {
    saving.value = false;
  }
};
defineExpose({ open });
const selectProduct = async (id: number | string) => {
  await loadProductPrice(form.value);
};
</script>

<style scoped>
.quantity-hint {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
}
:deep(.el-dialog) {
  max-width: calc(100vw - 32px);
}
</style>
