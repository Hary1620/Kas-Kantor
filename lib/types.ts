export type ActionResult = { error?: string };

export type Member = {
  id: string;
  full_name: string;
  phone: string | null;
  joined_at: string;
  is_active: boolean;
  notes: string | null;
};

export type PeriodStatus = "draft" | "active" | "completed" | "cancelled";

export type Period = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  due_date: string;
  default_amount: number;
  allow_installments: boolean;
  status: PeriodStatus;
  description: string | null;
};