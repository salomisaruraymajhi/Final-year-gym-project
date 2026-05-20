alter table public.subscriptions
add column if not exists payment_status text default 'unpaid',
add column if not exists payment_method text,
add column if not exists payment_reference text,
add column if not exists amount_paid numeric(10,2),
add column if not exists paid_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_payment_status_check'
  ) then
    alter table public.subscriptions
    add constraint subscriptions_payment_status_check
    check (payment_status in ('unpaid', 'paid', 'refunded', 'failed'));
  end if;
end $$;