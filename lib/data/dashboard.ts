import { createClient } from "@/lib/supabase/server";

export type Transaction = {
  id: string;
  title: string;
  memberName?: string;
  date: string;
  amount: number;
  type: "income" | "expense";
};

export type PaymentStatsData = {
  activeMembers: number;
  paid: number;
  unpaid: number;
  totalDue: number;
  totalReceived: number;
};

export type PaymentMethod = {
  id: string;
  name: string;
  provider: string;
  number: string;
  owner: string;
  note: string;
};

export type DashboardData = {
  totalIncome: number;
  totalExpense: number;
  chart: { label: string; income: number; expense: number }[];
  recent: Transaction[];
  stats: PaymentStatsData;
  unpaidNames: string[];
  showUnpaid: boolean;
  methods: PaymentMethod[];
};

const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(iso));

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [summary, recent, chart, stats, unpaid, showUnpaid, methods] = await Promise.all([
    supabase.rpc("public_summary"),
    supabase.rpc("public_recent_transactions", { p_limit: 10 }),
    supabase.rpc("public_chart_data", { p_granularity: "month" }),
    supabase.rpc("public_payment_stats"),
    supabase.rpc("public_unpaid_members"),
    supabase.rpc("public_show_unpaid"),
    supabase.rpc("public_payment_methods"),
  ]);

  const failed = [summary, recent, chart, stats, unpaid, showUnpaid, methods].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const s = summary.data?.[0];
  const st = stats.data?.[0];

  return {
    totalIncome: Number(s?.total_income ?? 0),
    totalExpense: Number(s?.total_expense ?? 0),
    chart: (chart.data ?? []).map((r: { bucket: string; income: number; expense: number }) => ({
      label: monthLabel(r.bucket),
      income: Number(r.income),
      expense: Number(r.expense),
    })),
    recent: (recent.data ?? []).map(
      (r: { id: string; title: string; member_name: string | null; transaction_date: string; amount: number; type: "income" | "expense" }) => ({
        id: r.id,
        title: r.title,
        memberName: r.member_name ?? undefined,
        date: r.transaction_date,
        amount: Number(r.amount),
        type: r.type,
      })
    ),
    stats: {
      activeMembers: Number(st?.active_members ?? 0),
      paid: Number(st?.paid_count ?? 0),
      unpaid: Number(st?.unpaid_count ?? 0),
      totalDue: Number(st?.total_due ?? 0),
      totalReceived: Number(st?.total_received ?? 0),
    },
    unpaidNames: (unpaid.data ?? []).map((r: { member_name: string }) => r.member_name),
    showUnpaid: Boolean(showUnpaid.data),
    methods: (methods.data ?? []).map(
      (r: { id: string; name: string; provider: string | null; account_number: string | null; account_owner: string | null; note: string | null }) => ({
        id: r.id,
        name: r.name,
        provider: r.provider ?? "",
        number: r.account_number ?? "",
        owner: r.account_owner ?? "",
        note: r.note ?? "",
      })
    ),
  };
}