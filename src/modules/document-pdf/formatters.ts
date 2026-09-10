import dayjs from "dayjs";
import type { FieldConfig, PdfRecord, PdfValue, ValueFormat } from "./types";

export const getByPath = (source: PdfRecord | undefined, path: string): unknown => {
  if (!source || !path) return undefined;
  return path.split(".").reduce<unknown>((value, key) => {
    if (value === null || value === undefined || typeof value !== "object") return undefined;
    return (value as PdfRecord)[key];
  }, source);
};

export const formatValue = (value: unknown, format?: ValueFormat): string => {
  if (value === null || value === undefined || value === "") return "";
  if (!format || format.type === "text") return String(value);
  if (format.type === "date") {
    const date = dayjs(value as string | number | Date);
    return date.isValid() ? date.format(format.pattern || "YYYY-MM-DD") : String(value);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  const digits = format.digits ?? 2;
  const text = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: format.type === "number" ? format.useGrouping ?? true : true
  }).format(number);
  return format.type === "amount" && format.currency ? `${format.currency}${text}` : text;
};

export const resolveField = (source: PdfRecord | undefined, field: FieldConfig, globalEmptyText: PdfValue = "-"): string => {
  const formatted = formatValue(getByPath(source, field.field), field.format);
  const value = formatted || String(field.emptyText ?? globalEmptyText ?? "");
  if (field.overflow === "truncate" && field.maxLength && value.length > field.maxLength) {
    return `${value.slice(0, Math.max(0, field.maxLength - 1))}…`;
  }
  return value;
};
