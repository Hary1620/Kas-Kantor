"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveMethod, setMethodActive } from "@/app/admin/metode-pembayaran/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fieldClass } from "@/lib/ui";
import { methodSchema, type MethodValues } from "@/lib/validations/method"; 

export type MethodRow = {
  id: string;
  name: string;
  provider: string | null;
  account_number: string | null;
  account_owner: string | null;
  note: string | null;
  is_active: boolean;
  qr_image_url: string | null;
};

function MethodForm({ method, onDone }: { method: MethodRow | null; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [qrisFile, setQrisFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(
  method?.qr_image_url ?? null
);

useEffect(() => {
  if (!qrisFile) return;

  const url = URL.createObjectURL(qrisFile);
  setPreviewUrl(url);

  return () => URL.revokeObjectURL(url);
}, [qrisFile]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MethodValues>({
    resolver: zodResolver(methodSchema),
    defaultValues: {
      name: method?.name ?? "",
      provider: method?.provider ?? "",
      account_number: method?.account_number ?? "",
      account_owner: method?.account_owner ?? "",
      note: method?.note ?? "",
    },
  });

  function onSubmit(values: MethodValues) {
    setError(null);
    startTransition(async () => {
      const res = await saveMethod(values, method?.id, qrisFile);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  const err = (m?: string) => (m ? <p className="text-xs text-expense">{m}</p> : null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama metode</Label>
          <Input id="name" placeholder="Transfer Bank / E-Wallet" {...register("name")} />
          {err(errors.name?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Bank / e-wallet</Label>
          <Input id="provider" placeholder="BCA, DANA, ..." {...register("provider")} />
          {err(errors.provider?.message)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_number">Nomor rekening / tujuan</Label>
          <Input id="account_number" inputMode="numeric" {...register("account_number")} />
          {err(errors.account_number?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_owner">Nama pemilik</Label>
          <Input id="account_owner" {...register("account_owner")} />
          {err(errors.account_owner?.message)}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Catatan pembayaran</Label>
        <textarea id="note" rows={2} className={`${fieldClass} w-full`} {...register("note")} />
        {err(errors.note?.message)}
      </div>
<div className="space-y-2">
  <Label htmlFor="qris">Gambar QRIS (Opsional)</Label>

  <Input
    id="qris"
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;
      setQrisFile(file);
    }}
  />

  <p className="text-xs text-muted-foreground">
    Format PNG, JPG, atau WEBP. Maksimal 5 MB.
  </p>

  {previewUrl && (
    <div className="mt-3 rounded-lg border p-3">
      <p className="mb-2 text-sm font-medium">Preview QRIS</p>
      <img
        src={previewUrl}
        alt="Preview QRIS"
        className="h-48 w-48 rounded-lg border object-contain"
      />
    </div>
  )}
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

export function MethodsTable({ methods }: { methods: MethodRow[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MethodRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(m: MethodRow) {
    const message = m.is_active
      ? `Nonaktifkan ${m.name}${m.provider ? ` (${m.provider})` : ""}? Metode ini tidak akan tampil di halaman publik.`
      : `Aktifkan kembali ${m.name}?`;
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const res = await setMethodActive(m.id, !m.is_active);
      setError(res.error ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Tambah Metode
        </Button>
      </div>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metode</TableHead>
              <TableHead>Nomor tujuan</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Belum ada metode pembayaran.
                </TableCell>
              </TableRow>
            )}
            {methods.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <p className="font-medium">{m.name}</p>
                  {m.provider && <p className="text-xs text-muted-foreground">{m.provider}</p>}
                </TableCell>
                <TableCell>{m.account_number ?? "-"}</TableCell>
                <TableCell>{m.account_owner ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={m.is_active ? "bg-green-50 text-income" : "bg-slate-100 text-slate-600"}>
                    {m.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(m);
                      setOpen(true);
                    }}
                  >
                    Ubah
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => toggle(m)}>
                    {m.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Metode Pembayaran" : "Tambah Metode Pembayaran"}</DialogTitle>
          </DialogHeader>
          <MethodForm method={editing} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}