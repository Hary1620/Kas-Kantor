"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Method = { id: string; name: string; provider: string; number: string; owner: string; note: string };

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
            <p className="text-xs text-muted-foreground">{m.name} · {m.provider}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-lg font-semibold tracking-wide">{m.number}</p>
              <Button size="sm" variant="outline" onClick={() => copy(m)}>
                {copiedId === m.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiedId === m.id ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <p className="mt-1 text-sm">a.n. {m.owner}</p>
            <p className="text-xs text-muted-foreground">{m.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}