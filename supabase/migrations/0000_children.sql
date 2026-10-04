-- Profil anak (proposal Bab 7, FR-04/FR-05). Dibuat di sini karena tidak ada di repo.
-- Bila tabel public.children sudah dibuat modul Auth/Profil, `create table if not exists` tidak mengubahnya;
-- 0002 akan memeriksa bahwa kolom yang dibutuhkan ada.
-- Aman dijalankan ulang.

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  grade int not null check (grade between 1 and 6),
  school text check (school is null or char_length(school) <= 120),
  avatar text,
  -- Hash bcrypt, bukan PIN asli. Tidak dapat dibaca klien (lihat grant kolom di bawah).
  pin_hash text not null,
  pin_failed_count int not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists children_parent_idx on public.children (parent_id);

alter table public.children enable row level security;

drop policy if exists "parent reads own children" on public.children;
create policy "parent reads own children" on public.children for select using (parent_id = auth.uid());

drop policy if exists "parent inserts own children" on public.children;
create policy "parent inserts own children" on public.children for insert with check (parent_id = auth.uid());

drop policy if exists "parent updates own children" on public.children;
create policy "parent updates own children" on public.children for update using (parent_id = auth.uid()) with check (parent_id = auth.uid());

drop policy if exists "parent deletes own children" on public.children;
create policy "parent deletes own children" on public.children for delete using (parent_id = auth.uid());

-- Hash PIN dan penghitung percobaan tidak boleh sampai ke peramban. Verifikasi PIN dilakukan di server
-- dengan peran service (FR-05). Kolom lain tetap dapat dibaca orang tua.
revoke select on public.children from anon, authenticated;
grant select (id, parent_id, name, grade, school, avatar, created_at) on public.children to authenticated;
revoke update on public.children from anon, authenticated;
grant update (name, grade, school, avatar) on public.children to authenticated;
