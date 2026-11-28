"use client";

import { useState, useTransition } from "react";
import { setShowUnpaid } from "@/app/admin/pengaturan/actions";
import { Card, CardContent } from "@/components/ui/card";

export function UnpaidToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const res = await setShowUnpaid(next);
      if (res.error) {
        setEnabled(previous);
        setError(res.error);
      }
    });
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[#2563eb]"
            checked={enabled}
            disabled={pending}
            onChange={(e) => change(e.target.checked)}
          />
          <span>
            <span className="font-medium">Tampilkan daftar anggota yang belum membayar di halaman publik</span>
            <span className="block text-sm text-muted-foreground">
              Jika dimatikan, pengunjung hanya melihat jumlah dan persentase, tanpa nama anggota.
            </span>
          </span>
        </label>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-expense">{error}</p>}
      </CardContent>
    </Card>
  );
}