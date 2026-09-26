<template>
  <el-dialog
    v-model="visible"
    class="statement-dialog"
    title="导出对账单"
    width="min(1280px, 96vw)"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <el-form label-width="100px" :disabled="saving">
      <div class="statement-filter">
        <el-form-item label="客户" required>
          <el-select v-model="form.custId" filterable placeholder="请选择客户" @change="changeCustomer">
            <el-option
              v-for="item in dict.dictMap.cust || []"
              :key="item.value"
              :value="Number(item.value)"
              :label="item.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="对账月份" required>
          <el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" :clearable="false" @change="changeCustomer" />
        </el-form-item>
      </div>
      <el-alert v-if="loading" title="正在加载客户模板…" type="info" :closable="false" />
      <el-alert v-else-if="loadError" :title="loadError" type="error" :closable="false">
        <el-button link type="primary" @click="loadOptions">重新加载</el-button>
      </el-alert>
      <template v-else-if="options">
        <el-alert
          v-if="!options.supported"
          title="该客户使用默认模板，默认模板尚未设计；目前可使用工具箱中的 Excel导出。"
          type="warning"
          :closable="false"
        />
        <template v-else>
          <el-alert
            :title="`${options.customer}专用模板 · ${options.periodLabel} · 实际纳入 ${options.period.start} 至 ${options.period.end}（含首尾日）`"
            type="info"
            :closable="false"
          />
          <p class="statement-hint">
            导出该客户账期内全部出库及退货记录，不受列表筛选、勾选和分页影响。以下内容仅用于本次文件，未填项保持空白。
          </p>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="附加内容（选填）" name="extra">
              <div class="statement-fields">
                <el-form-item v-for="field in fields" :key="field.key" :label="field.label">
                  <el-input-number
                    v-if="field.money"
                    :model-value="numberValue(field.key)"
                    @update:model-value="form.extra[field.key] = $event"
                    :controls="false"
                    :precision="2"
                    placeholder="不填留空"
                  />
                  <el-input
                    v-else
                    v-model="form.extra[field.key]"
                    :type="field.key === 'deductionItems' ? 'textarea' : 'text'"
                    maxlength="500"
                    placeholder="不填留空"
                  />
                </el-form-item>
              </div>
              <p v-if="options.customer === '东莞祥鑫'" class="statement-hint">
                应实收＝成品金额－原材料金额＋改模款－扣款；包材单独展示。原材料行缺少数量或单价时，相关合计留空。
              </p>
              <p v-if="options.customer === '精型'" class="statement-hint">
                “精型项目”单独一个工作表，其余项目归入“精型来料加工”。未税价＝系统含税价÷1.13；送货批次号沿用模板日期格式
                YYYYMMDD。
              </p>
            </el-tab-pane>
            <el-tab-pane v-for="section in options.sections" :key="section.key" :label="section.label" :name="section.key">
              <el-button type="primary" plain :icon="Plus" @click="addMaterial(section.key)"
                >添加{{ section.key === "raw" ? "材料" : "包材" }}</el-button
              >
              <p class="statement-hint">
                {{
                  section.key === "raw" ? "单价填写未税价；材料规格、名称和单位随所选材料带出。" : "单价填写含税价。"
                }}无记录可直接导出空表。
              </p>
              <el-table :data="sectionRows(section.key)" border max-height="420" empty-text="未填写材料，导出时保留空白">
                <el-table-column label="材料 / 包材" min-width="270">
                  <template #default="{ row }">
                    <el-select v-model="row.code" filterable placeholder="请选择" @change="selectMaterial(row, section.options)">
                      <el-option
                        v-for="item in section.options"
                        :key="item.code"
                        :value="item.code"
                        :label="item.code === item.name ? item.name : `${item.code} · ${item.name}`"
                      />
                    </el-select>
                    <div class="statement-specs">{{ materialInfo(row, section.options) }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="日期" width="160"
                  ><template #default="{ row }"
                    ><el-date-picker
                      v-model="row.date"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="选填"
                      style="width: 100%" /></template
                ></el-table-column>
                <el-table-column label="单据编号" min-width="170"
                  ><template #default="{ row }"><el-input v-model="row.doc" maxlength="100" /></template
                ></el-table-column>
                <el-table-column v-if="section.key === 'raw' && options.customer === '东莞祥鑫'" label="订单号" min-width="170"
                  ><template #default="{ row }"><el-input v-model="row.orderNum" maxlength="100" /></template
                ></el-table-column>
                <el-table-column v-if="section.key === 'raw' && options.customer === '东莞祥鑫'" label="厂区" width="110"
                  ><template #default="{ row }"><el-input v-model="row.factory" maxlength="50" /></template
                ></el-table-column>
                <el-table-column
                  v-if="section.key === 'raw' && options.customer === '广州祥鑫'"
                  label="成品代码 / 名称"
                  min-width="240"
                  ><template #default="{ row }"
                    ><el-input v-model="row.productCode" placeholder="成品代码" maxlength="100" /><el-input
                      v-model="row.productName"
                      placeholder="成品名称"
                      maxlength="200" /></template
                ></el-table-column>
                <el-table-column label="数量" width="140"
                  ><template #default="{ row }"
                    ><el-input-number
                      v-model="row.quantity"
                      :controls="false"
                      :min="0"
                      :precision="6"
                      style="width: 100%" /></template
                ></el-table-column>
                <el-table-column :label="section.key === 'raw' ? '未税单价' : '含税单价'" width="140"
                  ><template #default="{ row }"
                    ><el-input-number
                      v-model="row.price"
                      :controls="false"
                      :min="0"
                      :precision="6"
                      style="width: 100%" /></template
                ></el-table-column>
                <el-table-column v-if="options.customer === '东莞祥鑫'" label="备注" min-width="160"
                  ><template #default="{ row }"><el-input v-model="row.remark" maxlength="500" /></template
                ></el-table-column>
                <el-table-column label="操作" width="70" fixed="right"
                  ><template #default="{ row }"
                    ><el-button type="danger" link @click="removeMaterial(row)">移除</el-button></template
                  ></el-table-column
                >
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </template>
      </template>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">关闭</el-button>
      <el-button
        type="primary"
        :icon="Download"
        :loading="saving"
        :disabled="loading || !options?.supported || !!loadError"
        @click="download"
        >导出对账单</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { Download, Plus } from "@element-plus/icons-vue";
import { useDictStore } from "@/stores/modules/dict";
import { useDownload } from "@/hooks/useDownload";
import {
  exportStatement,
  getStatementOptions,
  type StatementOptions,
  type StatementRequest,
  type StatementMaterial,
  type StatementMaterialLine,
} from "@/api/modules/orderOut";

const dict = useDictStore();
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const loadError = ref("");
const activeTab = ref("extra");
const options = ref<StatementOptions>();
const form = reactive<StatementRequest>({ month: dayjs().format("YYYY-MM"), extra: {}, materials: [] });
let requestId = 0;
type Field = { key: string; label: string; money?: boolean };
const fields = computed<Field[]>(() => {
  const common: Field[] = [
    { key: "preparedBy", label: "制表人" },
    { key: "reviewedBy", label: "审核人" },
  ];
  const contact = [
    { key: "contact", label: "联系人" },
    { key: "phone", label: "电话" },
  ];
  switch (options.value?.customer) {
    case "精型":
      return contact;
    case "源科昱":
      return [
        ...contact,
        ...common,
        { key: "fax", label: "传真" },
        { key: "address", label: "地址" },
        { key: "accountName", label: "户名" },
        { key: "bank", label: "开户行" },
        { key: "account", label: "银行账号" },
        { key: "taxNumber", label: "税号" },
        { key: "payment", label: "结款方式" },
        { key: "purchaseAmount", label: "采购对账金额", money: true },
        { key: "financeAmount", label: "财务对账金额", money: true },
        { key: "unpaid", label: "未付款金额", money: true },
        { key: "uninvoiced", label: "未开票金额", money: true },
        { key: "deductionItems", label: "扣款项目" },
      ];
    case "东莞祥鑫":
      return [
        ...common,
        { key: "attention", label: "客户联系人" },
        { key: "customerPhone", label: "客户电话" },
        { key: "customerFax", label: "客户传真" },
        { key: "factory", label: "成品厂区" },
        { key: "moldAmount", label: "改模款", money: true },
        { key: "deductionAmount", label: "扣款", money: true },
      ];
    default:
      return common;
  }
});
const numberValue = (key: string) =>
  form.extra[key] === undefined || form.extra[key] === "" ? undefined : Number(form.extra[key]);
const sectionRows = (section: string) => form.materials.filter((row) => row.section === section);
const addMaterial = (section: string) => form.materials.push({ section, code: "" });
const removeMaterial = (row: StatementMaterialLine) => form.materials.splice(form.materials.indexOf(row), 1);
const selectMaterial = (row: StatementMaterialLine, materials: StatementMaterial[]) => {
  const material = materials.find((item) => item.code === row.code);
  row.productCode = material?.productCode;
  row.productName = material?.productName;
};
const materialInfo = (row: StatementMaterialLine, materials: StatementMaterial[]) => {
  const material = materials.find((item) => item.code === row.code);
  return material ? `${material.specs} · 单位：${material.unit}` : "";
};
const loadOptions = async () => {
  const id = ++requestId;
  options.value = undefined;
  loadError.value = "";
  if (!form.custId || !form.month) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const { data } = await getStatementOptions(form.custId, form.month);
    if (id === requestId) options.value = data;
  } catch {
    if (id === requestId) loadError.value = "客户模板加载失败，请重试";
  } finally {
    if (id === requestId) loading.value = false;
  }
};
const changeCustomer = () => {
  form.extra = {};
  form.materials = [];
  activeTab.value = "extra";
  void loadOptions();
};
const download = async () => {
  if (saving.value || !options.value?.supported || loading.value) return;
  if (form.materials.some((row) => !row.code)) {
    ElMessage.warning("请为已添加的行选择材料，或移除空行");
    return;
  }
  saving.value = true;
  try {
    const data = await exportStatement(form);
    // 二进制接口的业务错误可能也是 Blob，不能保存成伪 Excel。
    const blob = data instanceof Blob ? data : new Blob([data]);
    const prefix = await blob.slice(0, 2).text();
    if (prefix !== "PK") {
      let message = "导出失败，请稍后重试";
      try {
        const error = JSON.parse(await blob.text());
        message = error.msg || error.message || message;
      } catch {
        /* 非工作簿响应统一提示失败。 */
      }
      throw new Error(message);
    }
    await useDownload(async () => blob, `${options.value.customer}_${form.month}_对账单`, {}, false);
    ElMessage.success("对账单已导出");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导出失败，请稍后重试");
  } finally {
    saving.value = false;
  }
};
const open = async () => {
  visible.value = true;
  try {
    await dict.loadDicts(["cust"]);
  } catch {
    ElMessage.error("客户列表加载失败");
  }
};
defineExpose({ open });
</script>

<style scoped>
:global(.statement-dialog .el-dialog__body) {
  max-height: calc(80vh - 130px);
  overflow-y: auto;
}
.statement-filter,
.statement-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}
.statement-hint,
.statement-specs {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.statement-specs {
  margin-top: 4px;
}
.statement-fields :deep(.el-input-number),
.statement-filter :deep(.el-select) {
  width: 100%;
}
@media (max-width: 700px) {
  .statement-filter,
  .statement-fields {
    grid-template-columns: 1fr;
  }
}
</style>
