export type SalesPeriod = "today" | "week" | "month";

/** Davr boshlanishi (brauzer vaqti bo'yicha): bugun 00:00, 7 kun oldin, 1 oy oldin */
export function salesPeriodStart(period: SalesPeriod): Date {
  const d = new Date();
  if (period === "today") d.setHours(0, 0, 0, 0);
  else if (period === "week") d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d;
}
