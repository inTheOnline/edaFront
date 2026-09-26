<template>
  <el-drawer
    v-model="visible"
    :title="mode === 'order' && editId ? '编辑采购单' : titles[mode]"
    :size="drawerSize"
    :close-on-click-modal="!saving"
    :before-close="beforeClose"
    destroy-on-close
  >
    <div v-loading="loading" class="supply-editor">
      <el-form v-if="mode === 'supply'" label-position="top" @submit.prevent="submit">
        <div class="field-pair">
          <el-form-item label="用品名称" required><el-input v-model="item.name" maxlength="100" /></el-form-item>
          <el-form-item label="规格"><el-input v-model="item.spec" maxlength="100" /></el-form-item>
        </div>
        <div class="field-pair">
          <el-form-item label="单位" required
            ><el-input v-model="item.unit" placeholder="支 / 包 / 个" maxlength="20"
          /></el-form-item>
          <el-form-item label="分类"><el-input v-model="item.category" maxlength="50" /></el-form-item>
        </div>
        <div class="field-pair">
          <el-form-item label="存放位置"><el-input v-model="item.location" maxlength="100" /></el-form-item>
          <el-form-item label="最低库存"
            ><el-input-number :controls="false" v-model="item.minimum" :min="0" :precision="2"
          /></el-form-item>
        </div>
        <p class="hint">库存通过入库和发放登记变动。已有出入库记录后，可以修改名称，规格和单位不可修改。</p>
      </el-form>

      <el-form v-else label-position="top" :disabled="isDetail" @submit.prevent="submit">
        <template v-if="mode === 'issue'">
          <el-form-item label="关联请购单（选填）">
            <el-select v-model="form.requestId" clearable filterable placeholder="不关联，直接发放" @change="linkRequest">
              <el-option
                v-for="row in pending"
                :key="row.id"
                :value="row.id"
                :label="'#' + row.id + ' · ' + userName(row.userId) + ' · ' + row.purpose"
              />
            </el-select>
            <div class="hint">关联后自动带入领取人、用品和用途。</div>
          </el-form-item>
          <el-form-item label="领取人" required>
            <div v-if="form.requestId" class="read-value">{{ userName(form.recipientId) }}</div>
            <el-select v-else v-model="form.recipientId" filterable placeholder="选择领取人">
              <el-option
                v-for="user in userOptions"
                :key="String(user.value)"
                :value="Number(user.value)"
                :label="String(user.label)"
              />
            </el-select>
          </el-form-item>
        </template>
        <template v-if="mode === 'order' || mode === 'orderDetail'">
          <el-form-item label="供应商 / 采购平台" required
            ><el-input v-model="form.supplier" maxlength="100" placeholder="填写供应商或采购平台"
          /></el-form-item>
          <el-form-item label="采购日期" required
            ><el-date-picker v-model="form.buyDate" value-format="YYYY-MM-DD" type="date"
          /></el-form-item>
          <el-form-item label="备注"><el-input v-model="form.remark" maxlength="500" /></el-form-item>
        </template>
        <template v-else>
          <div v-if="mode === 'requestDetail'" class="detail-meta">
            请购人：{{ userName(detailUser) }} <span>{{ detailStatus }}</span>
          </div>
          <el-form-item :label="mode === 'receipt' ? '入库说明' : '用途'" required>
            <el-input
              v-model="form.purpose"
              type="textarea"
              :rows="2"
              maxlength="500"
              show-word-limit
              :disabled="mode === 'issue' && !!form.requestId"
            />
          </el-form-item>
        </template>
        <div v-if="mode === 'receipt'" class="hint receipt-note">
          {{
            form.orderId
              ? "关联采购单 #" + form.orderId + "，按实际到货数量入库。"
              : "用于期初库存等无采购单入库；有采购单的到货请从采购单登记入库。"
          }}
        </div>
        <div class="line-heading">
          <h3>{{ lineTitle }}</h3>
          <el-button v-if="!isDetail && !linked" link type="primary" @click="addLine">添加用品</el-button>
        </div>
        <div v-for="(line, index) in form.lines" :key="index" class="supply-line" :class="{ 'request-line': mode === 'request' }">
          <div class="line-top">
            <div v-if="linked || isDetail" class="read-supply">
              <strong>{{ supplyOf(line)?.name || "#" + line.supplyId }}</strong>
              <span>{{ supplyOf(line)?.spec || "无规格" }}</span>
            </div>
            <el-select v-else v-model="line.supplyId" filterable placeholder="选择用品">
              <el-option
                v-for="supply in supplies"
                :key="supply.id"
                :value="supply.id"
                :label="supply.name + (supply.spec ? ' · ' + supply.spec : '')"
              />
            </el-select>
            <el-button
              v-if="!isDetail && !linked && form.lines.length > 1"
              link
              type="danger"
              @click="form.lines.splice(index, 1)"
              >移除</el-button
            >
          </div>
          <div class="line-values">
            <el-form-item
              :label="isDetail ? '申请 / 采购数量' : mode === 'issue' ? '发放数量' : mode === 'receipt' ? '本次入库数量' : '数量'"
            >
              <el-input-number
                :controls="false"
                v-model="line.quantity"
                :min="linked ? 0 : 0.01"
                :max="lineLimit(line)"
                :precision="2"
              />
              <span class="unit">{{ supplyOf(line)?.unit }}</span>
            </el-form-item>
            <el-form-item v-if="mode === 'order' || mode === 'orderDetail'" label="单价（元）">
              <el-input-number :controls="false" v-model="line.unitPrice" :min="0" :precision="3" />
            </el-form-item>
          </div>
          <div class="line-summary">
            <span>当前库存：{{ supplyOf(line)?.stock ?? "—" }} {{ supplyOf(line)?.unit }}</span>
            <span v-if="mode === 'issue'">发放后：{{ Number(supplyOf(line)?.stock || 0) - Number(line.quantity || 0) }}</span>
            <span v-else-if="mode === 'order' || mode === 'orderDetail'"
              >金额：¥{{ money(line.quantity * (line.unitPrice || 0)) }}</span
            >
            <span v-if="isDetail"
              >{{ mode === "requestDetail" ? "已发放" : "已入库" }}：{{ line.issued ?? line.received ?? 0 }}</span
            >
            <span v-else-if="linked">单据剩余：{{ remaining.get(line.supplyId!) }}</span>
          </div>
        </div>
        <p v-if="linked && !isDetail" class="hint">无需本次处理的用品，数量填 0。系统不预留库存。</p>
        <div v-if="mode === 'order' || mode === 'orderDetail'" class="total">
          采购合计 <strong>¥{{ money(total) }}</strong>
        </div>
        <p v-if="detailNote" class="hint">处理备注：{{ detailNote }}</p>
      </el-form>
    </div>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">{{ isDetail ? "关闭" : "取消" }}</el-button>
      <el-button v-if="!isDetail" type="primary" :loading="saving" :disabled="loading" @click="submit">{{
        submitLabel
      }}</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useWindowSize } from "@vueuse/core";
import { useDictStore } from "@/stores/modules/dict";
import { generateUUID } from "@/utils";
import { supplyApi, type Supply, type SupplyCommand, type SupplyLine, type SupplyRequest } from "@/api/modules/buy/officeSupply";

type Mode = "supply" | "request" | "order" | "issue" | "receipt" | "requestDetail" | "orderDetail";
const props = defineProps<{ supplies: Supply[] }>();
const emit = defineEmits<{ saved: [] }>();
const dict = useDictStore();
const { width } = useWindowSize();
const drawerSize = computed(() => (width.value < 700 ? "100%" : "580px"));
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const mode = ref<Mode>("issue");
const editId = ref<number>();
const item = reactive<Partial<Supply>>({});
const form = reactive<SupplyCommand>({ token: "", lines: [] });
const pending = ref<SupplyRequest[]>([]);
const remaining = new Map<number, number>();
const detailUser = ref<number>();
const detailStatus = ref("");
const detailNote = ref("");
const titles: Record<Mode, string> = {
  supply: "用品档案",
  request: "新建请购",
  order: "新建采购单",
  issue: "发放登记",
  receipt: "入库登记",
  requestDetail: "请购详情",
  orderDetail: "采购详情",
};
const isDetail = computed(() => mode.value.endsWith("Detail"));
const linked = computed(() => !!form.requestId || !!form.orderId);
const lineTitle = computed(() => (mode.value === "issue" ? "发放明细" : mode.value === "receipt" ? "入库明细" : "用品明细"));
const submitLabel = computed(() =>
  mode.value === "issue" ? "确认发放" : mode.value === "receipt" ? "确认入库" : mode.value === "request" ? "提交请购" : "保存",
);
const userOptions = computed(() => dict.dictMap.user || []);
const userName = (id?: number) => (id ? String(dict.getLabel("user", id) || id) : "—");
const supplyOf = (line: SupplyLine) => props.supplies.find((item) => item.id === line.supplyId);
const total = computed(() => form.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0));
const money = (value: number) => Number(value || 0).toFixed(3);
const addLine = () => form.lines.push({ supplyId: undefined, quantity: 1, unitPrice: 0 });
const lineLimit = (line: SupplyLine) => (isDetail.value ? undefined : linked.value ? remaining.get(line.supplyId!) : undefined);
const beforeClose = (done: () => void) => {
  if (!saving.value) done();
};

async function loadPending() {
  const list: SupplyRequest[] = [];
  let page = 1;
  while (true) {
    const { data } = await supplyApi.requests({ pageNum: page++, pageSize: 100, status: "active" });
    list.push(...data.records);
    if (!data.records.length || list.length >= data.total) break;
  }
  pending.value = list;
}
async function linkRequest(id?: number) {
  form.requestId = id || undefined;
  remaining.clear();
  if (!id) {
    form.recipientId = undefined;
    form.purpose = "";
    form.lines = [];
    addLine();
    return;
  }
  loading.value = true;
  try {
    const { data } = await supplyApi.request(id);
    if (form.requestId !== id) return;
    form.recipientId = data.header.userId;
    form.purpose = data.header.purpose;
    form.lines = data.lines
      .filter((line) => Number(line.quantity) > Number(line.issued || 0))
      .map((line) => {
        const left = Number(line.quantity) - Number(line.issued || 0);
        remaining.set(line.supplyId!, left);
        return { supplyId: line.supplyId, quantity: Math.min(left, Number(supplyOf(line)?.stock || 0)) };
      });
  } finally {
    loading.value = false;
  }
}
async function open(nextMode: Mode, row?: Supply | { id: number }, requestId?: number) {
  mode.value = nextMode;
  editId.value = nextMode === "order" ? row?.id : undefined;
  Object.assign(form, {
    token: generateUUID(),
    lines: [],
    requestId: undefined,
    orderId: undefined,
    recipientId: undefined,
    purpose: "",
    supplier: "",
    buyDate: new Date().toLocaleDateString("sv-SE"),
    remark: "",
  });
  Object.keys(item).forEach((key) => delete item[key as keyof Supply]);
  remaining.clear();
  detailNote.value = "";
  visible.value = true;
  loading.value = true;
  try {
    if (nextMode === "supply") {
      Object.assign(item, { name: "", spec: "", unit: "", category: "", location: "", minimum: 0 }, row || {});
      return;
    }
    if (nextMode === "issue") {
      await loadPending();
      if (requestId) {
        await linkRequest(requestId);
        return;
      }
    }
    if (nextMode === "requestDetail" && row) {
      const { data } = await supplyApi.request(row.id);
      form.purpose = data.header.purpose;
      form.lines = data.lines;
      detailUser.value = data.header.userId;
      detailStatus.value = data.header.status;
      detailNote.value = data.header.note || "";
      return;
    }
    if ((nextMode === "order" || nextMode === "orderDetail" || nextMode === "receipt") && row && !("stock" in row)) {
      const { data } = await supplyApi.order(row.id);
      Object.assign(form, { supplier: data.header.supplier, buyDate: data.header.buyDate, remark: data.header.remark });
      if (nextMode === "orderDetail" || nextMode === "order") {
        form.lines = data.lines;
        return;
      }
      form.orderId = row.id;
      form.purpose = "采购到货入库";
      form.lines = data.lines
        .filter((line) => Number(line.quantity) > Number(line.received || 0))
        .map((line) => {
          const left = Number(line.quantity) - Number(line.received || 0);
          remaining.set(line.supplyId!, left);
          return { supplyId: line.supplyId, quantity: left };
        });
      return;
    }
    addLine();
    if (row && "stock" in row) form.lines[0].supplyId = row.id;
  } catch {
    visible.value = false;
  } finally {
    loading.value = false;
  }
}
async function submit() {
  if (saving.value || loading.value) return;
  if (mode.value === "supply") {
    if (!item.name?.trim() || !item.unit?.trim()) {
      ElMessage.warning("请填写用品名称和单位");
      return;
    }
  } else {
    if (["request", "issue", "receipt"].includes(mode.value) && !form.purpose?.trim()) {
      ElMessage.warning("请填写用途或入库说明");
      return;
    }
    if (mode.value === "issue" && !form.recipientId) {
      ElMessage.warning("请选择领取人");
      return;
    }
    if (mode.value === "order" && (!form.supplier?.trim() || !form.buyDate)) {
      ElMessage.warning("请填写供应商和采购日期");
      return;
    }
    const lines = linked.value ? form.lines.filter((line) => line.quantity > 0) : form.lines;
    if (!lines.length || lines.some((line) => !line.supplyId || !(line.quantity > 0))) {
      ElMessage.warning("请填写用品和有效数量");
      return;
    }
    if (new Set(lines.map((line) => line.supplyId)).size !== lines.length) {
      ElMessage.warning("同一种用品请合并为一行");
      return;
    }
    if (mode.value === "issue" && lines.some((line) => line.quantity > Number(supplyOf(line)?.stock || 0))) {
      ElMessage.warning("发放数量超过当前库存");
      return;
    }
  }
  saving.value = true;
  try {
    if (mode.value === "supply") await supplyApi.save(item);
    else if (mode.value === "order" && editId.value) await supplyApi.editOrder(editId.value, form);
    else if (!isDetail.value)
      await supplyApi.submit(mode.value as "request" | "order" | "issue" | "receipt", {
        ...form,
        lines: form.lines.filter((line) => line.quantity > 0),
      });
    ElMessage.success(mode.value === "issue" ? "发放成功，库存已扣减" : mode.value === "receipt" ? "入库成功" : "保存成功");
    visible.value = false;
    emit("saved");
  } catch {
    // 全局接口拦截器展示错误，保留输入及提交标识，避免不确定结果被重复登记。
  } finally {
    saving.value = false;
  }
}
defineExpose({ open });
</script>

<style scoped lang="scss">
.supply-editor {
  color: var(--el-text-color-primary);
}
.read-value {
  color: var(--el-text-color-primary);
}
.read-supply {
  display: grid;
  gap: 6px;
}
.read-supply strong {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.read-supply span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.field-pair,
.line-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.el-select {
  width: 100%;
}
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
.receipt-note {
  margin-bottom: 20px;
}
.line-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24px 0 12px;
}
h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.supply-line {
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.line-top {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.line-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.line-values :deep(.el-form-item) {
  margin-bottom: 12px;
}
.line-values :deep(.el-input-number) {
  width: 140px;
}
.supply-editor :deep(.el-input-number) {
  width: 100%;
}
.supply-editor :deep(.el-input-number .el-input__inner) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.line-values :deep(.el-form-item__content) {
  flex-wrap: nowrap;
}
.request-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, 160px);
  gap: 10px 16px;
  align-items: start;
}
.request-line .line-top {
  padding-top: 30px;
  min-width: 0;
  margin-bottom: 0;
}
.request-line .line-values {
  display: block;
  min-width: 0;
}
.request-line .line-summary {
  grid-column: 1 / -1;
}
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
.total {
  display: flex;
  justify-content: space-between;
  padding: 20px 0;
}
.total strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
.detail-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
@media (max-width: 500px) {
  .field-pair,
  .line-values {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
