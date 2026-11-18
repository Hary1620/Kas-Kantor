import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      <DashboardView />
    </div>
  );
}