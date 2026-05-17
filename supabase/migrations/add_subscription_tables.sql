-- Subscription packages: admin-defined plans tied to specific classes
create table public.subscription_packages (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  name text not null,
  duration_days integer not null,
  price numeric(10,2) not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.subscription_packages enable row level security;

create policy "subscription_packages: public read" on public.subscription_packages
  for select using (true);

create policy "subscription_packages: admin all" on public.subscription_packages
  for all using (get_my_role() = 'admin');

-- Subscriptions: member requests and their lifecycle
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  package_id uuid references public.subscription_packages(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'active', 'expired', 'rejected')),
  requested_at timestamptz default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  start_date date,
  end_date date,
  notes text
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: member read own" on public.subscriptions
  for select using (
    member_id in (
      select id from public.members where profile_id = auth.uid()
    )
  );

create policy "subscriptions: member insert own" on public.subscriptions
  for insert with check (
    member_id in (
      select id from public.members where profile_id = auth.uid()
    )
  );

create policy "subscriptions: admin all" on public.subscriptions
  for all using (get_my_role() = 'admin');

create policy "subscriptions: trainer read all" on public.subscriptions
  for select using (get_my_role() = 'trainer');

create policy "subscriptions: trainer update" on public.subscriptions
  for update using (get_my_role() = 'trainer');
