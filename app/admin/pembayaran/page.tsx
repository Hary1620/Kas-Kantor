import { PaymentsTable, type MethodOption, type PayableDue, type PaymentRow } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { fieldClass } from "@/lib/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; period?: string; status?: string }>;
}) {
  const { q = "", period = "all", status = "all" } = await searchParams;
  const supabase = await createClient();

  let paymentsQuery = supabase
    .from("payments")
    .select("id, amount, paid_at, status, notes, payment_method_id, member_dues!inner(id, member_id, period_id)")
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (UUID.test(period)) paymentsQuery = paymentsQuery.eq("member_dues.period_id", period);
  if (status === "valid" || status === "void") paymentsQuery = paymentsQuery.eq("status", status);

  const [payments, dues, members, periods, methods] = await Promise.all([
    paymentsQuery,
    supabase.from("member_dues_summary").select("*"),
    supabase.from("members").select("id, full_name"),
    supabase.from("dues_periods").select("id, name, allow_installments, start_date").order("start_date", { ascending: false }),
    supabase.from("payment_methods").select("id, name, provider, is_active").order("name"),
  ]);
  for (const r of [payments, dues, members, periods, methods]) {
    if (r.error) throw new Error(r.error.message);
  }

  const memberName = new Map<string, string>((members.data ?? []).map((m: { id: string; full_name: string }) => [m.id, m.full_name]));
  const periodInfo = new Map<string, { name: string; allow_installments: boolean }>(
    (periods.data ?? []).map((p: { id: string; name: string; allow_installments: boolean }) => [p.id, p])
  );
  const dueInfo = new Map<string, { remaining: number }>(
    (dues.data ?? []).map((d: { member_due_id: string; remaining: number }) => [d.member_due_id, d])
  );
  const methodLabel = (m: { name: string; provider: string | null }) => (m.provider ? `${m.name} (${m.provider})` : m.name);
  const methodById = new Map<string, string>((methods.data ?? []).map((m: { id: string; name: string; provider: string | null }) => [m.id, methodLabel(m)]));

  let rows: PaymentRow[] = (payments.data ?? []).map(
    (p: {
      id: string;
      amount: number;
      paid_at: string;
      status: "valid" | "void";
      notes: string | null;
      payment_method_id: string | null;
    member_dues:
  | { id: string; member_id: string; period_id: string }
  | { id: string; member_id: string; period_id: string }[]
  | null;
    }) => {
   const md = Array.isArray(p.member_dues)
  ? p.member_dues[0]
  : p.member_dues;

if (!md) return null;
      const per = periodInfo.get(md.period_id);
      return {
       id: p.id,
      member_due_id: md.id,
      member_name: memberName.get(md.member_id) ?? "-",
      period_name: per?.name ?? "-",
      amount: Number(p.amount),
      paid_at: p.paid_at,
      status: p.status,
      notes: p.notes,
      payment_method_id: p.payment_method_id,
      method_name: p.payment_method_id ? (methodById.get(p.payment_method_id) ?? null) : null,
      max_edit_amount: Number(dueInfo.get(md.id)?.remaining ?? 0) + Number(p.amount),
      allow_installments: per?.allow_installments ?? false,
      };
    })
      .filter((p): p is PaymentRow => p !== null);
  if (q) rows = rows.filter((r) => r.member_name.toLowerCase().includes(q.toLowerCase()));

  const payable: PayableDue[] = (dues.data ?? [])
    .filter((d: { status: string }) => d.status !== "paid" && d.status !== "cancelled")
    .map((d: { member_due_id: string; member_id: string; period_id: string; remaining: number }) => ({
      id: d.member_due_id,
      member_id: d.member_id,
      member_name: memberName.get(d.member_id) ?? "-",
      period_name: periodInfo.get(d.period_id)?.name ?? "-",
      remaining: Number(d.remaining),
      allow_installments: periodInfo.get(d.period_id)?.allow_installments ?? false,
    }))
    .sort((a: PayableDue, b: PayableDue) => a.member_name.localeCompare(b.member_name) || a.period_name.localeCompare(b.period_name));

  const methodOptions: MethodOption[] = (methods.data ?? []).map(
    (m: { id: string; name: string; provider: string | null; is_active: boolean }) => ({
      id: m.id,
      label: methodLabel(m),
      is_active: m.is_active,
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Catat pembayaran iuran. Setiap pembayaran otomatis menjadi satu transaksi pemasukan.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari nama anggota..." className="max-w-xs bg-white" />
        <select name="period" defaultValue={period} className={fieldClass}>
          <option value="all">Semua periode</option>
          {(periods.data ?? []).map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="all">Semua status</option>
          <option value="valid">Berhasil</option>
          <option value="void">Dibatalkan</option>
        </select>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      <PaymentsTable payments={rows} dues={payable} methods={methodOptions} />
    </div>
  );
}