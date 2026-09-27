<template>
  <div v-if="evidence.length" class="answer-evidence">
    <el-collapse>
      <el-collapse-item v-for="(item, index) in evidence" :key="index" :title="`查询依据 ${item.reference || index + 1}`" :name="index">
        <p v-if="context(item.data)" class="evidence-context">{{ context(item.data) }}</p>
        <p v-if="filters(item.data)" class="evidence-context">{{ filters(item.data) }}</p>
        <template v-for="(table, tableIndex) in tables(item.data)" :key="tableIndex">
          <el-table :data="table.rows" border max-height="320" size="small">
            <el-table-column v-for="key in table.keys" :key="key" :prop="key" :label="labels[key] || key" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ cell(row[key]) }}</template>
            </el-table-column>
          </el-table>
        </template>
        <pre v-if="!tables(item.data).length" class="evidence-data">{{ cell(item.data) }}</pre>
        <div v-if="item.sources?.length" class="source-list">
          <span>来源</span>
          <template v-for="(source, sourceIndex) in item.sources" :key="sourceIndex">
            <el-button v-if="safePath(source.url)" link type="primary" @click="openSource(source)">{{ source.title || '查看依据' }}</el-button>
            <span v-else>{{ source.title || '系统查询' }}</span>
          </template>
        </div>
      </el-collapse-item>
    </el-collapse>
    <el-alert v-if="sourceError" class="source-error" :title="sourceError" type="warning" show-icon @close="sourceError = ''" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { downloadAiDocument, type AiEvidence, type AiSource } from "@/api/modules/ai";

defineProps<{ evidence: AiEvidence[] }>();
const router = useRouter();
const sourceError = ref("");
const labels: Record<string, string> = {
  id: "编号", num: "单号", name: "名称", orderNum: "订单号", custName: "客户", materNum: "产品编号",
  materName: "产品名称", qty: "数量", quantity: "数量", number: "数量", stock: "库存", status: "状态",
  date: "日期", deliveryDate: "交期", createdAt: "创建时间", updatedAt: "更新时间", title: "标题",
  amount: "金额", price: "单价", remark: "备注", total: "合计", remaining: "未交数量", heading: "章节", content: "原文", version: "版本",
  code: "编号", active: "有效", enabled: "启用", state: "状态", closed: "已关闭", type: "类型", spec: "规格", unit: "单位",
  customerId: "客户编号", customerName: "客户", supplierId: "供应商编号", supplierName: "供应商", projectId: "项目编号",
  productId: "产品编号", productCode: "产品编码", productName: "产品名称", pluginProductId: "插件编号", pluginCode: "插件编码", pluginName: "插件名称",
  staffId: "员工编号", staffName: "员工", departmentId: "部门编号", departmentName: "部门", documentId: "单据编号", documentCode: "单据号",
  orderId: "订单编号", orderCode: "订单号", rawId: "原料编号", rawCode: "原料编码", rawName: "原料名称", assistId: "辅材编号", assistCode: "辅材编码", assistName: "辅材名称",
  essence: "材质", weight: "重量", theoryWeight: "理论重量", unitWeight: "单件重量", flag: "标识", sheetRawId: "片料编号", rollRawId: "卷料编号",
  sheetOutputNumber: "片料出数", rollUnitWeight: "卷料单位重量", grossWeight: "毛重", sheetWeight: "片料重量", utilBadWeight: "废料重量", materQty: "产品用量", assistQty: "辅材用量",
  totalQuantity: "总数量", shippedQuantity: "已出货数量", pendingQuantity: "待处理数量", receivedQuantity: "已收数量", productionQuantity: "生产数量",
  purchaseWeight: "采购重量", receivedWeight: "已收重量", pendingWeight: "待收重量", oldPrice: "原单价", diffPrice: "价差", changeRate: "变动比例", stampingFee: "冲压费", unitPrice: "单价", totalAmount: "总金额",
  warehouseCode: "仓库编码", warehouseName: "仓库", itemType: "物料类型", qualityStatus: "质量状态", direction: "方向", changeQuantity: "变动数量", flowType: "流水类型", sourceType: "来源类型",
  hours: "工时", overtimeHours: "加班工时", weekendHours: "周末工时", normalHours: "正常工时", process: "工序", processDetail: "工序明细", machine: "机台", defect: "不良数量", scrap: "报废数量",
  groupHours: "共用工时", reportId: "日报编号", startDate: "开始日期", endDate: "结束日期", runId: "运行编号", included: "已纳入", standardHours: "标准工时", standardRate: "标准效率", ruleVersion: "规则版本",
  basicNorm: "基本工资标准", overNorm: "加班工资标准", nightNorm: "夜班标准", otherNorm: "其他标准", postNorm: "岗位标准", bonus: "奖金", eatCutpay: "餐费扣款", fixedDeduction: "固定扣款", social: "社保",
  salaryMonth: "工资月份", workHours: "工作时长", baseSalary: "基本工资", overPay: "加班工资", weekOverPay: "周末加班工资", salaryTotal: "工资合计", deduction: "扣款", grossPay: "应发工资", netPay: "实发工资",
  visibility: "可见范围", ownerUserId: "所属用户编号", roleId: "角色编号", roleName: "角色", path: "页面路径", parentId: "上级编号", balance: "结余", minimum: "最低库存", category: "类别",
  dataset: "业务类型", keyword: "关键词", from: "开始日期", to: "结束日期", year: "年份", month: "月份", page: "页码", pageSize: "每页数量", custId: "客户编号",
  throughDate: "统计截至日期", future: "未来期间", monthTotal: "月度合计", yearTotal: "年度合计", previousMonth: "上月", previousYear: "上年", pending: "未交金额", momRate: "环比", yoyRate: "同比", top3Share: "前三客户占比",
  customerSharesAvailable: "客户占比可用", trend: "趋势", customers: "客户", products: "产品", profit: "利润", net: "净额", shipped: "出货", returned: "退货", adjustment: "调整", lineCount: "明细数",
  missingPriceCount: "缺价明细数", missingPriceQuantity: "缺价数量", share: "占比", change: "变化", supported: "支持统计", months: "月份", revenue: "营业额", copperPrice: "铜价", copperPriceThroughDate: "铜价截至日期",
  copperPriceProvisional: "铜价暂估", missingCopperPrice: "缺少铜价", materialCost: "材料成本", outCost: "外发成本", fixedCost: "固定成本", grossProfit: "毛利", margin: "毛利率", complete: "完整", missingWeightCount: "缺重量记录数", missingOutCount: "缺外发成本记录数"
};
function cell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
function tables(value: unknown) {
  const candidates = Array.isArray(value) ? [value] : value && typeof value === "object" ? Object.values(value) : [];
  return candidates.filter((rows): rows is Record<string, unknown>[] =>
    Array.isArray(rows) && rows.length > 0 && rows.every(row => row && typeof row === "object" && !Array.isArray(row))
  ).map(rows => ({ rows, keys: Array.from(new Set(rows.flatMap(row => Object.keys(row)))) }));
}
function context(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const data = value as Record<string, unknown>;
  return [data.asOf ? `查询时间：${String(data.asOf).replace("T", " ")}` : "", data.scope,
    data.page != null ? `第 ${cell(data.page)} 页` : "", data.pageSize != null ? `每页 ${cell(data.pageSize)} 条` : "",
    data.hoursRule, data.hasMore ? "还有更多记录，可继续缩小条件或查询下一页。" : ""].filter(Boolean).join(" · ");
}
function filters(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const query = (value as Record<string, unknown>).filters;
  if (!query || typeof query !== "object" || Array.isArray(query)) return "";
  const conditions = Object.entries(query).filter(([, value]) => value != null && value !== "").map(([key, value]) => `${labels[key] || key}：${cell(value)}`);
  return `筛选条件：${conditions.join(" · ") || "未指定"}`;
}
function safePath(value?: string) {
  if (!value || /[\\\u0000-\u001f]/.test(value)) return "";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith("/") ? url.pathname + url.search + url.hash : "";
  } catch { return ""; }
}
async function openSource(source: AiSource) {
  sourceError.value = "";
  const path = safePath(source.url);
  if (!path) return;
  const pathDocumentId = path.match(/^\/ai\/documents\/(\d+)(?:\/download)?$/)?.[1];
  // knowledge.id 为分段编号，只允许使用明确的 documentId 或文档 URL。
  const documentId = source.kind === "knowledge" && Number.isSafeInteger(source.documentId) && Number(source.documentId) > 0
    ? source.documentId : pathDocumentId ? Number(pathDocumentId) : undefined;
  try {
    if (documentId) await downloadAiDocument(Number(documentId), source.title);
    else {
      const target = router.resolve(path);
      if (!target.matched.some(route => route.path !== "/:pathMatch(.*)*")) throw new Error("当前账号无法访问该业务页面，或页面已移除");
      await router.push(path);
    }
  } catch (error) { sourceError.value = `无法打开“${source.title || '来源资料'}”：${error instanceof Error ? error.message : '资料当前不可访问'}`; }
}
</script>

<style scoped>
.answer-evidence { margin-top: 14px; }
.evidence-context { margin: 0 0 10px; line-height: 1.7; color: var(--el-text-color-secondary); }
.source-error { margin-top: 12px; }
.source-list { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 12px; color: var(--el-text-color-secondary); }
.source-list :deep(.el-button) { margin: 0; white-space: normal; height: auto; text-align: left; }
.evidence-data { max-height: 320px; overflow: auto; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
.el-table + .el-table { margin-top: 12px; }
</style>
