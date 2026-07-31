-- Per-user video links for exercises.
-- ---------------------------------------------------------------------------
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Until you do, the Library tab still works but saves to the browser only —
-- it will say "Saved on this device only" instead of "Synced to your account".
--
-- Why a table rather than user_metadata: metadata is embedded in the JWT, so a
-- couple of hundred video links would bloat every single request.
-- ---------------------------------------------------------------------------

create table if not exists public.exercise_media (
  user_id     uuid        not null references auth.users on delete cascade,
  exercise_id text        not null,
  youtube_id  text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_media enable row level security;

-- One policy covering select/insert/update/delete: you can only ever see or
-- touch your own rows.
drop policy if exists "own rows" on public.exercise_media;
create policy "own rows" on public.exercise_media
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
