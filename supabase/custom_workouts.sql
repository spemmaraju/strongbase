-- Per-user saved custom workouts (the Workout Builder).
-- ---------------------------------------------------------------------------
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Until you do, the builder still works but saves to this device only.
-- ---------------------------------------------------------------------------

create table if not exists public.custom_workouts (
  user_id      uuid        not null references auth.users on delete cascade,
  id           text        not null,
  name         text        not null,
  focus_id     text,
  exercise_ids jsonb       not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.custom_workouts enable row level security;

-- You can only ever see or touch your own rows.
drop policy if exists "own rows" on public.custom_workouts;
create policy "own rows" on public.custom_workouts
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
