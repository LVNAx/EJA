-- Riwayat belajar untuk dasbor orang tua (proposal Bab 7, "Skema Basis Data").
-- Dibuat oleh modul Rekomendasi & Dasbor supaya dasbor bisa dibaca; Modul Belajar menulis ke tabel yang sama.
-- Pola RLS sama dengan 0001: orang tua hanya melihat/menulis data anaknya. Anak masuk di bawah sesi orang tua.
-- Aman dijalankan ulang.

-- Pastikan tabel children memenuhi kebutuhan RLS di bawah (lihat 0000_children.sql).
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'children' and column_name = 'parent_id') then
    raise exception 'public.children harus punya kolom parent_id (uuid, merujuk auth.users). Jalankan 0000_children.sql atau sesuaikan tabel dari modul Auth.';
  end if;
end $$;

-- Mutu sesi skrining (FR-18, BR-04): sesi tidak valid tidak menghasilkan status.
alter table public.screening_sessions
  add column if not exists is_valid boolean not null default true,
  add column if not exists invalid_reason text;

create index if not exists screening_sessions_child_completed_idx
  on public.screening_sessions (child_id, completed_at desc);

-- Pelajaran dari peta kurikulum. Hanya yang sudah disetujui peninjau yang terlihat (BR-08).
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 1 and 6),
  subject text not null,
  unit text not null,
  title text not null,
  content jsonb,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  xp int not null default 0
);

create table if not exists public.chunks_completed (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  chunk_index int not null,
  chunk_type text not null check (chunk_type in ('analogy','step','diagram','quiz')),
  duration_seconds int,
  completed_at timestamptz not null default now()
);

-- Satu baris per percobaan kuis. attempt = 1 untuk percobaan pertama (hanya itu yang dihitung ke akurasi).
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  chunk_index int not null,
  is_correct boolean not null,
  attempt int not null default 1 check (attempt >= 1),
  answer_ms int,
  answered_at timestamptz not null default now()
);

-- Latihan menulis dan berbicara (P1). accuracy 0..1; syllables_* hanya untuk latihan berbicara.
create table if not exists public.practice_results (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('write','speak')),
  target text not null,
  accuracy float not null check (accuracy between 0 and 1),
  syllables_total int not null default 0,
  syllables_correct int not null default 0,
  retries int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists learning_sessions_child_started_idx on public.learning_sessions (child_id, started_at desc);
create index if not exists quiz_results_child_answered_idx on public.quiz_results (child_id, answered_at desc);
create index if not exists chunks_completed_child_idx on public.chunks_completed (child_id, completed_at desc);
create index if not exists practice_results_child_created_idx on public.practice_results (child_id, created_at desc);

alter table public.lessons enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.chunks_completed enable row level security;
alter table public.quiz_results enable row level security;
alter table public.practice_results enable row level security;

drop policy if exists "authenticated reads approved lessons" on public.lessons;
create policy "authenticated reads approved lessons"
  on public.lessons for select to authenticated
  using (approved);

-- Pola yang sama untuk empat tabel milik anak: select + insert, dan update untuk learning_sessions (menutup sesi).
do $$
declare t text;
begin
  foreach t in array array['learning_sessions','chunks_completed','quiz_results','practice_results'] loop
    execute format('drop policy if exists "parent reads own children rows" on public.%I', t);
    execute format($p$create policy "parent reads own children rows" on public.%I for select
      using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()))$p$, t);
    execute format('drop policy if exists "parent inserts own children rows" on public.%I', t);
    execute format($p$create policy "parent inserts own children rows" on public.%I for insert
      with check (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()))$p$, t);
  end loop;
end $$;

drop policy if exists "parent updates own children sessions" on public.learning_sessions;
create policy "parent updates own children sessions"
  on public.learning_sessions for update
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));
