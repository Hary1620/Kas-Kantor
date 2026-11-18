import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PaymentMethods } from "@/components/dashboard/payment-methods";
import { paymentMethods } from "@/lib/dummy-data";

export default function PublicDashboardPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Kas Bersama</h1>
        <p className="text-sm text-muted-foreground">Ringkasan keuangan yang dapat dilihat siapa saja.</p>
      </div>
      <DashboardView />
      <PaymentMethods methods={paymentMethods} />
    </>
  );
}