create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Status DIHITUNG dari pembayaran valid, bukan diisi manual
create or replace view public.member_dues_summary
with (security_invoker = true) as
select
  md.id as member_due_id,
  md.member_id,
  md.period_id,
  md.amount_due,
  coalesce(sum(p.amount) filter (where p.status = 'valid'), 0) as total_paid,
  greatest(md.amount_due - coalesce(sum(p.amount) filter (where p.status = 'valid'), 0), 0) as remaining,
  case
    when md.is_cancelled or dp.status = 'cancelled' then 'cancelled'
    when coalesce(sum(p.amount) filter (where p.status = 'valid'), 0) >= md.amount_due then 'paid'
    when dp.due_date < (now() at time zone 'Asia/Jakarta')::date then 'late'
    when coalesce(sum(p.amount) filter (where p.status = 'valid'), 0) > 0 then 'partial'
    else 'unpaid'
  end as status
from public.member_dues md
join public.dues_periods dp on dp.id = md.period_id
left join public.payments p on p.member_due_id = md.id
group by md.id, dp.id;

-- Pembayaran + transaksi pemasukan dalam SATU transaksi database (atomik)
create or replace function public.record_payment(
  p_member_due_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_payment_method_id uuid,
  p_receipt_path text,
  p_notes text,
  p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_payment_id uuid;
  v_due record;
  v_paid numeric;
  v_category uuid;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  -- Kirim ulang dengan kunci yang sama = hasil yang sama, tidak tercatat dua kali
  select id into v_payment_id from payments where idempotency_key = p_idempotency_key;
  if found then
    return v_payment_id;
  end if;

  select md.amount_due, md.is_cancelled, dp.status as period_status,
         dp.allow_installments, dp.name as period_name
    into v_due
    from member_dues md
    join dues_periods dp on dp.id = md.period_id
   where md.id = p_member_due_id
     for update of md;
  if not found then
    raise exception 'Kewajiban iuran tidak ditemukan';
  end if;
  if v_due.is_cancelled or v_due.period_status = 'cancelled' then
    raise exception 'Kewajiban atau periode sudah dibatalkan';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal pembayaran harus lebih dari 0';
  end if;

  select coalesce(sum(amount), 0) into v_paid
    from payments where member_due_id = p_member_due_id and status = 'valid';

  if p_amount > v_due.amount_due - v_paid then
    raise exception 'Pembayaran melebihi sisa kewajiban';
  end if;
  if not v_due.allow_installments and p_amount <> v_due.amount_due - v_paid then
    raise exception 'Periode ini tidak mengizinkan cicilan';
  end if;

  select id into v_category from categories where name = 'Iuran Anggota' and type = 'income';

  insert into payments (member_due_id, amount, paid_at, payment_method_id, receipt_path, notes, idempotency_key, created_by)
  values (p_member_due_id, p_amount, p_paid_at, p_payment_method_id, p_receipt_path, p_notes, p_idempotency_key, auth.uid())
  returning id into v_payment_id;

  insert into transactions (type, category_id, amount, transaction_date, description, payment_method_id, receipt_path, notes, payment_id, created_by)
  values ('income', v_category, p_amount, p_paid_at, 'Iuran ' || v_due.period_name, p_payment_method_id, p_receipt_path, p_notes, v_payment_id, auth.uid());

  insert into audit_logs (actor_id, action, table_name, record_id, details)
  values (auth.uid(), 'record_payment', 'payments', v_payment_id,
          jsonb_build_object('amount', p_amount, 'member_due_id', p_member_due_id));

  return v_payment_id;
end $$;

create or replace function public.void_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  update payments set status = 'void', voided_at = now()
   where id = p_payment_id and status = 'valid';
  if not found then
    raise exception 'Pembayaran tidak ditemukan atau sudah dibatalkan';
  end if;

  update transactions set status = 'void' where payment_id = p_payment_id;

  insert into audit_logs (actor_id, action, table_name, record_id)
  values (auth.uid(), 'void_payment', 'payments', p_payment_id);
end $$;