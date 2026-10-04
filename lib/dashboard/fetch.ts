import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskLevel } from "@/lib/screening/scoring";
import type { ChildData, ChildProfile, LearningSessionRecord, PracticeRecord, QuizRecord, ScreeningRecord } from "./types";

// Tidak mengimpor next/headers: dipakai bersama oleh dasbor (klien sesi, RLS) dan cron email (klien service).

// Jendela data belajar: cukup untuk grafik 14 hari dan perbandingan tren mingguan.
export const LEARNING_WINDOW_DAYS = 56;
// Batas baris PostgREST (default 1000) cukup untuk 8 minggu; diurutkan terbaru dulu bila terpotong.
const ROW_LIMIT = 1000;

/** Kolom dipilih eksplisit: hash PIN tidak dapat dibaca klien (lihat grant kolom di 0000_children.sql). */
export const CHILD_COLUMNS = "id, name, grade, school, avatar";

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

export function toProfile(r: Row): ChildProfile {
  return { id: String(r.id), name: str(r.name) ?? "Anak", grade: num(r.grade), school: str(r.school), avatar: str(r.avatar) };
}

function toScreening(r: Row): ScreeningRecord {
  return {
    id: String(r.id),
    childId: String(r.child_id),
    scores: { phonological: Number(r.phonological_score), rapidNaming: Number(r.rapid_naming_score), spelling: Number(r.spelling_score), digitSpan: Number(r.digit_span_score) },
    riskScore: Number(r.risk_score),
    riskLevel: r.risk_level as RiskLevel,
    completedAt: String(r.completed_at),
    isValid: r.is_valid !== false,
    invalidReason: str(r.invalid_reason),
  };
}

function toSession(r: Row): LearningSessionRecord {
  // Relasi dapat datang sebagai objek atau larik tergantung inferensi PostgREST.
  const rel = Array.isArray(r.lessons) ? (r.lessons[0] as Row | undefined) : (r.lessons as Row | null);
  return {
    id: String(r.id),
    childId: String(r.child_id),
    lesson: { id: String(r.lesson_id), subject: str(rel?.subject) ?? "Pelajaran", unit: str(rel?.unit) ?? "", title: str(rel?.title) ?? "Pelajaran" },
    startedAt: String(r.started_at),
    endedAt: str(r.ended_at),
    xp: num(r.xp) ?? 0,
  };
}

/** Memuat skrining, sesi belajar, kuis, dan latihan untuk sekumpulan anak dengan klien Supabase yang diberikan. */
export async function fetchChildData(supabase: SupabaseClient, profiles: ChildProfile[], now: number): Promise<ChildData[]> {
  if (profiles.length === 0) return [];
  const ids = profiles.map((p) => p.id);
  const since = new Date(now - LEARNING_WINDOW_DAYS * 86_400_000).toISOString();

  const [scr, ses, quiz, prac] = await Promise.all([
    supabase.from("screening_sessions").select("*").in("child_id", ids).order("completed_at", { ascending: false }).limit(50 * ids.length),
    supabase.from("learning_sessions").select("id, child_id, lesson_id, started_at, ended_at, xp, lessons(subject, unit, title)").in("child_id", ids).gte("started_at", since).order("started_at", { ascending: false }).limit(ROW_LIMIT),
    supabase.from("quiz_results").select("session_id, child_id, is_correct, attempt, answered_at").in("child_id", ids).gte("answered_at", since).order("answered_at", { ascending: false }).limit(ROW_LIMIT),
    supabase.from("practice_results").select("*").in("child_id", ids).gte("created_at", since).order("created_at", { ascending: false }).limit(ROW_LIMIT),
  ]);

  // Tabel riwayat belajar baru ada setelah migration 0002; sebelum itu bagian ini tampil kosong, bukan error.
  const rows = (r: { data: unknown[] | null }) => (r.data ?? []) as Row[];

  return profiles.map((profile) => ({
    profile,
    screenings: rows(scr).filter((r) => r.child_id === profile.id).map(toScreening),
    sessions: rows(ses).filter((r) => r.child_id === profile.id).map(toSession),
    quizzes: rows(quiz)
      .filter((r) => r.child_id === profile.id)
      .map((r): QuizRecord => ({ sessionId: String(r.session_id), childId: profile.id, isCorrect: r.is_correct === true, attempt: num(r.attempt) ?? 1, answeredAt: String(r.answered_at) })),
    practices: rows(prac)
      .filter((r) => r.child_id === profile.id)
      .map(
        (r): PracticeRecord => ({
          childId: profile.id,
          kind: r.kind === "speak" ? "speak" : "write",
          target: String(r.target),
          accuracy: Number(r.accuracy),
          syllablesTotal: num(r.syllables_total) ?? 0,
          syllablesCorrect: num(r.syllables_correct) ?? 0,
          retries: num(r.retries) ?? 0,
          createdAt: String(r.created_at),
        }),
      ),
  }));
}
