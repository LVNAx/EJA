-- Status baca notifikasi dasbor dan log pengiriman email (FR-56).
-- Notifikasi dihitung dari data saat halaman dibuka; di sini hanya disimpan apa yang sudah dibaca
-- dan email apa yang sudah dikirim. Aman dijalankan ulang.

create table if not exists public.notification_reads (
  parent_id uuid not null references auth.users(id) on delete cascade,
  -- Id peristiwa yang stabil, misalnya "screening:<id sesi>" atau "inactive:<id anak>:<tanggal terakhir aktif>".
  notification_id text not null check (char_length(notification_id) <= 200),
  read_at timestamptz not null default now(),
  primary key (parent_id, notification_id)
);

alter table public.notification_reads enable row level security;

drop policy if exists "parent reads own notification reads" on public.notification_reads;
create policy "parent reads own notification reads" on public.notification_reads for select using (parent_id = auth.uid());

drop policy if exists "parent inserts own notification reads" on public.notification_reads;
create policy "parent inserts own notification reads" on public.notification_reads for insert with check (parent_id = auth.uid());

-- Log email: hanya diakses peran service (cron). RLS aktif tanpa kebijakan = tidak terbaca klien.
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('screening-complete','retest','inactive','quiz-drop')),
  notification_id text not null,
  sent_at timestamptz not null default now()
);

create index if not exists notification_log_lookup_idx on public.notification_log (parent_id, child_id, kind, sent_at desc);
create unique index if not exists notification_log_once_idx on public.notification_log (parent_id, notification_id);

alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;
