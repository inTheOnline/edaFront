import http from "@/api";

export interface RevenueTotal {
  net: number | null;
  shipped: number | null;
  returned: number | null;
  adjustment: number | null;
  lineCount: number;
  missingPriceCount: number;
  missingPriceQuantity: number;
}
export interface RevenueBucket extends RevenueTotal {
  id: number | null;
  name: string;
  code?: string;
  month?: number;
  year?: number;
  share: number | null;
  change: number | null;
}
export interface ProfitTotal {
  revenue: number | null;
  quantity: number;
  materialCost: number | null;
  /** CCMN 含税月均价（元/kg），不含材料计算时另加的 5 元/kg 加工费。 */
  copperPrice: number | null;
  copperPriceThroughDate: string | null;
  copperPriceSource: string | null;
  copperPriceProvisional: boolean;
  missingCopperPrice: boolean;
  outCost: number | null;
  fixedCost: number | null;
  grossProfit: number | null;
  margin: number | null;
  complete: boolean;
  missingWeightCount: number;
  missingOutCount: number;
  missingPriceCount: number;
  issues: string[];
}
export interface ProfitMonth extends ProfitTotal {
  year: number;
  month: number;
  future: boolean;
}
export interface OrderProfit {
  supported: boolean;
  custId: number | null;
  custName: string | null;
  reason: string | null;
  throughDate: string | null;
  monthTotal: ProfitTotal | null;
  yearTotal: ProfitTotal | null;
  months: ProfitMonth[];
}
export interface OrderRevenue {
  year: number;
  month: number;
  custId: number | null;
  throughDate: string | null;
  future: boolean;
  monthTotal: RevenueTotal;
  yearTotal: RevenueTotal;
  previousMonth: RevenueTotal;
  previousYear: RevenueTotal;
  pending: RevenueTotal;
  momRate: number | null;
  yoyRate: number | null;
  top3Share: number | null;
  customerSharesAvailable: boolean;
  trend: RevenueBucket[];
  customers: RevenueBucket[];
  products: RevenueBucket[];
  profit: OrderProfit;
}
export const getOrderRevenue = (params: { year: number; month: number; custId?: number }) =>
  http.get<OrderRevenue>("/order/revenue", params);
