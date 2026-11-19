import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      <DashboardView data={data} />
    </div>
  );
}