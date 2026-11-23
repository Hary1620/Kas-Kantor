-- Pengaman kewajiban: nominal tidak boleh lebih kecil dari yang sudah dibayar,
-- dan kewajiban yang sudah ada pembayarannya tidak boleh dibatalkan.
create or replace function public.guard_member_due()
returns trigger language plpgsql as $$
declare v_paid numeric;
begin
  if new.member_id <> old.member_id or new.period_id <> old.period_id then
    raise exception 'Anggota dan periode pada kewajiban tidak dapat diubah.';
  end if;

  select coalesce(sum(amount), 0) into v_paid
    from public.payments where member_due_id = new.id and status = 'valid';

  if new.is_cancelled and v_paid > 0 then
    raise exception 'Kewajiban yang sudah ada pembayarannya tidak dapat dibatalkan. Batalkan pembayarannya terlebih dahulu.';
  end if;
  if not new.is_cancelled and new.amount_due < v_paid then
    raise exception 'Nominal kewajiban tidak boleh lebih kecil dari total pembayaran (Rp %).', v_paid::bigint;
  end if;
  return new;
end $$;

create trigger trg_guard_member_due
  before update on public.member_dues
  for each row execute function public.guard_member_due();

-- Statistik dan daftar belum bayar kini mengacu ke SATU periode:
-- periode yang dipilih, atau (jika kosong) periode aktif dengan tanggal mulai terbaru.
create or replace function public.public_payment_stats(p_period_id uuid default null)
returns table (active_members int, paid_count int, unpaid_count int, total_due numeric, total_received numeric)
language sql stable security definer set search_path = public as $$
  with target as (
    select coalesce(p_period_id, (
      select id from dues_periods where status = 'active'
      order by start_date desc, created_at desc limit 1)) as id
  ), x as (
    select s.* from member_dues_summary s cross join target
    where s.period_id = target.id and s.status <> 'cancelled'
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
  with target as (
    select coalesce(p_period_id, (
      select id from dues_periods where status = 'active'
      order by start_date desc, created_at desc limit 1)) as id
  )
  select distinct m.full_name
  from member_dues_summary s
  join members m on m.id = s.member_id
  cross join target
  where coalesce((select value::text = 'true' from app_settings where key = 'show_unpaid_members'), false)
    and s.period_id = target.id
    and s.status in ('unpaid', 'partial', 'late')
    and m.is_active
  order by 1;
$$;