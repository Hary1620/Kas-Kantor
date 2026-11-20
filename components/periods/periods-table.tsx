"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savePeriod } from "@/app/admin/periode/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatRupiah } from "@/lib/format";
import { periodStatusClass, periodStatusLabel } from "@/lib/labels";
import type { Period } from "@/lib/types";
import { fieldClass } from "@/lib/ui";
import { periodSchema, type PeriodValues } from "@/lib/validations/period";

export type PeriodRow = Period & { target: number; collected: number; count: number };

function PeriodForm({ period, onDone }: { period: Period | null; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
    const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PeriodValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      name: period?.name ?? "",
      start_date: period?.start_date ?? "",
      end_date: period?.end_date ?? "",
      due_date: period?.due_date ?? "",
      default_amount: period?.default_amount ?? 0,
      allow_installments: period?.allow_installments ?? false,
      status: period?.status ?? "draft",
      description: period?.description ?? "",
    },
  });

useEffect(() => {
  if (!period) {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Jakarta",
    }).format(new Date());

    setValue("start_date", today);
    setValue("end_date", today);
    setValue("due_date", today);
  }
}, [period, setValue]);

  function onSubmit(values: PeriodValues) {
    setError(null);
    startTransition(async () => {
      const res = await savePeriod(values, period?.id);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  const fieldError = (msg?: string) => (msg ? <p className="text-xs text-expense">{msg}</p> : null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama periode</Label>
        <Input id="name" placeholder="Contoh: November 2026" {...register("name")} />
        {fieldError(errors.name?.message)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="start_date">Mulai</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
          {fieldError(errors.start_date?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Berakhir</Label>
          <Input id="end_date" type="date" {...register("end_date")} />
          {fieldError(errors.end_date?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Batas bayar</Label>
          <Input id="due_date" type="date" {...register("due_date")} />
          {fieldError(errors.due_date?.message)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="default_amount">Nominal iuran (Rp)</Label>
          <Input id="default_amount" type="number" inputMode="numeric" min={0} step={1} {...register("default_amount", { valueAsNumber: true })} />
          {fieldError(errors.default_amount?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" className={`${fieldClass} w-full`} {...register("status")}>
            {Object.entries(periodStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-[#2563eb]" {...register("allow_installments")} />
        Izinkan pembayaran bertahap (cicilan)
      </label>
      <div className="space-y-2">
        <Label htmlFor="description">Keterangan</Label>
        <textarea id="description" rows={3} className={`${fieldClass} w-full`} {...register("description")} />
        {fieldError(errors.description?.message)}
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

export function PeriodsTable({ periods }: { periods: PeriodRow[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{periods.length} periode</p>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Buat Periode
        </Button>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periode</TableHead>
              <TableHead>Rentang</TableHead>
              <TableHead>Batas bayar</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Terkumpul</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Belum ada periode.
                </TableCell>
              </TableRow>
            )}
            {periods.map((p) => {
              const percent = p.target > 0 ? Math.round((p.collected / p.target) * 100) : 0;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.allow_installments ? "Boleh cicilan" : "Tanpa cicilan"} · {p.count} anggota
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(p.due_date)}</TableCell>
                  <TableCell>{formatRupiah(p.default_amount)}</TableCell>
                  <TableCell className="min-w-40">
                    <p className="text-xs">
                      {formatRupiah(p.collected)} / {formatRupiah(p.target)}
                    </p>
                    <Progress value={percent} className="mt-1" />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={periodStatusClass[p.status]}>
                      {periodStatusLabel[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                    >
                      Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Periode" : "Buat Periode"}</DialogTitle>
          </DialogHeader>
          <PeriodForm period={editing} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}