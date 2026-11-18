import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";

export function SummaryCards({ income, expense }: { income: number; expense: number }) {
  const balance = income - expense;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-0 bg-primary text-white shadow-md sm:col-span-2">
        <CardContent>
          <p className="text-sm text-white/80">Total Saldo Kas</p>
          <p className="mt-1 text-4xl font-bold tracking-tight md:text-5xl">{formatRupiah(balance)}</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-4">
          <ArrowUpCircle className="size-9 text-income" />
          <div>
            <p className="text-sm text-muted-foreground">Total Pemasukan</p>
            <p className="text-xl font-semibold">{formatRupiah(income)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-4">
          <ArrowDownCircle className="size-9 text-expense" />
          <div>
            <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
            <p className="text-xl font-semibold">{formatRupiah(expense)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}