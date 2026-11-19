-- RLS aktif di semua tabel; hanya admin yang boleh akses
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['members','dues_periods','member_dues','categories','payment_methods','app_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin_all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- payments & audit_logs: admin hanya boleh MEMBACA; penulisan hanya lewat fungsi (RPC)
alter table public.payments enable row level security;
create policy "admin_read" on public.payments for select to authenticated using (public.is_admin());
alter table public.audit_logs enable row level security;
create policy "admin_read" on public.audit_logs for select to authenticated using (public.is_admin());

-- transactions: admin boleh mengubah hanya transaksi manual (bukan hasil pembayaran)
alter table public.transactions enable row level security;
create policy "admin_read" on public.transactions for select to authenticated using (public.is_admin());
create policy "admin_insert_manual" on public.transactions for insert to authenticated
  with check (public.is_admin() and payment_id is null);
create policy "admin_update_manual" on public.transactions for update to authenticated
  using (public.is_admin() and payment_id is null) with check (public.is_admin() and payment_id is null);
create policy "admin_delete_manual" on public.transactions for delete to authenticated
  using (public.is_admin() and payment_id is null);

-- ===== API khusus dashboard publik (hanya data yang boleh tampil) =====
create or replace function public.public_summary()
returns table (total_income numeric, total_expense numeric, balance numeric)
language sql stable security definer set search_path = public as $$
  select i, e, i - e from (
    select coalesce(sum(amount) filter (where type = 'income'), 0) as i,
           coalesce(sum(amount) filter (where type = 'expense'), 0) as e
    from transactions where status = 'valid') t;
$$;

create or replace function public.public_recent_transactions(p_limit int default 10)
returns table (id uuid, title text, member_name text, transaction_date date, amount numeric, type text)
language sql stable security definer set search_path = public as $$
  select t.id, t.description, m.full_name, t.transaction_date, t.amount, t.type
  from transactions t
  left join payments p on p.id = t.payment_id
  left join member_dues md on md.id = p.member_due_id
  left join members m on m.id = md.member_id
  where t.status = 'valid'
  order by t.transaction_date desc, t.created_at desc
  limit least(greatest(p_limit, 1), 10);
$$;

create or replace function public.public_chart_data(p_granularity text default 'month', p_from date default null, p_to date default null)
returns table (bucket date, income numeric, expense numeric)
language sql stable security definer set search_path = public as $$
  select date_trunc(case when p_granularity in ('week','month','year') then p_granularity else 'month' end,
                    t.transaction_date::timestamp)::date,
         coalesce(sum(t.amount) filter (where t.type = 'income'), 0),
         coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)
  from transactions t
  where t.status = 'valid'
    and (p_from is null or t.transaction_date >= p_from)
    and (p_to is null or t.transaction_date <= p_to)
  group by 1 order by 1;
$$;

create or replace function public.public_payment_stats(p_period_id uuid default null)
returns table (active_members int, paid_count int, unpaid_count int, total_due numeric, total_received numeric)
language sql stable security definer set search_path = public as $$
  with x as (
    select s.* from member_dues_summary s
    join dues_periods dp on dp.id = s.period_id
    where s.status <> 'cancelled'
      and ((p_period_id is not null and s.period_id = p_period_id)
        or (p_period_id is null and dp.status = 'active'))
  )
  select (select count(*)::int from members where is_active),
         (count(*) filter (where status = 'paid'))::int,
         (count(*) filter (where status <> 'paid'))::int,
         coalesce(sum(amount_due), 0),
         coalesce(sum(total_paid), 0)
  from x;
$$;

create or replace function public.public_unpaid_members(p_period_id uuid default null)
returns table (member_name text)
language sql stable security definer set search_path = public as $$
  select distinct m.full_name
  from member_dues_summary s
  join dues_periods dp on dp.id = s.period_id
  join members m on m.id = s.member_id
  where coalesce((select value::text = 'true' from app_settings where key = 'show_unpaid_members'), false)
    and s.status in ('unpaid', 'partial', 'late')
    and m.is_active
    and ((p_period_id is not null and s.period_id = p_period_id)
      or (p_period_id is null and dp.status = 'active'))
  order by 1;
$$;

create or replace function public.public_payment_methods()
returns table (id uuid, name text, provider text, account_number text, account_owner text, note text)
language sql stable security definer set search_path = public as $$
  select id, name, provider, account_number, account_owner, note
  from payment_methods where is_active order by name;
$$;

create or replace function public.public_periods()
returns table (id uuid, name text, status text)
language sql stable security definer set search_path = public as $$
  select id, name, status from dues_periods
  where status in ('active', 'completed') order by start_date desc;
$$;

-- ===== Hak akses: publik TIDAK boleh menyentuh tabel sama sekali =====
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.record_payment(uuid, numeric, date, uuid, text, text, text) to authenticated;
grant execute on function public.void_payment(uuid) to authenticated;

grant execute on function
  public.public_summary(),
  public.public_recent_transactions(int),
  public.public_chart_data(text, date, date),
  public.public_payment_stats(uuid),
  public.public_unpaid_members(uuid),
  public.public_payment_methods(),
  public.public_periods()
to anon, authenticated;