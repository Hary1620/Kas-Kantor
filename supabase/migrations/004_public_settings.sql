create or replace function public.public_show_unpaid()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value::text = 'true' from app_settings where key = 'show_unpaid_members'), false);
$$;

revoke execute on function public.public_show_unpaid() from public, anon, authenticated;
grant execute on function public.public_show_unpaid() to anon, authenticated;