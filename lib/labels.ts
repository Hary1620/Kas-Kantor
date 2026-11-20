import type { PeriodStatus } from "@/lib/types";

export const periodStatusLabel: Record<PeriodStatus, string> = {
  draft: "Draft",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const periodStatusClass: Record<PeriodStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-brand-soft text-brand-deep",
  completed: "bg-green-50 text-income",
  cancelled: "bg-red-50 text-expense",
};