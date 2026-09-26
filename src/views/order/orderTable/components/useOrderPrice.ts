import { computed } from "vue";
import { useAuthStore } from "@/stores/modules/auth";
import { getOrderProductInfo } from "@/api/modules/order";

export interface ProductPriceState {
  materId?: number | string;
  custId?: number | string | null;
  price?: number | null;
  priceLoading?: boolean;
  priceError?: boolean;
}

export async function loadProductPrice(row: ProductPriceState) {
  const id = row.materId;
  row.price = undefined;
  row.custId = undefined;
  row.priceLoading = true;
  row.priceError = false;
  try {
    if (!id) throw new Error("请选择产品");
    const { data } = await getOrderProductInfo(id);
    if (row.materId === id) Object.assign(row, { price: data.price, custId: data.custId });
  } catch {
    if (row.materId === id) row.priceError = true;
  } finally {
    if (row.materId === id) row.priceLoading = false;
  }
}

export const formatPrice = (value?: number | null) => (value == null ? "—" : Number(value).toFixed(4));
export const formatAmount = (value?: number | null) => (value == null ? "—" : Number(value).toFixed(2));
export const sumAmounts = (amounts: Array<number | null | undefined>) =>
  amounts.some((amount) => amount == null) ? "—" : formatAmount(amounts.reduce<number>((sum, amount) => sum + Number(amount), 0));
export const safePriceRemark = (remark?: string, canView = false) =>
  canView
    ? remark || ""
    : (remark || "")
        .split("\n")
        .filter((line) => !line.startsWith("[系统单价核对]"))
        .join("\n");

export function useOrderPrice() {
  const auth = useAuthStore();
  const canViewPrice = computed(() => auth.isExistence("price:view"));
  const canEditPrice = computed(() => canViewPrice.value && auth.isExistence("price:edit"));
  return { canViewPrice, canEditPrice, formatPrice, formatAmount };
}
