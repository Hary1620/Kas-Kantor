import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UnpaidList({ names }: { names: string[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Belum Membayar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {names.length === 0 && <p className="text-sm text-muted-foreground">Semua anggota sudah membayar.</p>}
        {names.map((n) => (
          <Badge key={n} variant="secondary">{n}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}