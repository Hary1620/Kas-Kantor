import { FinanceChart } from "./finance-chart";
import { PaymentStats } from "./payment-stats";
import { RecentActivity } from "./recent-activity";
import { SummaryCards } from "./summary-cards";
import { UnpaidList } from "./unpaid-list";
import { monthly, recentTransactions, stats, totalExpense, totalIncome, unpaidMembers } from "@/lib/dummy-data";

export function DashboardView() {
  return (
    <div className="space-y-6">
      <SummaryCards income={totalIncome} expense={totalExpense} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FinanceChart data={monthly} />
          <RecentActivity items={recentTransactions} />
        </div>
        <div className="space-y-6">
          <PaymentStats stats={stats} />
          <UnpaidList names={unpaidMembers} />
        </div>
      </div>
    </div>
  );
}