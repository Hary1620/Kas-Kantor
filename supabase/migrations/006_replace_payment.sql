create or replace function public.replace_payment(
  p_payment_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_payment_method_id uuid,
  p_notes text,
  p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_old record;
  v_new uuid;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  -- Kirim ulang dengan kunci yang sama = hasil yang sama
  select id into v_new from payments where idempotency_key = p_idempotency_key;
  if found then
    return v_new;
  end if;

  select member_due_id, receipt_path, status into v_old
    from payments where id = p_payment_id for update;
  if not found then
    raise exception 'Pembayaran tidak ditemukan';
  end if;
  if v_old.status <> 'valid' then
    raise exception 'Pembayaran yang sudah dibatalkan tidak dapat diubah';
  end if;

  perform public.void_payment(p_payment_id);
  v_new := public.record_payment(
    v_old.member_due_id, p_amount, p_paid_at, p_payment_method_id,
    v_old.receipt_path, p_notes, p_idempotency_key
  );

  insert into audit_logs (actor_id, action, table_name, record_id, details)
  values (auth.uid(), 'replace_payment', 'payments', v_new,
          jsonb_build_object('replaces', p_payment_id));

  return v_new;
end $$;

revoke execute on function public.replace_payment(uuid, numeric, date, uuid, text, text) from public, anon;
grant execute on function public.replace_payment(uuid, numeric, date, uuid, text, text) to authenticated;