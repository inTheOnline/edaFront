export const salaryNormFields = [
  { prop: "basicNorm", label: "工资基数" },
  { prop: "overNorm", label: "加班基数" },
  { prop: "nightNorm", label: "夜班补贴基数" },
  { prop: "otherNorm", label: "其他补贴" },
  { prop: "postNorm", label: "岗位补贴" },
  { prop: "bonus", label: "奖金" },
  { prop: "eatCutpay", label: "餐住扣款" },
  { prop: "fixedDeduction", label: "固定扣款" },
  { prop: "social", label: "社保扣款" }
] as const;

export const salaryNormFieldLabels: Record<string, string> = Object.fromEntries(
  salaryNormFields.map(item => [item.prop, item.label])
);

salaryNormFieldLabels.remark = "备注";
