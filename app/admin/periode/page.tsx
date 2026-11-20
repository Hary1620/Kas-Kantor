import { PeriodsTable, type PeriodRow } from "@/components/periods/periods-table";
import { createClient } from "@/lib/supabase/server";

export default async function PeriodsPage() {
  const supabase = await createClient();
  const [periods, summary] = await Promise.all([
    supabase.from("dues_periods").select("*").order("start_date", { ascending: false }),
    supabase.from("member_dues_summary").select("period_id, amount_due, total_paid, status"),
  ]);
  if (periods.error) throw new Error(periods.error.message);
  if (summary.error) throw new Error(summary.error.message);

  const totals = new Map<string, { target: number; collected: number; count: number }>();
  for (const r of summary.data ?? []) {
    if (r.status === "cancelled") continue;
    const t = totals.get(r.period_id) ?? { target: 0, collected: 0, count: 0 };
    t.target += Number(r.amount_due);
    t.collected += Number(r.total_paid);
    t.count += 1;
    totals.set(r.period_id, t);
  }

  const rows: PeriodRow[] = (periods.data ?? []).map((p) => ({
    ...p,
    default_amount: Number(p.default_amount),
    ...(totals.get(p.id) ?? { target: 0, collected: 0, count: 0 }),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Periode Iuran</h1>
        <p className="text-sm text-muted-foreground">
          Nominal dan tanggal bebas diatur per periode. Mengubah nominal tidak memengaruhi kewajiban yang sudah dibuat.
        </p>
      </div>
      <PeriodsTable periods={rows} />
    </div>
  );
}