"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordPayment, replacePayment, voidPayment } from "@/app/admin/pembayaran/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatRupiah, todayJakarta } from "@/lib/format";
import { fieldClass } from "@/lib/ui";
import { paymentSchema, type PaymentValues } from "@/lib/validations/payment";

export type PaymentRow = {
  id: string;
  member_due_id: string;
  member_name: string;
  period_name: string;
  amount: number;
  paid_at: string;
  status: "valid" | "void";
  notes: string | null;
  payment_method_id: string | null;
  method_name: string | null;
  max_edit_amount: number;
  allow_installments: boolean;
};

export type PayableDue = {
  id: string;
  member_id: string;
  member_name: string;
  period_name: string;
  remaining: number;
  allow_installments: boolean;
};

export type MethodOption = { id: string; label: string; is_active: boolean };


function formatAmountInput(value: string | number) {
  const digits = String(value).replace(/\D/g, "");
  return digits === "" ? "" : new Intl.NumberFormat("id-ID").format(Number(digits));
}

function parseAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? 0 : Number(digits);
}

function PaymentForm({
  dues,
  methods,
  row,
  onDone,
}: {
  dues: PayableDue[];
  methods: MethodOption[];
  row: PaymentRow | null;
  onDone: () => void;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      member_due_id: row?.member_due_id ?? "",
      amount: row?.amount ?? 0,
      paid_at: row?.paid_at ?? "",
      payment_method_id: row?.payment_method_id ?? "",
      notes: row?.notes ?? "",
    },
  });

  // Kunci unik dan tanggal hari ini dibuat di browser, bukan saat render awal
  useEffect(() => {
    setKey(crypto.randomUUID());
    if (!row) setValue("paid_at", todayJakarta());
  }, [row, setValue]);

  const dueId = watch("member_due_id");
  const selected = row ? null : (dues.find((d) => d.id === dueId) ?? null);
  const maxAmount = row ? row.max_edit_amount : (selected?.remaining ?? 0);
  const locked = !row && selected !== null && !selected.allow_installments;

  const memberOptions = Array.from(new Map(dues.map((d) => [d.member_id, d.member_name])).entries()).sort((a, b) =>
    a[1].localeCompare(b[1])
  );
  const memberDues = dues.filter((d) => d.member_id === memberId);
  const methodChoices = methods.filter((m) => m.is_active || m.id === row?.payment_method_id);

  function pickDue(d: PayableDue | undefined) {
    setValue("member_due_id", d?.id ?? "", { shouldValidate: true });
    setValue("amount", d?.remaining ?? 0);
  }

  function onSubmit(values: PaymentValues) {
    setError(null);
    if (!key) return;
    if (values.amount > maxAmount) {
      setError(`Nominal melebihi sisa kewajiban (${formatRupiah(maxAmount)}).`);
      return;
    }
    startTransition(async () => {
      const res = row ? await replacePayment(row.id, values, key) : await recordPayment(values, key);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  if (!row && dues.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tidak ada kewajiban yang belum lunas. Daftarkan anggota ke sebuah periode terlebih dahulu.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onDone}>
            Tutup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {row ? (
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">{row.member_name}</span> · {row.period_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Perubahan dicatat sebagai pembatalan pembayaran lama dan pembayaran baru, sehingga riwayat tetap utuh. Nominal maksimal{" "}
            {formatRupiah(row.max_edit_amount)}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="member">Anggota</Label>
            <select
              id="member"
              className={`${fieldClass} w-full`}
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                const options = dues.filter((d) => d.member_id === e.target.value);
                pickDue(options.length === 1 ? options[0] : undefined);
              }}
            >
              <option value="">Pilih anggota</option>
              {memberOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Periode</Label>
            <select
              id="due"
              className={`${fieldClass} w-full`}
              value={dueId}
              disabled={memberId === ""}
              onChange={(e) => pickDue(dues.find((d) => d.id === e.target.value))}
            >
              <option value="">Pilih periode</option>
              {memberDues.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.period_name} (sisa {formatRupiah(d.remaining)})
                </option>
              ))}
            </select>
          </div>
          {errors.member_due_id && <p className="col-span-2 text-xs text-expense">{errors.member_due_id.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
         <Label htmlFor="amount">Nominal (Rp)</Label>

<Controller
  control={control}
  name="amount"
  render={({ field }) => (
    <Input
      id="amount"
      type="text"
      inputMode="numeric"
      placeholder="Contoh: 50.000"
      readOnly={locked}
      value={formatAmountInput(field.value ?? "")}
      onChange={(e) => {
        field.onChange(parseAmountInput(e.target.value));
      }}
    />
  )}
/>

{locked && (
  <p className="text-xs text-muted-foreground">
    Periode ini tanpa cicilan: harus dibayar penuh.
  </p>
)}

{errors.amount && (
  <p className="text-xs text-expense">{errors.amount.message}</p>
)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="paid_at">Tanggal pembayaran</Label>
          <Input id="paid_at" type="date" {...register("paid_at")} />
          {errors.paid_at && <p className="text-xs text-expense">{errors.paid_at.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Metode pembayaran</Label>
        <select id="method" className={`${fieldClass} w-full`} {...register("payment_method_id")}>
          <option value="">Tidak dicatat</option>
          {methodChoices.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <textarea id="notes" rows={2} className={`${fieldClass} w-full`} {...register("notes")} />
        {errors.notes && <p className="text-xs text-expense">{errors.notes.message}</p>}
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={pending || !key}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

export function PaymentsTable({
  payments,
  dues,
  methods,
}: {
  payments: PaymentRow[];
  dues: PayableDue[];
  methods: MethodOption[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancelPayment(p: PaymentRow) {
    const message = `Batalkan pembayaran ${formatRupiah(p.amount)} dari ${p.member_name}? Transaksi pemasukan terkait ikut dibatalkan dan saldo berkurang.`;
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const res = await voidPayment(p.id);
      setError(res.error ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{payments.length} pembayaran</p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Catat Pembayaran
        </Button>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Anggota</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Belum ada pembayaran.
                </TableCell>
              </TableRow>
            )}
            {payments.map((p) => (
              <TableRow key={p.id} className={p.status === "void" ? "text-muted-foreground line-through" : ""}>
                <TableCell className="whitespace-nowrap">{formatDate(p.paid_at)}</TableCell>
                <TableCell className="font-medium">{p.member_name}</TableCell>
                <TableCell>{p.period_name}</TableCell>
                <TableCell className="whitespace-nowrap">{formatRupiah(p.amount)}</TableCell>
                <TableCell>{p.method_name ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.status === "valid" ? "bg-green-50 text-income" : "bg-slate-100 text-slate-600"}>
                    {p.status === "valid" ? "Berhasil" : "Dibatalkan"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap text-right">
                  {p.status === "valid" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                        Ubah
                      </Button>
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => cancelPayment(p)}>
                        Batalkan
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
          </DialogHeader>
          <PaymentForm dues={dues} methods={methods} row={null} onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Pembayaran</DialogTitle>
          </DialogHeader>
          {editing && <PaymentForm key={editing.id} dues={dues} methods={methods} row={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}