import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Transaction } from "@/lib/data/dashboard";

export function RecentActivity({ items }: { items: Transaction[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y">
          {items.slice(0, 10).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.memberName ? `${t.memberName} · ` : ""}
                  {formatDate(t.date)}
                </p>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                {t.type === "income" ? "+" : "-"}
                {formatRupiah(t.amount)}
              </span>
            </li>
          ))}
        </ul>
        <Button variant="outline" className="w-full">
          Lihat semua riwayat
        </Button>
      </CardContent>
    </Card>
  );
}