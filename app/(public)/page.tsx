
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PaymentMethods } from "@/components/dashboard/payment-methods";
import { getDashboardData } from "@/lib/data/dashboard";

async function PublicDashboardContent() {
  const data = await getDashboardData();

  return (
    <>
      <DashboardView data={data} />
      <PaymentMethods methods={data.methods} />
    </>
  );
}

export default function PublicDashboardPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Kas Bersama</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan keuangan yang dapat dilihat siapa saja.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-6 text-sm text-muted-foreground">
            Memuat ringkasan keuangan...
          </div>
        }
      >
        <PublicDashboardContent />
      </Suspense>
    </>
  );
}
