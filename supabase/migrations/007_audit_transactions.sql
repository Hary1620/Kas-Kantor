create or replace function public.audit_manual_transaction()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.payment_id is null then
      insert into audit_logs (actor_id, action, table_name, record_id, details)
      values (auth.uid(), 'delete_transaction', 'transactions', old.id, to_jsonb(old));
    end if;
    return old;
  end if;

  -- Transaksi hasil pembayaran sudah dicatat oleh fungsi pembayaran
  if new.payment_id is null then
    insert into audit_logs (actor_id, action, table_name, record_id, details)
    values (
      auth.uid(),
      case when tg_op = 'INSERT' then 'create_transaction' else 'update_transaction' end,
      'transactions',
      new.id,
      case when tg_op = 'INSERT'
           then to_jsonb(new)
           else jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)) end
    );
  end if;
  return new;
end $$;

create trigger trg_audit_transactions
  after insert or update or delete on public.transactions
  for each row execute function public.audit_manual_transaction();