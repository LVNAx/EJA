-- Evidence-based task records. No risk label is inferred from unvalidated weights.
create table if not exists public.screening_assessments (
  id uuid primary key,
  child_id uuid not null references public.children(id) on delete cascade,
  protocol_version integer not null check (protocol_version = 2),
  responses jsonb not null check (jsonb_typeof(responses) = 'object' and responses ? 'version' and responses->>'version' = '2' and responses ? 'answers' and jsonb_typeof(responses->'answers') = 'array' and octet_length(responses::text) <= 65536),
  completed_at timestamptz not null default now()
);
create index if not exists screening_assessments_child_date on public.screening_assessments(child_id, completed_at desc);
alter table public.screening_assessments enable row level security;
drop policy if exists "parent reads own assessment evidence" on public.screening_assessments;
create policy "parent reads own assessment evidence" on public.screening_assessments for select to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())));
drop policy if exists "parent inserts own assessment evidence" on public.screening_assessments;
create policy "parent inserts own assessment evidence" on public.screening_assessments for insert to authenticated
  with check (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())));
grant select, insert on public.screening_assessments to authenticated;
