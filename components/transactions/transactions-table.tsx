"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteTransaction, saveTransaction } from "@/app/admin/transaksi/actions";
import type { MethodOption } from "@/components/payments/payments-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatRupiah, todayJakarta } from "@/lib/format";
import { fieldClass } from "@/lib/ui";
import { transactionSchema, type TransactionValues } from "@/lib/validations/transaction";

export type TransactionRow = {
  id: string;
  type: "income" | "expense";
  category_id: string | null;
  category_name: string;
  amount: number;
  transaction_date: string;
  description: string;
  payment_method_id: string | null;
  notes: string | null;
  status: "valid" | "void";
  from_payment: boolean;
  member_name: string | null;
};

export type CategoryOption = { id: string; name: string; type: "income" | "expense"; is_active: boolean };

function formatAmountInput(value: string | number) {
  const digits = String(value).replace(/\D/g, "");
  return digits === "" ? "" : new Intl.NumberFormat("id-ID").format(Number(digits));
}

function parseAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? 0 : Number(digits);
}

function TransactionForm({
  row,
  categories,
  methods,
  onDone,
}: {
  row: TransactionRow | null;
  categories: CategoryOption[];
  methods: MethodOption[];
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: row?.type ?? "expense",
      category_id: row?.category_id ?? "",
      amount: row?.amount ?? 0,
      transaction_date: row?.transaction_date ?? "",
      description: row?.description ?? "",
      payment_method_id: row?.payment_method_id ?? "",
      notes: row?.notes ?? "",
    },
  });

  useEffect(() => {
    if (!row) setValue("transaction_date", todayJakarta());
  }, [row, setValue]);

  const type = watch("type");
  const categoryChoices = categories.filter(
    (c) => c.type === type && c.name !== "Iuran Anggota" && (c.is_active || c.id === row?.category_id)
  );
  const methodChoices = methods.filter((m) => m.is_active || m.id === row?.payment_method_id);

  function onSubmit(values: TransactionValues) {
    setError(null);
    startTransition(async () => {
      const res = await saveTransaction(values, row?.id);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Jenis</Label>
          <select
            id="type"
            className={`${fieldClass} w-full`}
            {...register("type", { onChange: () => setValue("category_id", "") })}
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category_id">Kategori</Label>
          <select id="category_id" className={`${fieldClass} w-full`} {...register("category_id")}>
            <option value="">Pilih kategori</option>
            {categoryChoices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-expense">{errors.category_id.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Input id="description" {...register("description")} />
        {errors.description && <p className="text-xs text-expense">{errors.description.message}</p>}
      </div>

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
        value={formatAmountInput(field.value ?? "")}
        onChange={(e) => {
          field.onChange(parseAmountInput(e.target.value));
        }}
      />
    )}
  />
  {errors.amount && <p className="text-xs text-expense">{errors.amount.message}</p>}
</div>
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Tanggal</Label>
          <Input id="transaction_date" type="date" {...register("transaction_date")} />
          {errors.transaction_date && <p className="text-xs text-expense">{errors.transaction_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method_id">Metode pembayaran (opsional)</Label>
        <select id="payment_method_id" className={`${fieldClass} w-full`} {...register("payment_method_id")}>
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
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

export function TransactionsTable({
  rows,
  categories,
  methods,
}: {
  rows: TransactionRow[];
  categories: CategoryOption[];
  methods: MethodOption[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove(r: TransactionRow) {
    const message = `Hapus transaksi "${r.description}" (${formatRupiah(r.amount)})? Saldo akan dihitung ulang. Penghapusan tercatat di log audit.`;
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const res = await deleteTransaction(r.id);
      setError(res.error ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} transaksi</p>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Tambah Transaksi
        </Button>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Tidak ada transaksi.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} className={r.status === "void" ? "text-muted-foreground line-through" : ""}>
                <TableCell className="whitespace-nowrap">{formatDate(r.transaction_date)}</TableCell>
                <TableCell>
                  <p className="font-medium">{r.description}</p>
                  {r.member_name && <p className="text-xs text-muted-foreground">{r.member_name}</p>}
                </TableCell>
                <TableCell>{r.category_name}</TableCell>
                <TableCell className={`whitespace-nowrap font-semibold ${r.type === "income" ? "text-income" : "text-expense"}`}>
                  {r.type === "income" ? "+" : "-"}
                  {formatRupiah(r.amount)}
                </TableCell>
                <TableCell>
                  {r.from_payment ? (
                    <Badge variant="outline" className="bg-brand-soft text-brand-deep">
                      Pembayaran
                    </Badge>
                  ) : (
                    <Badge variant="outline">Manual</Badge>
                  )}
                  {r.status === "void" && <span className="ml-2 text-xs">Dibatalkan</span>}
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap text-right">
                  {!r.from_payment && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                      >
                        Ubah
                      </Button>
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove(r)}>
                        Hapus
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Transaksi" : "Tambah Transaksi"}</DialogTitle>
          </DialogHeader>
          <TransactionForm row={editing} categories={categories} methods={methods} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}