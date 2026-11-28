"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRupiah } from "@/lib/format";

type Point = { label: string; income: number; expense: number };

export function FinanceChart({ data }: { data: Point[] }) {
  let running = 0;
  const balanceData = data.map((d) => {
    running += d.income - d.expense;
    return { label: d.label, balance: running };
  });
  const tick = (v: number) => `${v / 1000000}jt`;
  const tip = (v: unknown) => formatRupiah(Number(v));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Grafik Keuangan</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compare">
          <TabsList>
            <TabsTrigger value="compare">Pemasukan vs Pengeluaran</TabsTrigger>
            {/* <TabsTrigger value="balance">Perkembangan Saldo</TabsTrigger> */}
          </TabsList>
          <TabsContent value="compare" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={tick} />
                <Tooltip formatter={tip} />
                <Legend />
                <Bar dataKey="income" name="Pemasukan" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="balance" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={tick} />
                <Tooltip formatter={tip} />
                <Line type="monotone" dataKey="balance" name="Saldo" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}