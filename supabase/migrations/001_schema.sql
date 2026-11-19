create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  phone text,
  joined_at date not null default current_date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dues_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  due_date date not null,
  default_amount numeric(14,2) not null check (default_amount >= 0),
  allow_installments boolean not null default false,
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.member_dues (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id),
  period_id uuid not null references public.dues_periods(id),
  amount_due numeric(14,2) not null check (amount_due >= 0),
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (member_id, period_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income','expense')),
  is_active boolean not null default true,
  unique (name, type)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  account_number text,
  account_owner text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_due_id uuid not null references public.member_dues(id),
  amount numeric(14,2) not null check (amount > 0),
  paid_at date not null,
  payment_method_id uuid references public.payment_methods(id),
  receipt_path text,
  notes text,
  status text not null default 'valid' check (status in ('valid','void')),
  idempotency_key text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  voided_at timestamptz
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income','expense')),
  category_id uuid references public.categories(id),
  amount numeric(14,2) not null check (amount > 0),
  transaction_date date not null,
  description text not null,
  payment_method_id uuid references public.payment_methods(id),
  receipt_path text,
  notes text,
  payment_id uuid unique references public.payments(id),
  status text not null default 'valid' check (status in ('valid','void')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payment_id is null or type = 'income')
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_members_updated before update on public.members
  for each row execute function public.set_updated_at();
create trigger trg_periods_updated before update on public.dues_periods
  for each row execute function public.set_updated_at();
create trigger trg_transactions_updated before update on public.transactions
  for each row execute function public.set_updated_at();

insert into public.categories (name, type) values
  ('Iuran Anggota', 'income'),
  ('Pemasukan Lainnya', 'income'),
  ('Kebutuhan Bersama', 'expense'),
  ('Operasional', 'expense'),
  ('Pengeluaran Lainnya', 'expense');

insert into public.app_settings (key, value) values ('show_unpaid_members', 'true'::jsonb);