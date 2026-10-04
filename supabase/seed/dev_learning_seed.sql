-- DATA CONTOH UNTUK DEVELOPMENT SAJA. Jangan dijalankan di database produksi.
-- Jalankan di SQL Editor Supabase (peran service, melewati RLS) SETELAH migration 0001 dan 0002.
-- Mengisi riwayat belajar untuk anak pertama di tabel children, supaya dasbor orang tua punya data untuk dilihat.
-- Pelajaran contoh bertanda approved = true; hapus sendiri setelah Modul Belajar punya konten asli.

do $$
declare
  v_child uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid;
  v_s uuid;
  d int;
begin
  select id into v_child from public.children order by id limit 1;
  if v_child is null then
    raise exception 'Belum ada baris di public.children. Buat profil anak dulu.';
  end if;

  insert into public.lessons (grade, subject, unit, title, approved) values
    (3, 'Matematika', 'Pecahan', 'Mengenal setengah', true),
    (3, 'Matematika', 'Pecahan', 'Membandingkan pecahan', true),
    (3, 'IPAS', 'Makhluk hidup', 'Bagian tumbuhan', true);

  select id into v_l1 from public.lessons where title = 'Mengenal setengah' order by created_at desc limit 1;
  select id into v_l2 from public.lessons where title = 'Membandingkan pecahan' order by created_at desc limit 1;
  select id into v_l3 from public.lessons where title = 'Bagian tumbuhan' order by created_at desc limit 1;

  -- Sesi belajar hampir tiap hari selama 3 minggu terakhir, dengan akurasi kuis yang menurun di minggu terakhir.
  for d in 0..20 loop
    continue when d % 4 = 3;
    insert into public.learning_sessions (child_id, lesson_id, started_at, ended_at, xp)
    values (
      v_child,
      case d % 3 when 0 then v_l1 when 1 then v_l2 else v_l3 end,
      now() - make_interval(days => d, mins => 30),
      now() - make_interval(days => d, mins => 30 - (8 + d % 7)),
      10
    ) returning id into v_s;

    insert into public.quiz_results (session_id, child_id, chunk_index, is_correct, attempt, answered_at)
    select v_s, v_child, g,
      -- "Membandingkan pecahan" selalu sulit; pelajaran lain menurun di minggu ini.
      (case when d % 3 = 1 then g <= 2 when d < 7 then g <= 3 else g <> 5 end),
      1, now() - make_interval(days => d, mins => 25)
    from generate_series(1, 5) g;
  end loop;

  insert into public.practice_results (child_id, kind, target, accuracy, syllables_total, syllables_correct, retries, created_at) values
    (v_child, 'write', 'bola', 0.82, 0, 0, 0, now() - interval '2 days'),
    (v_child, 'write', 'meja', 0.64, 0, 0, 1, now() - interval '3 days'),
    (v_child, 'speak', 'me-nu-lis', 0.5, 3, 1, 3, now() - interval '1 day'),
    (v_child, 'speak', 'peng-an-tar', 0.67, 3, 2, 2, now() - interval '4 days'),
    (v_child, 'speak', 'pe-pa-ya', 1, 3, 3, 0, now() - interval '5 days');
end $$;
