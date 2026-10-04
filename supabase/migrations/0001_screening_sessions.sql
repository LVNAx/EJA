-- Sesi skrining. Membutuhkan public.children (lihat 0000_children.sql). Aman dijalankan ulang.
create table if not exists public.screening_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  phonological_score float not null,
  rapid_naming_score float not null,
  spelling_score float not null,
  digit_span_score float not null,
  risk_score float not null,
  risk_level text not null check (risk_level in ('low','moderate','high')),
  completed_at timestamptz not null default now()
);

alter table public.screening_sessions enable row level security;

drop policy if exists "parent reads own children screening" on public.screening_sessions;
create policy "parent reads own children screening"
  on public.screening_sessions for select
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));

drop policy if exists "parent inserts own children screening" on public.screening_sessions;
create policy "parent inserts own children screening"
  on public.screening_sessions for insert
  with check (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));
