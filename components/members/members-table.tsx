"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveMember, setMemberActive } from "@/app/admin/anggota/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { Member } from "@/lib/types";
import { fieldClass } from "@/lib/ui";
import { memberSchema, type MemberValues } from "@/lib/validations/member";

function MemberForm({ member, onDone }: { member: Member | null; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
 const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: member?.full_name ?? "",
      phone: member?.phone ?? "",
      joined_at: member?.joined_at ?? "",
      notes: member?.notes ?? "",
    },
  });

  // Tanggal hari ini diisi di browser (bukan saat render awal)
useEffect(() => {
  if (!member) {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Jakarta",
    }).format(new Date());

    setValue("joined_at", today);
  }
}, [member, setValue]);

  

  function onSubmit(values: MemberValues) {
    setError(null);
    startTransition(async () => {
      const res = await saveMember(values, member?.id);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-expense">{errors.full_name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor kontak</Label>
          <Input id="phone" inputMode="tel" {...register("phone")} />
          {errors.phone && <p className="text-xs text-expense">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="joined_at">Tanggal bergabung</Label>
          <Input id="joined_at" type="date" {...register("joined_at")} />
          {errors.joined_at && <p className="text-xs text-expense">{errors.joined_at.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <textarea id="notes" rows={3} className={`${fieldClass} w-full`} {...register("notes")} />
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

export function MembersTable({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(m: Member) {
    setEditing(m);
    setOpen(true);
  }
  function toggleActive(m: Member) {
    const message = m.is_active
      ? `Nonaktifkan ${m.full_name}? Riwayat keuangannya tetap tersimpan.`
      : `Aktifkan kembali ${m.full_name}?`;
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const res = await setMemberActive(m.id, !m.is_active);
      setActionError(res.error ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{members.length} anggota</p>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Tambah Anggota
        </Button>
      </div>

      {actionError && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{actionError}</p>}

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Belum ada anggota.
                </TableCell>
              </TableRow>
            )}
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell>{m.phone ?? "-"}</TableCell>
                <TableCell>{formatDate(m.joined_at)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={m.is_active ? "bg-green-50 text-income" : "bg-slate-100 text-slate-600"}>
                    {m.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                    Ubah
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => toggleActive(m)}>
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
            <DialogTitle>{editing ? "Ubah Anggota" : "Tambah Anggota"}</DialogTitle>
          </DialogHeader>
          <MemberForm member={editing} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}