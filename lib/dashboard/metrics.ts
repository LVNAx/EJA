import { ROUTES } from "@/lib/routes";
import type { ChildData, ChildStatus, LearningSessionRecord, ParentNotification, PracticeRecord, QuizRecord, ScreeningRecord } from "./types";

const DAY_MS = 86_400_000;
// Hari dihitung menurut WIB (UTC+7). Server berjalan di UTC, jadi tanpa ini sesi malam jatuh ke hari berikutnya.
const WIB_OFFSET_MS = 7 * 3_600_000;

/** Aturan ambang notifikasi (PRD FR-56). */
export const INACTIVE_DAYS = 5;
export const QUIZ_DROP_POINTS = 10;
export const QUIZ_MIN_ANSWERS = 5;
export const WEAK_TOPIC_BELOW = 0.6;
export const WEAK_TOPIC_MIN_ANSWERS = 3;
/** Sesi yang tabnya dibiarkan terbuka tidak boleh membengkakkan durasi. */
const MAX_SESSION_MINUTES = 120;

const ms = (iso: string) => new Date(iso).getTime();

export function dayKey(iso: string | number): string {
  const t = typeof iso === "number" ? iso : ms(iso);
  return new Date(t + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Awal hari ini menurut WIB sebagai ISO UTC, untuk menghitung batas sesi harian. */
export function startOfDayIso(now: number): string {
  return new Date(`${dayKey(now)}T00:00:00+07:00`).toISOString();
}

/** Jumlah sesi skrining yang selesai hari ini (WIB), valid maupun tidak. */
export function screeningsToday(screenings: Pick<ScreeningRecord, "completedAt">[], now: number): number {
  const today = dayKey(now);
  return screenings.filter((s) => dayKey(s.completedAt) === today).length;
}

/** Awal minggu (Senin, WIB) sebagai kunci tanggal, supaya notifikasi tren hanya muncul sekali per minggu. */
export function weekKey(now: number): string {
  const wibDow = new Date(now + WIB_OFFSET_MS).getUTCDay(); // 0 = Minggu
  return dayKey(now - ((wibDow + 6) % 7) * DAY_MS);
}

export function sessionMinutes(s: LearningSessionRecord): number | null {
  if (!s.endedAt) return null;
  const min = (ms(s.endedAt) - ms(s.startedAt)) / 60_000;
  if (!Number.isFinite(min) || min < 0) return null;
  return Math.min(min, MAX_SESSION_MINUTES);
}

export function latestValidScreening(screenings: ScreeningRecord[]): ScreeningRecord | null {
  return screenings.filter((s) => s.isValid).sort((a, b) => ms(b.completedAt) - ms(a.completedAt))[0] ?? null;
}

export function latestScreening(screenings: ScreeningRecord[]): ScreeningRecord | null {
  return [...screenings].sort((a, b) => ms(b.completedAt) - ms(a.completedAt))[0] ?? null;
}

/** Sesi valid sebelum `current`, untuk perbandingan di radar. */
export function previousValidScreening(screenings: ScreeningRecord[], current: ScreeningRecord): ScreeningRecord | null {
  return (
    screenings
      .filter((s) => s.isValid && s.id !== current.id && ms(s.completedAt) < ms(current.completedAt))
      .sort((a, b) => ms(b.completedAt) - ms(a.completedAt))[0] ?? null
  );
}

export function deriveChildStatus(d: Pick<ChildData, "screenings" | "sessions">): ChildStatus {
  if (d.sessions.length > 0) return "learning";
  const latest = latestScreening(d.screenings);
  if (!latest) return "not-screened";
  return latest.isValid ? "screened" : "needs-retest";
}

/** Sesi belajar yang dimulai dalam 7 hari terakhir. */
export function sessionsThisWeek(sessions: LearningSessionRecord[], now: number): number {
  return sessions.filter((s) => now - ms(s.startedAt) <= 7 * DAY_MS && ms(s.startedAt) <= now).length;
}

/**
 * Hari beruntun. Bila hari ini belum belajar, rangkaian yang berakhir kemarin masih dihitung
 * (anak belum kehilangan rangkaiannya sebelum hari berakhir).
 */
export function learningStreak(sessions: LearningSessionRecord[], now: number): number {
  const days = new Set(sessions.map((s) => dayKey(s.startedAt)));
  let cursor = now;
  if (!days.has(dayKey(cursor))) cursor -= DAY_MS;
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

export interface ActivityDay {
  day: string;
  sessions: number;
  minutes: number;
}

/** Frekuensi belajar `days` hari terakhir, termasuk hari kosong, urut dari yang terlama. */
export function activityByDay(sessions: LearningSessionRecord[], now: number, days = 14): ActivityDay[] {
  const buckets = new Map<string, ActivityDay>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(now - i * DAY_MS);
    buckets.set(day, { day, sessions: 0, minutes: 0 });
  }
  for (const s of sessions) {
    const b = buckets.get(dayKey(s.startedAt));
    if (!b) continue;
    b.sessions += 1;
    b.minutes += sessionMinutes(s) ?? 0;
  }
  return Array.from(buckets.values());
}

export function totalMinutes(sessions: LearningSessionRecord[]): number {
  return Math.round(sessions.reduce((sum, s) => sum + (sessionMinutes(s) ?? 0), 0));
}

export function lastActivityAt(d: Pick<ChildData, "screenings" | "sessions">): string | null {
  const times = [...d.sessions.map((s) => s.startedAt), ...d.screenings.map((s) => s.completedAt)];
  if (times.length === 0) return null;
  return times.reduce((a, b) => (ms(a) > ms(b) ? a : b));
}

export function daysSince(iso: string, now: number): number {
  return Math.floor((ms(dayKey(now)) - ms(dayKey(iso))) / DAY_MS);
}

/** Akurasi kuis = persentase benar pada percobaan pertama, 0..1. null bila belum ada data. */
export function quizAccuracy(quizzes: QuizRecord[]): number | null {
  const first = quizzes.filter((q) => q.attempt === 1);
  if (first.length === 0) return null;
  return first.filter((q) => q.isCorrect).length / first.length;
}

export interface QuizSessionPoint {
  sessionId: string;
  startedAt: string;
  title: string;
  accuracy: number;
  answered: number;
}

export function quizBySession(quizzes: QuizRecord[], sessions: LearningSessionRecord[]): QuizSessionPoint[] {
  const byId = new Map(sessions.map((s) => [s.id, s]));
  const grouped = new Map<string, QuizRecord[]>();
  for (const q of quizzes) grouped.set(q.sessionId, [...(grouped.get(q.sessionId) ?? []), q]);
  const points: QuizSessionPoint[] = [];
  grouped.forEach((qs, sessionId) => {
    const s = byId.get(sessionId);
    const acc = quizAccuracy(qs);
    if (!s || acc === null) return;
    points.push({ sessionId, startedAt: s.startedAt, title: s.lesson.title, accuracy: acc, answered: qs.filter((q) => q.attempt === 1).length });
  });
  return points.sort((a, b) => ms(a.startedAt) - ms(b.startedAt));
}

export interface QuizTrend {
  recent: number | null;
  previous: number | null;
  /** Selisih poin persen (recent - previous). null bila salah satu jendela kurang data. */
  deltaPoints: number | null;
}

/** Bandingkan 7 hari terakhir dengan 7 hari sebelumnya. */
export function quizTrend(quizzes: QuizRecord[], now: number): QuizTrend {
  const inWindow = (from: number, to: number) => quizzes.filter((q) => q.attempt === 1 && ms(q.answeredAt) > now - to * DAY_MS && ms(q.answeredAt) <= now - from * DAY_MS);
  const recent = inWindow(0, 7);
  const previous = inWindow(7, 14);
  const enough = recent.length >= QUIZ_MIN_ANSWERS && previous.length >= QUIZ_MIN_ANSWERS;
  const r = quizAccuracy(recent);
  const p = quizAccuracy(previous);
  return { recent: r, previous: p, deltaPoints: enough && r !== null && p !== null ? Math.round((r - p) * 100) : null };
}

export interface WeakTopic {
  lessonId: string;
  title: string;
  subject: string;
  unit: string;
  wrong: number;
  answered: number;
  accuracy: number;
}

/** Topik dengan akurasi rendah pada percobaan pertama, diurutkan dari yang paling sering salah. */
export function weakTopics(quizzes: QuizRecord[], sessions: LearningSessionRecord[], limit = 5): WeakTopic[] {
  const lessonBySession = new Map(sessions.map((s) => [s.id, s.lesson]));
  const agg = new Map<string, WeakTopic>();
  for (const q of quizzes) {
    if (q.attempt !== 1) continue;
    const lesson = lessonBySession.get(q.sessionId);
    if (!lesson) continue;
    const cur = agg.get(lesson.id) ?? { lessonId: lesson.id, title: lesson.title, subject: lesson.subject, unit: lesson.unit, wrong: 0, answered: 0, accuracy: 0 };
    cur.answered += 1;
    if (!q.isCorrect) cur.wrong += 1;
    agg.set(lesson.id, cur);
  }
  return Array.from(agg.values())
    .map((t) => ({ ...t, accuracy: 1 - t.wrong / t.answered }))
    .filter((t) => t.answered >= WEAK_TOPIC_MIN_ANSWERS && t.accuracy < WEAK_TOPIC_BELOW)
    .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy)
    .slice(0, limit);
}

export interface TopicLearned {
  lessonId: string;
  title: string;
  subject: string;
  unit: string;
  sessions: number;
  minutes: number;
  lastAt: string;
}

export function topicsLearned(sessions: LearningSessionRecord[]): TopicLearned[] {
  const agg = new Map<string, TopicLearned>();
  for (const s of sessions) {
    const cur = agg.get(s.lesson.id) ?? { lessonId: s.lesson.id, title: s.lesson.title, subject: s.lesson.subject, unit: s.lesson.unit, sessions: 0, minutes: 0, lastAt: s.startedAt };
    cur.sessions += 1;
    cur.minutes += sessionMinutes(s) ?? 0;
    if (ms(s.startedAt) > ms(cur.lastAt)) cur.lastAt = s.startedAt;
    agg.set(s.lesson.id, cur);
  }
  return Array.from(agg.values()).sort((a, b) => ms(b.lastAt) - ms(a.lastAt));
}

export interface PracticeSummary {
  writeAccuracy: number | null;
  writeCount: number;
  speakSyllableRate: number | null;
  speakCount: number;
  /** Kata yang paling sering diulang: indikator bunyi yang lemah. */
  repeatedWords: { word: string; retries: number }[];
}

export function practiceSummary(practices: PracticeRecord[]): PracticeSummary {
  const writes = practices.filter((p) => p.kind === "write");
  const speaks = practices.filter((p) => p.kind === "speak");
  const syl = speaks.reduce((a, p) => ({ total: a.total + p.syllablesTotal, ok: a.ok + p.syllablesCorrect }), { total: 0, ok: 0 });

  const retries = new Map<string, number>();
  for (const p of practices) if (p.retries > 0) retries.set(p.target, (retries.get(p.target) ?? 0) + p.retries);

  return {
    writeAccuracy: writes.length ? writes.reduce((s, p) => s + p.accuracy, 0) / writes.length : null,
    writeCount: writes.length,
    speakSyllableRate: syl.total > 0 ? syl.ok / syl.total : null,
    speakCount: speaks.length,
    repeatedWords: Array.from(retries, ([word, n]) => ({ word, retries: n }))
      .sort((a, b) => b.retries - a.retries)
      .slice(0, 5),
  };
}

const NEW_SCREENING_WINDOW_DAYS = 7;

/** Notifikasi dihitung saat dibuka; belum ada status dibaca atau email (FR-56 sebagian). */
export function buildNotifications(d: ChildData, now: number): ParentNotification[] {
  const out: ParentNotification[] = [];
  const name = d.profile.name;
  const id = d.profile.id;

  const latest = latestScreening(d.screenings);
  if (latest && daysSince(latest.completedAt, now) <= NEW_SCREENING_WINDOW_DAYS) {
    if (latest.isValid) {
      out.push({ id: `screening:${latest.id}`, childId: id, kind: "screening-complete", title: `Hasil skrining ${name} sudah tersedia`, detail: "Lihat hasil, penjelasan, dan saran tindak lanjutnya.", href: ROUTES.childScreeningReport(id) });
    } else {
      out.push({ id: `retest:${latest.id}`, childId: id, kind: "retest", title: `Skrining ${name} perlu diulang`, detail: latest.invalidReason ?? "Sesi tidak selesai atau jawabannya terlalu cepat sehingga belum bisa dinilai.", href: ROUTES.childScreeningReport(id) });
    }
  }

  const last = lastActivityAt(d);
  if (last) {
    const idle = daysSince(last, now);
    if (idle >= INACTIVE_DAYS) out.push({ id: `inactive:${id}:${dayKey(last)}`, childId: id, kind: "inactive", title: `${name} sudah ${idle} hari tidak membuka EJA`, href: ROUTES.childDashboard(id) });
  }

  const trend = quizTrend(d.quizzes, now);
  if (trend.deltaPoints !== null && trend.deltaPoints <= -QUIZ_DROP_POINTS) {
    const topics = weakTopics(d.quizzes, d.sessions, 2).map((t) => t.title);
    out.push({
      id: `quiz-drop:${id}:${weekKey(now)}`,
      childId: id,
      kind: "quiz-drop",
      title: `Akurasi kuis ${name} turun ${Math.abs(trend.deltaPoints)} poin dibanding minggu lalu`,
      detail: topics.length ? `Topik yang sering salah: ${topics.join(", ")}.` : undefined,
      href: ROUTES.childDashboard(id),
    });
  }

  return out;
}
