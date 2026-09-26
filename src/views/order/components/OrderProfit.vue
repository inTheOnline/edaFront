<template>
  <section class="profit-panel" aria-label="胜蓝毛利估算">
    <header>
      <div>
        <h3>胜蓝毛利估算</h3>
        <p>按产品重量及外发报价估算 · 金额单位：元（含税）</p>
      </div>
      <el-tag effect="plain">{{ year }}年</el-tag>
    </header>
    <div v-if="!profit.supported" class="profit-placeholder">
      <p>{{ profit.reason || "目前仅统计胜蓝，其他客户待数据补齐后开放。" }}</p>
      <el-button v-if="shenglanId != null" type="primary" plain @click="emit('select-customer', shenglanId)">
        查看胜蓝
      </el-button>
    </div>
    <template v-else>
      <div class="profit-kpis">
        <article>
          <span>{{ month }}月材料费</span>
          <strong>{{ money(profit.monthTotal?.materialCost) }}</strong>
          <small v-if="profit.monthTotal?.copperPrice != null">
            铜均价 {{ copperPrice(profit.monthTotal.copperPrice) }} 元/kg{{
              profit.monthTotal.copperPriceProvisional ? "（暂估）" : ""
            }}
          </small>
          <small v-else>{{ profit.throughDate ? "铜均价待补" : "未来月份不计算" }}</small>
          <small class="copper-meta">净重 ×（铜均价 + 5）+（毛重 − 净重）× 6</small>
          <small class="copper-meta">
            <span v-if="profit.monthTotal?.copperPriceThroughDate">截至 {{ profit.monthTotal.copperPriceThroughDate }}</span>
            <a
              v-if="profit.monthTotal?.copperPriceSource"
              :href="profit.monthTotal.copperPriceSource"
              target="_blank"
              rel="noopener noreferrer"
              >CCMN 来源</a
            >
          </small>
        </article>
        <article>
          <span>{{ month }}月外发费用</span>
          <strong>{{ money(profit.monthTotal?.outCost) }}</strong>
          <small>使用与材料费相同的统计数量</small>
        </article>
        <article class="profit-highlight">
          <span>{{ month }}月毛利</span>
          <strong :class="profitClass(profit.monthTotal)">{{ money(completeValue(profit.monthTotal, "grossProfit")) }}</strong>
          <small>已扣固定费用 {{ money(profit.monthTotal?.fixedCost) }} 元</small>
        </article>
        <article>
          <span>{{ month }}月毛利率</span>
          <strong :class="profitClass(profit.monthTotal)">{{ percent(completeValue(profit.monthTotal, "margin")) }}</strong>
          <small>{{ profit.throughDate ? `截至 ${profit.throughDate}` : "未来月份暂不计算" }}</small>
        </article>
      </div>
      <el-alert
        v-if="profit.monthTotal && !profit.monthTotal.complete && profit.throughDate"
        type="warning"
        show-icon
        :closable="false"
        title="本月数据待补齐，毛利和毛利率暂不计算；缺失成本不按零处理。"
      />
      <div class="profit-table-heading">
        <h4>月度毛利统计</h4>
        <span>年度毛利率＝累计毛利 ÷ 累计营业额</span>
      </div>
      <el-table :data="tableRows" class="profit-table" :row-class-name="rowClassName" row-key="label" empty-text="暂无月度数据">
        <el-table-column label="月份" prop="label" width="106" fixed />
        <el-table-column label="营业额" min-width="132" align="right">
          <template #default="{ row }">{{ amount(row, "revenue") }}</template>
        </el-table-column>
        <el-table-column label="铜均价（元/kg）" min-width="160" align="right">
          <template #default="{ row }">
            <span>{{ row.future || row.total ? "—" : copperPrice(row.copperPrice) }}</span>
            <template v-if="!row.future && !row.total">
              <small v-if="row.missingCopperPrice" class="missing-summary">铜均价待补</small>
              <small v-if="row.copperPriceProvisional && row.copperPriceThroughDate" class="copper-meta">
                暂估 · 截至 {{ row.copperPriceThroughDate }}
              </small>
              <small v-if="row.copperPriceSource" class="copper-meta">
                <a :href="row.copperPriceSource" target="_blank" rel="noopener noreferrer">来源</a>
              </small>
            </template>
          </template>
        </el-table-column>
        <el-table-column v-for="column in amountColumns" :key="column.key" :label="column.label" min-width="132" align="right">
          <template #default="{ row }">
            <span :class="column.key === 'grossProfit' ? profitClass(row) : ''">{{ amount(row, column.key) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" min-width="100" align="right">
          <template #default="{ row }">
            <span :class="profitClass(row)">{{ row.future ? "—" : percent(completeValue(row, "margin")) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据状态" min-width="210">
          <template #default="{ row }">
            <span v-if="row.future" class="muted">尚未开始</span>
            <template v-else>
              <el-tag :type="row.complete ? 'success' : 'warning'" effect="plain" size="small">
                {{ row.complete ? "估算完整" : "待补数据" }}
              </el-tag>
              <span v-if="!row.complete" class="missing-summary">{{ missingSummary(row) }}</span>
              <details v-if="row.issues.length" class="profit-issues">
                <summary>查看 {{ row.issues.length }} 项说明</summary>
                <ul>
                  <li v-for="(issue, index) in row.issues" :key="index">{{ issue }}</li>
                </ul>
              </details>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <details class="profit-rules">
        <summary>计算口径</summary>
        <ul>
          <li>
            铜均价采用 CCMN 长江现货 1# 铜含税月均价，材料计算另加 5 元/kg
            加工费；历史月份分别使用各月铜价，当前月为截至所示日期的暂估月均价，由后端提供。
          </li>
          <li>按当前产品重量和现有外发报价估算，历史结果会随资料或报价更新。</li>
          <li>营业额含原有扣款与调整；成本不另计扣款。毛利＝营业额－材料费－外发费用－固定费用。</li>
          <li>
            材料费和外发费用均按当月实际出货减退货的净出货数量计算，按出库/退货单日期归月；金额扣款调整不改变数量。重量统一为千克，单件材料费＝理论净重
            ×（当月铜均价 + 5）+（单件毛重－理论净重）× 6，再乘净出货数量。
          </li>
          <li>
            外发未注明单位的报价按元/件；元/千克报价使用理论净重。外发单数量仅用于选择供应商：同产品同工序取当月外发量最多的供应商，并列时取均价；当月无外发则取截至该月最近有外发的月份。
          </li>
          <li>
            外发工序取报价表中的全部不同工序。无历史外发、工序或日期等异常导致无法可靠选择供应商，或所选供应商无有效报价时，取该产品该工序现有有效报价，统一为元/件后平均；使用均价的原因可在数据状态说明中查看。
          </li>
          <li>固定费用暂按 0 元计入，所有已发生月份均为 0，未来月份不计算。</li>
          <li>成本或价格缺失时不展示完整毛利；年度毛利率按累计金额计算，不平均各月毛利率。</li>
        </ul>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OrderProfit, ProfitTotal } from "@/api/modules/orderRevenue";

const props = defineProps<{ profit: OrderProfit; year: number; month: number; shenglanId?: number }>();
const emit = defineEmits<{ "select-customer": [id: number] }>();
type TableRow = ProfitTotal & { label: string; month?: number; future: boolean; total?: boolean };
type AmountKey = "revenue" | "materialCost" | "outCost" | "fixedCost" | "grossProfit";
const amountColumns: { key: AmountKey; label: string }[] = [
  { key: "materialCost", label: "材料费" },
  { key: "outCost", label: "外发费用" },
  { key: "fixedCost", label: "固定费用" },
  { key: "grossProfit", label: "毛利" },
];
const tableRows = computed<TableRow[]>(() => {
  const rows: TableRow[] = props.profit.months.map((row) => ({ ...row, label: `${row.month}月` }));
  if (props.profit.yearTotal) {
    rows.push({ ...props.profit.yearTotal, label: "年度累计", future: false, total: true });
  }
  return rows;
});
const formatter = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value: number | null | undefined) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : formatter.format(Number(value));
const copperPrice = (value: number | null | undefined) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(3);
const percent = (value: number | null | undefined) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : `${(Number(value) * 100).toFixed(2)}%`;
const completeValue = (total: ProfitTotal | null, key: "grossProfit" | "margin") => (total?.complete ? total[key] : null);
const profitClass = (total: ProfitTotal | null) =>
  total?.complete && total.grossProfit != null ? (total.grossProfit < 0 ? "negative" : "positive") : "";
const amount = (row: TableRow, key: AmountKey) => money(row.future || (key === "grossProfit" && !row.complete) ? null : row[key]);
const rowClassName = ({ row }: { row: TableRow }) => (row.total ? "total-row" : row.month === props.month ? "selected-row" : "");
const missingSummary = (row: ProfitTotal) =>
  [
    row.missingCopperPrice ? "缺铜均价" : "",
    row.missingWeightCount ? `缺重量 ${row.missingWeightCount} 项` : "",
    row.missingOutCount ? `外发待核 ${row.missingOutCount} 项` : "",
    row.missingPriceCount ? `缺单价 ${row.missingPriceCount} 项` : "",
  ]
    .filter(Boolean)
    .join(" · ");
</script>

<style scoped lang="scss">
.profit-panel {
  min-width: 0;
  padding: 22px;
  background: var(--home-surface);
  border: 1px solid var(--home-line);
  border-radius: 10px;
}
header,
.profit-table-heading,
.profit-placeholder {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
h3,
h4,
p {
  margin: 0;
}
h3 {
  font-size: 18px;
  font-weight: 600;
}
h4 {
  font-size: 15px;
  font-weight: 600;
}
header p {
  margin-top: 7px;
}
p,
small,
.muted,
.profit-table-heading span {
  color: var(--home-muted);
  font-size: 12px;
  line-height: 1.7;
}
.profit-placeholder {
  margin-top: 18px;
}
.profit-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}
.profit-kpis article {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--home-line);
  border-radius: 8px;
}
.profit-kpis span {
  font-size: 13px;
  color: var(--home-muted);
}
.profit-kpis strong {
  display: block;
  margin: 12px 0 8px;
  font-size: clamp(20px, 1.8vw, 27px);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.profit-kpis .profit-highlight {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}
.positive {
  color: var(--el-color-success-dark-2);
}
.negative {
  color: var(--el-color-danger);
}
.profit-table-heading {
  margin: 24px 0 12px;
}
.profit-table {
  --el-table-header-bg-color: var(--home-soft);
  font-variant-numeric: tabular-nums;
}
.copper-meta {
  display: block;
  margin-top: 3px;
}
.copper-meta a {
  color: var(--el-color-primary);
  text-decoration: none;
}
.copper-meta span + a {
  margin-left: 8px;
}
.copper-meta a:hover {
  text-decoration: underline;
}
.profit-table :deep(.selected-row) {
  --el-table-tr-bg-color: var(--el-color-primary-light-9);
}
.profit-table :deep(.total-row) {
  --el-table-tr-bg-color: var(--home-soft);
  font-weight: 600;
}
.missing-summary {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
}
.profit-issues,
.profit-rules {
  font-size: 12px;
  line-height: 1.7;
}
.profit-issues {
  margin-top: 5px;
  font-weight: 400;
}
.profit-rules {
  margin-top: 16px;
  color: var(--home-muted);
}
summary {
  cursor: pointer;
  width: fit-content;
}
summary:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 3px;
}
ul {
  padding-left: 18px;
  margin: 6px 0 0;
}
@media (max-width: 1100px) {
  .profit-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .profit-panel {
    padding: 17px;
  }
  .profit-kpis {
    gap: 10px;
  }
  .profit-kpis article {
    padding: 12px;
  }
  .profit-kpis strong {
    font-size: 20px;
  }
}
</style>
