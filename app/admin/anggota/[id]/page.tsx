import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DueStatusBadge } from "@/components/dues/due-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatRupiah } from "@/lib/format";
import type { DueStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

type Dues = { period_id: string; amount_due: number; total_paid: number; remaining: number; status: DueStatus };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase.from("members").select("*").eq("id", id).single();
  if (!member) notFound();

  const [dues, periods, payments] = await Promise.all([
    supabase.from("member_dues_summary").select("*").eq("member_id", id),
    supabase.from("dues_periods").select("id, name, start_date"),
    supabase
      .from("payments")
      .select("id, amount, paid_at, status, notes, member_dues!inner(member_id, period_id)")
      .eq("member_dues.member_id", id)
      .order("paid_at", { ascending: false }),
  ]);
  if (dues.error) throw new Error(dues.error.message);
  if (periods.error) throw new Error(periods.error.message);
  if (payments.error) throw new Error(payments.error.message);

  const periodById = new Map<string, { name: string; start_date: string }>(
    (periods.data ?? []).map((p: { id: string; name: string; start_date: string }) => [p.id, p])
  );
  const periodName = (pid: string) => periodById.get(pid)?.name ?? "-";

  const rows: Dues[] = (dues.data ?? []).sort((a: Dues, b: Dues) =>
    (periodById.get(b.period_id)?.start_date ?? "").localeCompare(periodById.get(a.period_id)?.start_date ?? "")
  );
  const counted = rows.filter((r) => r.status !== "cancelled");
  const totalDue = counted.reduce((s, r) => s + Number(r.amount_due), 0);
  const totalPaid = counted.reduce((s, r) => s + Number(r.total_paid), 0);
  const totalRemaining = counted.reduce((s, r) => s + Number(r.remaining), 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/anggota" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        Kembali ke daftar anggota
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{member.full_name}</h1>
        <Badge variant="outline" className={member.is_active ? "bg-green-50 text-income" : "bg-slate-100 text-slate-600"}>
          {member.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {member.phone ?? "Tanpa nomor kontak"} · Bergabung {formatDate(member.joined_at)}
        {member.notes ? ` · ${member.notes}` : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Total kewajiban</p>
            <p className="text-xl font-semibold">{formatRupiah(totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Total dibayar</p>
            <p className="text-xl font-semibold text-income">{formatRupiah(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Sisa</p>
            <p className="text-xl font-semibold">{formatRupiah(totalRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Kewajiban per Periode</h2>
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Kewajiban</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Belum terdaftar di periode mana pun.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.period_id}>
                  <TableCell className="font-medium">{periodName(r.period_id)}</TableCell>
                  <TableCell>{formatRupiah(Number(r.amount_due))}</TableCell>
                  <TableCell className="text-income">{formatRupiah(Number(r.total_paid))}</TableCell>
                  <TableCell>{formatRupiah(Number(r.remaining))}</TableCell>
                  <TableCell>
                    <DueStatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Riwayat Pembayaran</h2>
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Belum ada pembayaran.
                  </TableCell>
                </TableRow>
              )}
             {(payments.data ?? []).map((p) => (
  <TableRow
    key={p.id}
    className={p.status === "void" ? "text-muted-foreground line-through" : ""}
  >
    <TableCell>{formatDate(p.paid_at)}</TableCell>
    <TableCell>{periodName(p.member_dues?.[0]?.period_id ?? "")}</TableCell>
    <TableCell>{formatRupiah(Number(p.amount))}</TableCell>
    <TableCell>{p.status === "void" ? "Dibatalkan" : "Berhasil"}</TableCell>
    <TableCell>{p.notes ?? "-"}</TableCell>
  </TableRow>
))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}