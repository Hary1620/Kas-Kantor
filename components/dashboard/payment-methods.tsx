"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Method = {
  id: string;
  name: string;
  provider: string;
  number: string;
  owner: string;
  note: string;
  qrImageUrl: string | null;
};
export function PaymentMethods({ methods }: { methods: Method[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(m: Method) {
    await navigator.clipboard.writeText(m.number);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Informasi Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
      {methods.map((m) => (
  <div key={m.id} className="rounded-xl border bg-brand-light p-4">
    <p className="text-xs text-muted-foreground">
      {m.name} · {m.provider}
    </p>

    {m.number && (
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-lg font-semibold tracking-wide">{m.number}</p>

        {!m.qrImageUrl && (
          <Button size="sm" variant="outline" onClick={() => copy(m)}>
            {copiedId === m.id ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copiedId === m.id ? "Tersalin" : "Salin"}
          </Button>
        )}
      </div>
    )}

    {m.qrImageUrl && (
      <div className="mt-3">
        <p className="mb-2 text-sm font-medium">
          Scan QRIS untuk pembayaran
        </p>

        <a
          href={m.qrImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka gambar QRIS ukuran penuh"
        >
          <img
            src={m.qrImageUrl}
            alt={`QRIS ${m.name}`}
            className="h-56 w-56 rounded-lg border bg-white object-contain p-2"
          />
        </a>

        <p className="mt-1 text-xs text-muted-foreground">
          Klik gambar untuk melihat ukuran penuh.
        </p>
      </div>
    )}

    <p className="mt-1 text-sm">a.n. {m.owner}</p>
    <p className="text-xs text-muted-foreground">{m.note}</p>
  </div>
))}
      </CardContent>
    </Card>
  );
}