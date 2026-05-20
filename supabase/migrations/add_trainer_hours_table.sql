create table if not exists public.trainer_hours (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  work_date date not null default current_date,
  hours numeric(5,2) not null check (hours > 0),
  notes text,
  created_at timestamptz default now()
);

alter table public.trainer_hours enable row level security;

create policy "Admins can manage all trainer hours"
on public.trainer_hours
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Trainers can view their own hours"
on public.trainer_hours
for select
using (
  exists (
    select 1 from public.trainers
    where trainers.id = trainer_hours.trainer_id
    and trainers.profile_id = auth.uid()
  )
);

create policy "Trainers can insert their own hours"
on public.trainer_hours
for insert
with check (
  exists (
    select 1 from public.trainers
    where trainers.id = trainer_hours.trainer_id
    and trainers.profile_id = auth.uid()
  )
);

create policy "Trainers can update their own hours"
on public.trainer_hours
for update
using (
  exists (
    select 1 from public.trainers
    where trainers.id = trainer_hours.trainer_id
    and trainers.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trainers
    where trainers.id = trainer_hours.trainer_id
    and trainers.profile_id = auth.uid()
  )
);

create policy "Trainers can delete their own hours"
on public.trainer_hours
for delete
using (
  exists (
    select 1 from public.trainers
    where trainers.id = trainer_hours.trainer_id
    and trainers.profile_id = auth.uid()
  )
);