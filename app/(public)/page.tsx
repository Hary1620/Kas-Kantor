import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PaymentMethods } from "@/components/dashboard/payment-methods";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function PublicDashboardPage() {
  const data = await getDashboardData();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Kas Bersama</h1>
        <p className="text-sm text-muted-foreground">Ringkasan keuangan yang dapat dilihat siapa saja.</p>
      </div>
      <DashboardView data={data} />
      <PaymentMethods methods={data.methods} />
    </>
  );
}