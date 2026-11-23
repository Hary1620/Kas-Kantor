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

export type DueStatus = "unpaid" | "partial" | "late" | "paid" | "cancelled";

export const dueStatusLabel: Record<DueStatus, string> = {
  unpaid: "Belum Bayar",
  partial: "Belum Lunas",
  late: "Terlambat",
  paid: "Lunas",
  cancelled: "Dibatalkan",
};

export const dueStatusClass: Record<DueStatus, string> = {
  unpaid: "bg-slate-100 text-slate-600",
  partial: "bg-amber-50 text-amber-700",
  late: "bg-red-50 text-expense",
  paid: "bg-green-50 text-income",
  cancelled: "bg-slate-100 text-slate-400 line-through",
};