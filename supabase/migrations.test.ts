import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Menjalankan SEMUA migration + seed di Postgres in-process (PGlite) dengan stub skema `auth` ala Supabase,
// lalu menguji RLS sebagai peran `authenticated`. Ini bukan Supabase sungguhan, tetapi membuktikan SQL valid,
// idempoten, dan kebijakan akses bekerja seperti yang dimaksud.

const dir = path.join(__dirname, "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const seed = readFileSync(path.join(__dirname, "seed", "dev_learning_seed.sql"), "utf8");

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const CA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

let db: PGlite;

async function as(user: string | null, sql: string) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ""}', false); set role authenticated;`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role;");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    insert into auth.users (id) values ('${A}'), ('${B}');
  `);
  for (const f of files) await db.exec(readFileSync(path.join(dir, f), "utf8"));
  await db.exec(`
    insert into public.children (id, parent_id, name, grade, pin_hash) values
      ('${CA}', '${A}', 'Rizky', 3, 'hash-a'), ('${CB}', '${B}', 'Nadia', 5, 'hash-b');
    insert into public.lessons (grade, subject, unit, title, approved) values (3, 'Matematika', 'Pecahan', 'Disetujui', true), (3, 'Matematika', 'Pecahan', 'Draf', false);
  `);
});

afterAll(async () => {
  await db.close();
});

describe("migration", () => {
  it("dapat dijalankan ulang tanpa galat (idempoten)", async () => {
    for (const f of files) await db.exec(readFileSync(path.join(dir, f), "utf8"));
  });

  it("seed dev berjalan dan mengisi riwayat belajar", async () => {
    await db.exec(seed);
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.learning_sessions");
    expect(r.rows[0].n).toBeGreaterThan(10);
    const q = await db.query<{ n: number }>("select count(*)::int as n from public.quiz_results");
    expect(q.rows[0].n).toBeGreaterThan(50);
  });

  it("0002 menolak tabel children tanpa parent_id dengan pesan jelas", async () => {
    const tmp = new PGlite();
    await tmp.exec("create schema auth; create table auth.users(id uuid primary key); create table public.children (id uuid primary key); create table public.screening_sessions (id uuid primary key);");
    await expect(tmp.exec(readFileSync(path.join(dir, "0002_learning_tracking.sql"), "utf8"))).rejects.toThrow(/parent_id/);
    await tmp.close();
  });
});

describe("RLS", () => {
  it("orang tua hanya melihat anaknya sendiri", async () => {
    const r = await as(A, "select id from public.children");
    expect(r.rows.map((x) => (x as { id: string }).id)).toEqual([CA]);
  });

  it("hash PIN tidak dapat dibaca klien, termasuk lewat select *", async () => {
    await expect(as(A, "select pin_hash from public.children")).rejects.toThrow(/permission denied/);
    await expect(as(A, "select * from public.children")).rejects.toThrow(/permission denied/);
    const ok = await as(A, "select id, name, grade, school, avatar from public.children");
    expect(ok.rows).toHaveLength(1);
  });

  it("tidak dapat menyisipkan anak atas nama orang tua lain", async () => {
    await expect(as(A, `insert into public.children (parent_id, name, grade, pin_hash) values ('${B}', 'X', 1, 'h')`)).rejects.toThrow(/row-level security/);
    await as(A, `insert into public.children (parent_id, name, grade, pin_hash) values ('${A}', 'Adik', 1, 'h')`);
  });

  it("tidak dapat mengubah pin_hash dan parent_id", async () => {
    await expect(as(A, `update public.children set pin_hash = 'x' where id = '${CA}'`)).rejects.toThrow(/permission denied/);
    await expect(as(A, `update public.children set parent_id = '${B}' where id = '${CA}'`)).rejects.toThrow(/permission denied/);
    await as(A, `update public.children set school = 'SD 1' where id = '${CA}'`);
  });

  it("skrining: hanya milik anak sendiri, baik baca maupun tulis", async () => {
    const ins = (child: string) => `insert into public.screening_sessions (child_id, phonological_score, rapid_naming_score, spelling_score, digit_span_score, risk_score, risk_level, is_valid) values ('${child}', .5, .5, .5, .5, .5, 'moderate', true)`;
    await as(A, ins(CA));
    await expect(as(A, ins(CB))).rejects.toThrow(/row-level security/);
    await as(B, ins(CB));
    const r = await as(A, "select child_id from public.screening_sessions");
    expect(r.rows.every((x) => (x as { child_id: string }).child_id === CA)).toBe(true);
  });

  it("is_valid default true dan risk_level dibatasi", async () => {
    const r = await as(A, `select is_valid from public.screening_sessions where child_id = '${CA}' limit 1`);
    expect((r.rows[0] as { is_valid: boolean }).is_valid).toBe(true);
    await expect(as(A, `insert into public.screening_sessions (child_id, phonological_score, rapid_naming_score, spelling_score, digit_span_score, risk_score, risk_level) values ('${CA}', 1, 1, 1, 1, 1, 'severe')`)).rejects.toThrow(/check/);
  });

  it("pelajaran yang belum disetujui tidak terlihat (BR-08)", async () => {
    const r = await as(A, "select title from public.lessons");
    expect(r.rows.map((x) => (x as { title: string }).title)).not.toContain("Draf");
    expect(r.rows.map((x) => (x as { title: string }).title)).toContain("Disetujui");
  });

  it("riwayat belajar anak lain tidak terbaca", async () => {
    const lesson = await db.query<{ id: string }>("select id from public.lessons where approved limit 1");
    const lid = lesson.rows[0].id;
    await as(B, `insert into public.learning_sessions (child_id, lesson_id) values ('${CB}', '${lid}')`);
    await expect(as(A, `insert into public.learning_sessions (child_id, lesson_id) values ('${CB}', '${lid}')`)).rejects.toThrow(/row-level security/);
    const r = await as(A, "select distinct child_id from public.learning_sessions");
    expect(r.rows.map((x) => (x as { child_id: string }).child_id)).toEqual([CA]);
  });

  it("kuis dan latihan: tulis hanya untuk anak sendiri; accuracy dibatasi 0..1", async () => {
    await expect(as(A, `insert into public.practice_results (child_id, kind, target, accuracy) values ('${CA}', 'write', 'bola', 1.5)`)).rejects.toThrow(/check/);
    await as(A, `insert into public.practice_results (child_id, kind, target, accuracy) values ('${CA}', 'write', 'bola', 0.8)`);
    await expect(as(A, `insert into public.practice_results (child_id, kind, target, accuracy) values ('${CB}', 'write', 'bola', 0.8)`)).rejects.toThrow(/row-level security/);
  });

  it("status baca notifikasi: milik sendiri saja", async () => {
    await as(A, `insert into public.notification_reads (parent_id, notification_id) values ('${A}', 'screening:1')`);
    await expect(as(A, `insert into public.notification_reads (parent_id, notification_id) values ('${B}', 'screening:1')`)).rejects.toThrow(/row-level security/);
    await as(B, `insert into public.notification_reads (parent_id, notification_id) values ('${B}', 'screening:2')`);
    const r = await as(A, "select notification_id from public.notification_reads");
    expect(r.rows).toHaveLength(1);
  });

  it("log email tidak dapat diakses klien sama sekali", async () => {
    await expect(as(A, "select * from public.notification_log")).rejects.toThrow(/permission denied/);
  });

  it("profil orang tua dan progres hanya terbaca pemilik", async () => {
    const profiles = await as(A, "select id from public.parent_profiles");
    expect(profiles.rows).toEqual([{ id: A }]);
    await as(A, `insert into public.child_learning_progress(child_id,total_xp) values ('${CA}',15)`);
    expect((await as(B, "select * from public.child_learning_progress")).rows).toHaveLength(0);
    await expect(as(B, `insert into public.child_learning_progress(child_id) values ('${CA}')`)).rejects.toThrow(/row-level security/);
  });

  it("tidak dapat memasukkan penghitung PIN lewat Data API", async () => {
    await expect(as(A, `insert into public.children(parent_id,name,grade,pin_hash,pin_failed_count) values ('${A}','X',1,'hash',0)`)).rejects.toThrow(/permission denied/);
  });

  it("kuis tidak dapat dipasangkan ke sesi milik profil lain", async () => {
    const session = await db.query<{id:string}>(`select id from public.learning_sessions where child_id='${CB}' limit 1`);
    await expect(as(A, `insert into public.quiz_results(session_id,child_id,chunk_index,is_correct) values ('${session.rows[0].id}','${CA}',0,true)`)).rejects.toThrow(/foreign key/);
  });

  it("menghapus anak menghapus seluruh datanya (BR-09)", async () => {
    await db.exec(`delete from public.children where id = '${CA}'`);
    for (const t of ["screening_sessions", "learning_sessions", "quiz_results", "practice_results", "chunks_completed"]) {
      const r = await db.query<{ n: number }>(`select count(*)::int as n from public.${t} where child_id = '${CA}'`);
      expect(r.rows[0].n, t).toBe(0);
    }
  });
});
