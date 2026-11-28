import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MethodOption } from "@/components/payments/payments-table";
import {
  TransactionsTable,
  type CategoryOption,
  type TransactionRow,
} from "@/components/transactions/transactions-table";
import { formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { fieldClass } from "@/lib/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIMIT = 500;

// Relasi satu-ke-satu kadang dikembalikan sebagai objek, kadang sebagai larik
const first = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? (x[0] ?? null) : (x ?? null));

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; category?: string; from?: string; to?: string }>;
}) {
  const { q = "", type = "all", category = "all", from = "", to = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(
      "id, type, category_id, amount, transaction_date, description, payment_method_id, notes, status, payment_id, payments(member_dues(members(full_name)))"
    )
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (q) query = query.ilike("description", `%${q.replace(/[%_]/g, "")}%`);
  if (type === "income" || type === "expense") query = query.eq("type", type);
  if (UUID.test(category)) query = query.eq("category_id", category);
  if (DATE.test(from)) query = query.gte("transaction_date", from);
  if (DATE.test(to)) query = query.lte("transaction_date", to);

  const [transactions, categories, methods] = await Promise.all([
    query,
    supabase.from("categories").select("id, name, type, is_active").order("name"),
    supabase.from("payment_methods").select("id, name, provider, is_active").order("name"),
  ]);
  for (const r of [transactions, categories, methods]) {
    if (r.error) throw new Error(r.error.message);
  }

  const categoryName = new Map<string, string>((categories.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

  const rows: TransactionRow[] = (transactions.data ?? []).map(
    (t: {
      id: string;
      type: "income" | "expense";
      category_id: string | null;
      amount: number;
      transaction_date: string;
      description: string;
      payment_method_id: string | null;
      notes: string | null;
      status: "valid" | "void";
      payment_id: string | null;
      payments: unknown;
    }) => {
      const payment = first(t.payments as { member_dues: unknown } | null);
      const due = first(payment?.member_dues as { members: unknown } | null);
      const member = first(due?.members as { full_name: string } | null);
      return {
        id: t.id,
        type: t.type,
        category_id: t.category_id,
        category_name: t.category_id ? (categoryName.get(t.category_id) ?? "-") : "-",
        amount: Number(t.amount),
        transaction_date: t.transaction_date,
        description: t.description,
        payment_method_id: t.payment_method_id,
        notes: t.notes,
        status: t.status,
        from_payment: t.payment_id !== null,
        member_name: member?.full_name ?? null,
      };
    }
  );

  const valid = rows.filter((r) => r.status === "valid");
  const income = valid.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = valid.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  const categoryOptions: CategoryOption[] = categories.data ?? [];
  const methodOptions: MethodOption[] = (methods.data ?? []).map(
    (m: { id: string; name: string; provider: string | null; is_active: boolean }) => ({
      id: m.id,
      label: m.provider ? `${m.name} (${m.provider})` : m.name,
      is_active: m.is_active,
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transaksi</h1>
        <p className="text-sm text-muted-foreground">
          Catat pemasukan dan pengeluaran di luar iuran. Transaksi dari pembayaran dikelola lewat menu Pembayaran.
        </p>
      </div>

      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <Input name="q" defaultValue={q} placeholder="Cari deskripsi..." className="bg-white lg:col-span-2" />
        <select name="type" defaultValue={type} className={fieldClass}>
          <option value="all">Semua jenis</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <select name="category" defaultValue={category} className={fieldClass}>
          <option value="all">Semua kategori</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input name="from" type="date" defaultValue={from} aria-label="Dari tanggal" className="bg-white" />
        <Input name="to" type="date" defaultValue={to} aria-label="Sampai tanggal" className="bg-white" />
        <Button type="submit" variant="outline" className="sm:col-span-2 lg:col-span-6 lg:w-fit">
          Terapkan filter
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Pemasukan</p>
            <p className="text-xl font-semibold text-income">{formatRupiah(income)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Pengeluaran</p>
            <p className="text-xl font-semibold text-expense">{formatRupiah(expense)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Selisih</p>
            <p className="text-xl font-semibold">{formatRupiah(income - expense)}</p>
          </CardContent>
        </Card>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Total mengikuti filter di atas dan tidak menghitung transaksi yang dibatalkan.
        {rows.length >= LIMIT && ` Hanya ${LIMIT} transaksi terbaru yang dimuat; persempit filter untuk angka yang lengkap.`}
      </p>

      <TransactionsTable rows={rows} categories={categoryOptions} methods={methodOptions} />
    </div>
  );
}