import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatRupiah } from "@/lib/format";
import type { stats as statsData } from "@/lib/dummy-data";

export function PaymentStats({ stats }: { stats: typeof statsData }) {
  const percent = stats.activeMembers === 0 ? 0 : Math.round((stats.paid / stats.activeMembers) * 100);
  return (
    <Card className="bg-brand-light shadow-sm">
      <CardHeader>
        <CardTitle>Statistik Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>{stats.paid} dari {stats.activeMembers} anggota sudah membayar</span>
            <span className="font-semibold text-primary">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Belum bayar</dt><dd className="font-semibold">{stats.unpaid} anggota</dd></div>
          <div><dt className="text-muted-foreground">Total kewajiban</dt><dd className="font-semibold">{formatRupiah(stats.totalDue)}</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">Total diterima</dt><dd className="font-semibold">{formatRupiah(stats.totalReceived)}</dd></div>
        </dl>
      </CardContent>
    </Card>
  );
}