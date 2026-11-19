import type { DashboardData } from "@/lib/data/dashboard";
import { FinanceChart } from "./finance-chart";
import { PaymentStats } from "./payment-stats";
import { RecentActivity } from "./recent-activity";
import { SummaryCards } from "./summary-cards";
import { UnpaidList } from "./unpaid-list";

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <SummaryCards income={data.totalIncome} expense={data.totalExpense} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FinanceChart data={data.chart} />
          <RecentActivity items={data.recent} />
        </div>
        <div className="space-y-6">
          <PaymentStats stats={data.stats} />
          {data.showUnpaid && <UnpaidList names={data.unpaidNames} />}
        </div>
      </div>
    </div>
  );
}