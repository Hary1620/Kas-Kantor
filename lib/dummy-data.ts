export type Transaction = {
  id: string;
  title: string;
  memberName?: string;
  date: string;
  amount: number;
  type: "income" | "expense";
};

export const monthly = [
  { label: "Jun", income: 1350000, expense: 200000 },
  { label: "Jul", income: 1450000, expense: 300000 },
  { label: "Agu", income: 1500000, expense: 0 },
  { label: "Sep", income: 1600000, expense: 500000 },
  { label: "Okt", income: 1700000, expense: 250000 },
  { label: "Nov", income: 1605549, expense: 250000 },
];

export const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
export const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);

export const stats = {
  activeMembers: 24,
  paid: 18,
  unpaid: 6,
  totalDue: 1200000,
  totalReceived: 900000,
};

export const unpaidMembers = ["Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar"];

export const paymentMethods = [
  { id: "1", name: "Transfer Bank", provider: "BCA", number: "1234567890", owner: "Bendahara Kas", note: "Cantumkan nama saat transfer" },
  { id: "2", name: "E-Wallet", provider: "DANA", number: "081234567890", owner: "Bendahara Kas", note: "Kirim bukti ke admin" },
];

export const recentTransactions: Transaction[] = [
  { id: "t1", title: "Iuran November 2026", memberName: "Andi", date: "2026-11-17", amount: 50000, type: "income" },
  { id: "t2", title: "Beli perlengkapan acara", date: "2026-11-16", amount: 150000, type: "expense" },
  { id: "t3", title: "Iuran November 2026", memberName: "Budi", date: "2026-11-15", amount: 50000, type: "income" },
  { id: "t4", title: "Iuran November 2026", memberName: "Citra", date: "2026-11-14", amount: 50000, type: "income" },
  { id: "t5", title: "Biaya operasional", date: "2026-11-12", amount: 100000, type: "expense" },
  { id: "t6", title: "Donasi anggota", date: "2026-11-10", amount: 200000, type: "income" },
  { id: "t7", title: "Iuran November 2026", memberName: "Dewi", date: "2026-11-09", amount: 50000, type: "income" },
  { id: "t8", title: "Konsumsi rapat", date: "2026-11-08", amount: 75000, type: "expense" },
  { id: "t9", title: "Iuran November 2026", memberName: "Eko", date: "2026-11-06", amount: 50000, type: "income" },
  { id: "t10", title: "Iuran November 2026", memberName: "Fajar", date: "2026-11-05", amount: 50000, type: "income" },
];