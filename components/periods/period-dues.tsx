"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { assignMembers, setMemberDueCancelled, updateMemberDue } from "@/app/admin/periode/dues-actions";
import { DueStatusBadge } from "@/components/dues/due-status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import type { DueStatus } from "@/lib/labels";

export type DueRow = {
  id: string;
  member_id: string;
  name: string;
  amount_due: number;
  total_paid: number;
  remaining: number;
  status: DueStatus;
};
type Candidate = { id: string; name: string };

function formatAmountInput(value: string | number) {
  const digits = String(value).replace(/\D/g, "");
  return digits === "" ? "" : new Intl.NumberFormat("id-ID").format(Number(digits));
}

function parseAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? 0 : Number(digits);
}

function AddMembersForm({
  periodId,
  defaultAmount,
  candidates,
  onDone,
}: {
  periodId: string;
  defaultAmount: number;
  candidates: Candidate[];
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(formatAmountInput(defaultAmount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    if (amount.trim() === "") return setError("Nominal wajib diisi");
    startTransition(async () => {
      const res = await assignMembers(periodId, Array.from(selected), parseAmountInput(amount));
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  if (candidates.length === 0) {
    return <p className="text-sm text-muted-foreground">Semua anggota aktif sudah terdaftar di periode ini.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Nominal kewajiban (Rp)</Label>
        <Input
  id="amount"
  type="text"
  inputMode="numeric"
  value={amount}
  onChange={(e) => setAmount(formatAmountInput(e.target.value))}/>
        <p className="text-xs text-muted-foreground">
          Berlaku untuk semua anggota yang dipilih. Nominal khusus per anggota bisa diubah setelahnya.
        </p>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-[#2563eb]"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.id)))}
          />
          Pilih semua ({candidates.length})
        </label>
        <ul className="max-h-60 divide-y overflow-y-auto rounded-md border">
          {candidates.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-brand-light">
                <input type="checkbox" className="size-4 accent-[#2563eb]" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="button" onClick={submit} disabled={pending || selected.size === 0}>
          {pending ? "Menyimpan..." : `Tambahkan (${selected.size})`}
        </Button>
      </div>
    </div>
  );
}

function EditAmountForm({ row, onDone }: { row: DueRow; onDone: () => void }) {
  const [amount, setAmount] = useState(formatAmountInput(row.amount_due));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (amount.trim() === "") return setError("Nominal wajib diisi");
    startTransition(async () => {
      const res = await updateMemberDue(row.id, parseAmountInput(amount));
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sudah dibayar: <span className="font-medium text-foreground">{formatRupiah(row.total_paid)}</span>. Nominal tidak boleh lebih kecil dari ini.
      </p>
      <div className="space-y-2">
        <Label htmlFor="edit-amount">Nominal kewajiban (Rp)</Label>
        <Input
  id="edit-amount"
  type="text"
  inputMode="numeric"
  value={amount}
  onChange={(e) => setAmount(formatAmountInput(e.target.value))}/>
      </div>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}

export function PeriodDues({
  periodId,
  defaultAmount,
  canAssign,
  rows,
  candidates,
}: {
  periodId: string;
  defaultAmount: number;
  canAssign: boolean;
  rows: DueRow[];
  candidates: Candidate[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<DueRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleCancel(r: DueRow) {
    const cancel = r.status !== "cancelled";
    const message = cancel ? `Batalkan kewajiban ${r.name} pada periode ini?` : `Pulihkan kewajiban ${r.name}?`;
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const res = await setMemberDueCancelled(r.id, cancel);
      setError(res.error ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daftar Kewajiban</h2>
        <Button onClick={() => setAddOpen(true)} disabled={!canAssign}>
          <Plus className="size-4" />
          Tambah Anggota
        </Button>
      </div>
      {!canAssign && (
        <p className="text-sm text-muted-foreground">Periode berstatus Selesai atau Dibatalkan tidak dapat ditambah anggota.</p>
      )}
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anggota</TableHead>
              <TableHead>Kewajiban</TableHead>
              <TableHead>Dibayar</TableHead>
              <TableHead>Sisa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Belum ada anggota di periode ini.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{formatRupiah(r.amount_due)}</TableCell>
                <TableCell className="text-income">{formatRupiah(r.total_paid)}</TableCell>
                <TableCell>{formatRupiah(r.remaining)}</TableCell>
                <TableCell>
                  <DueStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" disabled={r.status === "cancelled"} onClick={() => setEditing(r)}>
                    Ubah nominal
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => toggleCancel(r)}>
                    {r.status === "cancelled" ? "Pulihkan" : "Batalkan"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota ke Periode</DialogTitle>
          </DialogHeader>
          <AddMembersForm periodId={periodId} defaultAmount={defaultAmount} candidates={candidates} onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Nominal{editing ? ` – ${editing.name}` : ""}</DialogTitle>
          </DialogHeader>
          {editing && <EditAmountForm key={editing.id} row={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}