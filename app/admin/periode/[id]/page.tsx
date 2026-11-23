import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PeriodDues, type DueRow } from "@/components/periods/period-dues";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatRupiah } from "@/lib/format";
import { periodStatusClass, periodStatusLabel, type DueStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export default async function PeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: period } = await supabase.from("dues_periods").select("*").eq("id", id).single();
  if (!period) notFound();

  const [dues, members] = await Promise.all([
    supabase.from("member_dues_summary").select("*").eq("period_id", id),
    supabase.from("members").select("id, full_name, is_active").order("full_name"),
  ]);
  if (dues.error) throw new Error(dues.error.message);
  if (members.error) throw new Error(members.error.message);

  const nameById = new Map<string, string>(
    (members.data ?? []).map((m: { id: string; full_name: string }) => [m.id, m.full_name])
  );

  const rows: DueRow[] = (dues.data ?? [])
    .map((d: Record<string, string | number>) => ({
      id: String(d.member_due_id),
      member_id: String(d.member_id),
      name: nameById.get(String(d.member_id)) ?? "-",
      amount_due: Number(d.amount_due),
      total_paid: Number(d.total_paid),
      remaining: Number(d.remaining),
      status: d.status as DueStatus,
    }))
    .sort((a: DueRow, b: DueRow) => a.name.localeCompare(b.name));

  const assigned = new Set(rows.map((r) => r.member_id));
  const candidates = (members.data ?? [])
    .filter((m: { id: string; is_active: boolean }) => m.is_active && !assigned.has(m.id))
    .map((m: { id: string; full_name: string }) => ({ id: m.id, name: m.full_name }));

  const counted = rows.filter((r) => r.status !== "cancelled");
  const target = counted.reduce((s, r) => s + r.amount_due, 0);
  const collected = counted.reduce((s, r) => s + r.total_paid, 0);
  const canAssign = period.status === "draft" || period.status === "active";

  return (
    <div className="space-y-6">
      <Link href="/admin/periode" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        Kembali ke daftar periode
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{period.name}</h1>
        <Badge variant="outline" className={periodStatusClass[period.status as keyof typeof periodStatusClass]}>
          {periodStatusLabel[period.status as keyof typeof periodStatusLabel]}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {formatDate(period.start_date)} – {formatDate(period.end_date)} · Batas bayar {formatDate(period.due_date)} ·{" "}
        {period.allow_installments ? "Boleh cicilan" : "Tanpa cicilan"} · Nominal bawaan {formatRupiah(Number(period.default_amount))}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Anggota wajib bayar</p>
            <p className="text-xl font-semibold">{counted.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Total kewajiban</p>
            <p className="text-xl font-semibold">{formatRupiah(target)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Terkumpul</p>
            <p className="text-xl font-semibold text-income">{formatRupiah(collected)}</p>
          </CardContent>
        </Card>
      </div>

      <PeriodDues
        periodId={id}
        defaultAmount={Number(period.default_amount)}
        canAssign={canAssign}
        rows={rows}
        candidates={candidates}
      />
    </div>
  );
}