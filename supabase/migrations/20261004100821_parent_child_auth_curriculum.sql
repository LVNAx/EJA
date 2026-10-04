-- EJA: parent profile, atomic PIN verification, curriculum, progress and image cache.
-- auth.users remains the identity source. Children do not have separate Supabase users.
-- Supabase supplies extensions.pgcrypto; PIN verification is tested on the live project.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.parent_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  consent_at timestamptz,
  consent_scope text,
  created_at timestamptz not null default now()
);
alter table public.parent_profiles enable row level security;
drop policy if exists "parent reads profile" on public.parent_profiles;
create policy "parent reads profile" on public.parent_profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "parent updates name" on public.parent_profiles;
create policy "parent updates name" on public.parent_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke all on public.parent_profiles from anon, authenticated;
grant select on public.parent_profiles to authenticated;
grant update (full_name) on public.parent_profiles to authenticated;

-- Metadata is only display/consent data; never used to authorize access.
create or replace function private.create_parent_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.parent_profiles (id, full_name, consent_at, consent_scope)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Orang tua'), 80),
    case when new.raw_user_meta_data->>'consent_at' ~ '^\d{4}-\d{2}-\d{2}T' then now() else null end,
    left(new.raw_user_meta_data->>'consent_scope', 200)) on conflict (id) do nothing;
  return new;
end $$;
revoke all on function private.create_parent_profile() from public, anon, authenticated;
drop trigger if exists eja_create_parent_profile on auth.users;
create trigger eja_create_parent_profile after insert on auth.users for each row execute function private.create_parent_profile();
insert into public.parent_profiles (id, full_name)
select id, left(coalesce(nullif(raw_user_meta_data->>'full_name',''), 'Orang tua'),80) from auth.users on conflict (id) do nothing;

-- Row lock serializes concurrent attempts. Hash and lock counters never leave the DB.
create or replace function private.verify_child_pin(p_child_id uuid, p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare child public.children%rowtype; attempts integer;
begin
  if auth.uid() is null or p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok',false,'status','invalid');
  end if;
  select * into child from public.children where id=p_child_id and parent_id=auth.uid() for update;
  if not found then return jsonb_build_object('ok',false,'status','invalid'); end if;
  if child.pin_locked_until > now() then
    return jsonb_build_object('ok',false,'status','locked','retry_after_seconds',ceil(extract(epoch from child.pin_locked_until-now())));
  end if;
  if child.pin_hash ~ '^\$2[aby]\$' and extensions.crypt(p_pin, child.pin_hash) = child.pin_hash then
    update public.children set pin_failed_count=0, pin_locked_until=null where id=child.id;
    return jsonb_build_object('ok',true,'status','ok');
  end if;
  attempts := (case when child.pin_locked_until is not null then 0 else child.pin_failed_count end) + 1;
  update public.children set pin_failed_count=attempts, pin_locked_until=case when attempts>=5 then now()+interval '15 minutes' else null end where id=child.id;
  return jsonb_build_object('ok',false,'status',case when attempts>=5 then 'locked' else 'invalid' end,'retry_after_seconds',case when attempts>=5 then 900 else 0 end);
end $$;
revoke all on function private.verify_child_pin(uuid,text) from public, anon;
grant execute on function private.verify_child_pin(uuid,text) to authenticated;
create or replace function public.verify_child_pin(p_child_id uuid, p_pin text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.verify_child_pin(p_child_id,p_pin) $$;
revoke all on function public.verify_child_pin(uuid,text) from public, anon;
grant execute on function public.verify_child_pin(uuid,text) to authenticated;

create or replace function private.set_child_pin(p_child_id uuid, p_pin text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_pin is null or p_pin !~ '^[0-9]{4}$' then return false; end if;
  update public.children set pin_hash=extensions.crypt(p_pin,extensions.gen_salt('bf',10)), pin_failed_count=0, pin_locked_until=null
  where id=p_child_id and parent_id=auth.uid();
  return found;
end $$;
revoke all on function private.set_child_pin(uuid,text) from public, anon;
grant execute on function private.set_child_pin(uuid,text) to authenticated;
create or replace function public.set_child_pin(p_child_id uuid, p_pin text) returns boolean
language sql security invoker set search_path = '' as $$ select private.set_child_pin(p_child_id,p_pin) $$;
revoke all on function public.set_child_pin(uuid,text) from public, anon;
grant execute on function public.set_child_pin(uuid,text) to authenticated;

-- Explicit privileges: a new project may not auto-expose SQL-created tables.
revoke all on public.children from anon;
revoke insert on public.children from authenticated;
grant insert (parent_id,name,grade,school,avatar,pin_hash) on public.children to authenticated;
grant delete on public.children to authenticated;
grant select (id,parent_id,name,grade,school,avatar,created_at) on public.children to authenticated;
revoke select (pin_hash,pin_failed_count,pin_locked_until) on public.children from authenticated;
revoke update (parent_id,pin_hash,pin_failed_count,pin_locked_until) on public.children from authenticated;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('matematika','ipa','pancasila','bahasa_indonesia')),
  grade integer not null check (grade between 1 and 6),
  title text not null check (char_length(title) between 1 and 120),
  position integer not null default 0 check (position>=0),
  overview jsonb,
  approved boolean not null default false,
  unique (subject,grade,position)
);
alter table public.lessons add column if not exists unit_id uuid references public.units(id),
  add column if not exists slug text,
  add column if not exists position integer not null default 0,
  add column if not exists prerequisite_id uuid references public.lessons(id);
create unique index if not exists lessons_slug_idx on public.lessons(slug) where slug is not null;
create index if not exists lessons_unit_idx on public.lessons(unit_id);
create index if not exists lessons_prerequisite_idx on public.lessons(prerequisite_id);
create table if not exists public.lesson_chunks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null check (position>=0),
  chunk_type text not null check (chunk_type in ('analogy','step','diagram','quiz')),
  content jsonb not null check (jsonb_typeof(content)='object'),
  unique (lesson_id,position)
);
create table if not exists public.image_cache (
  id uuid primary key default gen_random_uuid(),
  prompt_hash text not null unique check (char_length(prompt_hash) between 1 and 128),
  storage_path text not null,
  storage_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.child_learning_progress (
  child_id uuid primary key references public.children(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp>=0),
  streak integer not null default 0 check (streak>=0),
  last_active_date date,
  state jsonb not null default '{}' check (jsonb_typeof(state)='object'),
  updated_at timestamptz not null default now()
);
alter table public.units enable row level security;
alter table public.lesson_chunks enable row level security;
alter table public.image_cache enable row level security;
alter table public.child_learning_progress enable row level security;
drop policy if exists "read approved units" on public.units;
create policy "read approved units" on public.units for select to authenticated using (approved);
drop policy if exists "read approved chunks" on public.lesson_chunks;
create policy "read approved chunks" on public.lesson_chunks for select to authenticated using (exists(select 1 from public.lessons l where l.id=lesson_id and l.approved));
drop policy if exists "read approved images" on public.image_cache;
create policy "read approved images" on public.image_cache for select to authenticated using (approved);
drop policy if exists "parent reads learning progress" on public.child_learning_progress;
create policy "parent reads learning progress" on public.child_learning_progress for select to authenticated using (exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
drop policy if exists "parent inserts learning progress" on public.child_learning_progress;
create policy "parent inserts learning progress" on public.child_learning_progress for insert to authenticated with check (exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
drop policy if exists "parent updates learning progress" on public.child_learning_progress;
create policy "parent updates learning progress" on public.child_learning_progress for update to authenticated using (exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid()))) with check (exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
revoke all on public.units,public.lesson_chunks,public.image_cache,public.child_learning_progress from anon,authenticated;
grant select on public.units,public.lesson_chunks,public.image_cache to authenticated;
grant select,insert,update on public.child_learning_progress to authenticated;
grant select on public.lessons to authenticated;
grant select,insert on public.screening_sessions,public.chunks_completed,public.quiz_results,public.practice_results,public.notification_reads to authenticated;
grant select,insert,update on public.learning_sessions to authenticated;
revoke all on public.screening_sessions,public.lessons,public.learning_sessions,public.chunks_completed,public.quiz_results,public.practice_results,public.notification_reads from anon;

-- Prevent linking a result to a sibling's learning session, even in the same household.
create unique index if not exists learning_sessions_id_child_idx on public.learning_sessions(id,child_id);
do $$ begin
  if not exists(select 1 from pg_constraint where conname='chunks_session_child_fk' and conrelid='public.chunks_completed'::regclass) then
    alter table public.chunks_completed add constraint chunks_session_child_fk foreign key(session_id,child_id) references public.learning_sessions(id,child_id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conname='quiz_session_child_fk' and conrelid='public.quiz_results'::regclass) then
    alter table public.quiz_results add constraint quiz_session_child_fk foreign key(session_id,child_id) references public.learning_sessions(id,child_id) on delete cascade;
  end if;
end $$;
create index if not exists chunks_completed_session_idx on public.chunks_completed(session_id);
create index if not exists quiz_results_session_idx on public.quiz_results(session_id);
create index if not exists learning_sessions_lesson_idx on public.learning_sessions(lesson_id);
create index if not exists notification_log_child_idx on public.notification_log(child_id);

-- Constrain legacy values without changing application-compatible columns.
do $$ begin
  if not exists(select 1 from pg_constraint where conname='screening_scores_range' and conrelid='public.screening_sessions'::regclass) then
    alter table public.screening_sessions add constraint screening_scores_range check (phonological_score between 0 and 1 and rapid_naming_score between 0 and 1 and spelling_score between 0 and 1 and digit_span_score between 0 and 1 and risk_score between 0 and 1);
  end if;
  if not exists(select 1 from pg_constraint where conname='learning_session_valid' and conrelid='public.learning_sessions'::regclass) then
    alter table public.learning_sessions add constraint learning_session_valid check (xp>=0 and (ended_at is null or ended_at>=started_at));
  end if;
  if not exists(select 1 from pg_constraint where conname='practice_counts_valid' and conrelid='public.practice_results'::regclass) then
    alter table public.practice_results add constraint practice_counts_valid check (syllables_total>=0 and syllables_correct between 0 and syllables_total and retries>=0);
  end if;
end $$;

-- Supabase Storage: private bucket, approved illustrations readable by signed-in families.
-- Guard allows the same migration to run in the schema-only PostgreSQL test harness.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values('eja-learning-images','eja-learning-images',false,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
    execute 'drop policy if exists "read approved eja illustrations" on storage.objects';
    execute $policy$create policy "read approved eja illustrations" on storage.objects for select to authenticated
      using(bucket_id='eja-learning-images' and exists(select 1 from public.image_cache i where i.storage_path=name and i.approved))$policy$;
  end if;
end $$;
