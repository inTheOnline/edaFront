<template>
  <el-dialog
    v-model="visible"
    :title="isReturn ? '编辑客户退货' : '编辑出货'"
    width="680px"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <el-form v-if="form" :disabled="saving" label-width="110px">
      <el-form-item :label="isReturn ? '退货单号' : '送货单号'"><el-input v-model.trim="form.num" maxlength="20" /></el-form-item>
      <el-form-item label="日期"><el-date-picker v-model="form.time" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="关联订单">
        <el-input
          :model-value="form.orderMaterId ? form.orderNum || `订单明细 #${form.orderMaterId}` : ''"
          readonly
          placeholder="未关联订单"
        >
          <template #append><el-button @click="selector?.open(isReturn, form.custId)">选择订单</el-button></template>
        </el-input>
        <el-button v-if="form.orderMaterId" link type="primary" @click="detach">取消关联</el-button>
      </el-form-item>
      <el-form-item label="客户"
        ><el-select
          :model-value="form.custId ?? undefined"
          @update:model-value="form.custId = $event"
          :disabled="!!form.orderMaterId || !!original?.orderMaterId"
          filterable
          ><el-option
            v-for="item in dict.dictMap.cust || []"
            :key="item.value"
            :value="item.value"
            :label="item.label" /></el-select
        ><small v-if="original?.orderMaterId && !form.orderMaterId">解绑保存后可更正客户。</small></el-form-item
      >
      <el-form-item label="产品"
        ><el-select v-model="form.materId" :disabled="!!form.orderMaterId" filterable @change="changeProduct"
          ><el-option
            v-for="item in products"
            :key="item.value"
            :value="item.value"
            :label="`${item.label}（${item.num || ''}）`" /></el-select
      ></el-form-item>
      <el-form-item :label="isReturn ? '退货数量' : '出货数量'"
        ><el-input-number v-model="form.number" :min="0" :controls="false"
      /></el-form-item>
      <el-form-item v-if="canViewPrice" label="含税单价">
        <el-input-number
          :key="`${form.orderMaterId ? 'bound' : 'independent'}-${productLoading}`"
          :model-value="form.price ?? undefined"
          @update:model-value="form.price = $event"
          :precision="4"
          :min="0"
          :controls="false"
          :disabled="!!form.orderMaterId || !canEditPrice || productLoading"
        />
        <small v-if="form.orderMaterId">跟随订单单价，请在订单中改价。</small>
      </el-form-item>
      <el-form-item label="库存联动"
        ><span>{{ form.syncStock ? "保存时同步调整原库存流水" : "原记录未同步库存，本次仍不变更库存" }}</span></el-form-item
      >
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
    </el-form>
    <template #footer
      ><el-button :disabled="saving" @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template
    >
  </el-dialog>
  <ItemSelector ref="selector" @confirm="selectOrder" />
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getOrderOutEditInfo, editOrderOut, type OrderOutEdit } from "@/api/modules/orderOut";
import { getOrderProductInfo } from "@/api/modules/order";
import { useDictStore } from "@/stores/modules/dict";
import { useOrderPrice } from "@/views/order/orderTable/components/useOrderPrice";
import ItemSelector from "./ItemSelector.vue";
type Product = { value: number | string; label: string; num?: string };
const dict = useDictStore();
const { canViewPrice, canEditPrice } = useOrderPrice();
const visible = ref(false),
  saving = ref(false),
  form = ref<OrderOutEdit>(),
  original = ref<OrderOutEdit>();
const productLoading = ref(false);
let productRequest = 0;
let lastProduct: Pick<OrderOutEdit, "materId" | "custId" | "price">;
const products = ref<Product[]>([]),
  selector = ref<InstanceType<typeof ItemSelector>>();
const isReturn = computed(() => Number(form.value?.status) === 2);
let refresh: (() => void) | undefined;
const open = async (id: number, params: { materList: Product[]; getTableList?: () => void }) => {
  const [{ data }] = await Promise.all([getOrderOutEditInfo(id), dict.loadDict("cust")]);
  original.value = { ...data };
  form.value = {
    ...data,
    number: Math.abs(Number(data.number)),
    orderMaterId: data.orderMaterId || null,
    time: String(data.time).slice(0, 10),
  };
  lastProduct = { materId: data.materId, custId: data.custId, price: data.price };
  productRequest++;
  productLoading.value = false;
  products.value = params.materList;
  refresh = params.getTableList;
  visible.value = true;
};
const detach = () => {
  if (form.value) {
    form.value.orderMaterId = null;
    form.value.orderNum = "";
  }
};
const selectOrder = (rows: any[]) => {
  if (rows.length !== 1) return ElMessage.warning("请选择一条订单明细");
  const row = rows[0],
    value = form.value!;
  if (original.value?.custId && String(original.value.custId) !== String(row.custId))
    return ElMessage.warning("不能关联其他客户的订单");
  Object.assign(value, {
    orderMaterId: row.id,
    materId: row.materId,
    custId: row.custId,
    orderNum: row.orderNum,
    price: row.price,
  });
  lastProduct = { materId: row.materId, custId: row.custId, price: row.price };
  productRequest++;
  productLoading.value = false;
};
const changeProduct = async (id: number | string) => {
  const value = form.value!;
  const previous = productLoading.value ? { ...lastProduct } : { ...lastProduct, custId: value.custId, price: value.price };
  lastProduct = previous;
  const request = ++productRequest;
  productLoading.value = true;
  value.price = undefined;
  try {
    const { data } = await getOrderProductInfo(id);
    if (request !== productRequest) return;
    if (previous.custId && String(previous.custId) !== String(data.custId)) {
      Object.assign(value, previous);
      return ElMessage.warning("不能更换为其他客户的产品");
    }
    value.custId = data.custId;
    value.price = data.price;
    lastProduct = { materId: value.materId, custId: value.custId, price: value.price };
  } catch {
    if (request === productRequest) {
      Object.assign(value, previous);
      ElMessage.error("产品信息加载失败，已保留原产品和价格");
    }
  } finally {
    if (request === productRequest) productLoading.value = false;
  }
};
const submit = async () => {
  if (saving.value || !form.value) return;
  if (productLoading.value) return ElMessage.warning("请等待产品信息加载完成");
  const value = form.value;
  if (!value.num || !value.time || !value.materId || !value.custId || !Number.isFinite(value.number) || value.number <= 0)
    return ElMessage.warning("请填写单号、日期、客户、产品和正数数量");
  saving.value = true;
  try {
    let scope: OrderOutEdit["scope"];
    const headerChanged = value.num !== original.value!.num || value.time !== String(original.value!.time).slice(0, 10);
    if (headerChanged && Number(value.headerLineCount) > 1) {
      try {
        await ElMessageBox.confirm("此单据还有其他明细。修改单号或日期时，可仅拆出当前项，或同步修改整张单据。", "选择修改范围", {
          confirmButtonText: "确认修改整单",
          cancelButtonText: "仅改此项",
          distinguishCancelAndClose: true,
          closeOnClickModal: false,
          type: "warning",
        });
        scope = "DOCUMENT";
      } catch (action) {
        if (action === "cancel") scope = "ITEM";
        else return;
      }
    }
    const payload: OrderOutEdit = {
      id: value.id,
      orderMaterId: value.orderMaterId || null,
      materId: value.materId,
      custId: value.custId,
      num: value.num,
      time: value.time,
      number: value.number,
      remark: value.remark,
      scope,
    };
    if (!value.orderMaterId && canEditPrice.value) payload.price = value.price;
    await editOrderOut(payload);
    ElMessage.success("修改成功");
    visible.value = false;
    refresh?.();
  } finally {
    saving.value = false;
  }
};
defineExpose({ open });
</script>
<style scoped>
.el-select {
  width: 100%;
}
small {
  display: block;
  color: var(--el-text-color-secondary);
  margin-left: 12px;
}
</style>
