import { describe, expect, it } from "vitest";
import {
  activityByDay,
  buildNotifications,
  dayKey,
  deriveChildStatus,
  learningStreak,
  practiceSummary,
  quizAccuracy,
  quizTrend,
  screeningsToday,
  startOfDayIso,
  weekKey,
  sessionMinutes,
  sessionsThisWeek,
  weakTopics,
} from "./metrics";
import type { ChildData, LearningSessionRecord, QuizRecord, ScreeningRecord } from "./types";

// 15 Oktober 2026, 10:00 WIB (03:00 UTC)
const NOW = Date.UTC(2026, 9, 15, 3, 0, 0);
const DAY = 86_400_000;
const ago = (days: number, hourUtc = 3) => new Date(Date.UTC(2026, 9, 15 - days, hourUtc, 0, 0)).toISOString();

const lesson = (id: string, title = id) => ({ id, subject: "Matematika", unit: "Pecahan", title });
const session = (id: string, daysAgo: number, lessonId = "L1", minutes = 10): LearningSessionRecord => ({
  id,
  childId: "c1",
  lesson: lesson(lessonId),
  startedAt: ago(daysAgo),
  endedAt: new Date(new Date(ago(daysAgo)).getTime() + minutes * 60_000).toISOString(),
  xp: 10,
});
const quiz = (sessionId: string, daysAgo: number, isCorrect: boolean, attempt = 1): QuizRecord => ({ sessionId, childId: "c1", isCorrect, attempt, answeredAt: ago(daysAgo) });
const screening = (over: Partial<ScreeningRecord> = {}): ScreeningRecord => ({
  id: "s1",
  childId: "c1",
  scores: { phonological: 0.8, rapidNaming: 0.8, spelling: 0.8, digitSpan: 0.8 },
  riskScore: 0.8,
  riskLevel: "low",
  completedAt: ago(1),
  isValid: true,
  invalidReason: null,
  ...over,
});
const child = (over: Partial<ChildData> = {}): ChildData => ({
  profile: { id: "c1", name: "Rizky", grade: 3, school: null, avatar: null },
  screenings: [],
  sessions: [],
  quizzes: [],
  practices: [],
  ...over,
});

describe("dayKey", () => {
  it("memakai hari WIB: 20:00 UTC sudah hari berikutnya di WIB", () => {
    expect(dayKey(Date.UTC(2026, 9, 14, 20, 0, 0))).toBe("2026-10-15");
    expect(dayKey(Date.UTC(2026, 9, 14, 16, 0, 0))).toBe("2026-10-14");
  });
});

describe("sessionMinutes", () => {
  it("null bila belum selesai, dibatasi 120 menit bila tab dibiarkan terbuka", () => {
    expect(sessionMinutes({ ...session("a", 0), endedAt: null })).toBeNull();
    expect(sessionMinutes(session("b", 0, "L1", 12))).toBe(12);
    expect(sessionMinutes(session("c", 0, "L1", 600))).toBe(120);
  });
});

describe("learningStreak", () => {
  it("menghitung hari berurutan sampai hari ini", () => {
    expect(learningStreak([session("a", 0), session("b", 1), session("c", 2)], NOW)).toBe(3);
  });
  it("hari ini belum belajar: rangkaian yang berakhir kemarin tetap dihitung", () => {
    expect(learningStreak([session("a", 1), session("b", 2)], NOW)).toBe(2);
  });
  it("terputus bila kemarin dan hari ini kosong", () => {
    expect(learningStreak([session("a", 2), session("b", 3)], NOW)).toBe(0);
  });
  it("dua sesi di hari yang sama dihitung satu hari", () => {
    expect(learningStreak([session("a", 0), session("b", 0), session("c", 1)], NOW)).toBe(2);
  });
});

describe("sessionsThisWeek & activityByDay", () => {
  it("hanya menghitung 7 hari terakhir", () => {
    expect(sessionsThisWeek([session("a", 0), session("b", 6), session("c", 8)], NOW)).toBe(2);
  });
  it("mengisi hari kosong dan mengurutkan dari terlama", () => {
    const days = activityByDay([session("a", 0, "L1", 10), session("b", 0, "L1", 5), session("c", 2)], NOW, 14);
    expect(days).toHaveLength(14);
    expect(days[13].sessions).toBe(2);
    expect(days[13].minutes).toBe(15);
    expect(days[12].sessions).toBe(0);
    expect(days[11].sessions).toBe(1);
  });
});

describe("kuis", () => {
  it("akurasi hanya dari percobaan pertama", () => {
    const qs = [quiz("s", 0, true), quiz("s", 0, false), quiz("s", 0, true, 2)];
    expect(quizAccuracy(qs)).toBeCloseTo(0.5);
    expect(quizAccuracy([])).toBeNull();
  });

  it("tren: turun 20 poin bila minggu ini 4/10 dan minggu lalu 6/10", () => {
    const recent = Array.from({ length: 10 }, (_, i) => quiz("s", 1, i < 4));
    const prev = Array.from({ length: 10 }, (_, i) => quiz("s", 9, i < 6));
    expect(quizTrend([...recent, ...prev], NOW).deltaPoints).toBe(-20);
  });

  it("tren null bila data terlalu sedikit (hindari notifikasi karena derau)", () => {
    expect(quizTrend([quiz("s", 1, false), quiz("s", 9, true)], NOW).deltaPoints).toBeNull();
  });

  it("topik lemah: akurasi < 60% dengan minimal 3 jawaban, urut paling sering salah", () => {
    const sessions = [session("s1", 1, "L1"), session("s2", 2, "L2"), session("s3", 3, "L3")];
    const qs = [
      ...[true, false, false, false].map((c) => quiz("s1", 1, c)), // L1: 1/4
      ...[true, false, false].map((c) => quiz("s2", 2, c)), // L2: 1/3
      ...[false, false].map((c) => quiz("s3", 3, c)), // L3: hanya 2 jawaban, diabaikan
    ];
    const weak = weakTopics(qs, sessions);
    expect(weak.map((w) => w.lessonId)).toEqual(["L1", "L2"]);
    expect(weak[0].wrong).toBe(3);
  });
});

describe("practiceSummary", () => {
  it("menghitung akurasi menulis, persen suku kata berhasil, dan kata yang sering diulang", () => {
    const base = { childId: "c1", createdAt: ago(1), syllablesTotal: 0, syllablesCorrect: 0, retries: 0 };
    const s = practiceSummary([
      { ...base, kind: "write", target: "bola", accuracy: 0.8 },
      { ...base, kind: "write", target: "meja", accuracy: 0.6 },
      { ...base, kind: "speak", target: "me-nu-lis", accuracy: 0.5, syllablesTotal: 3, syllablesCorrect: 1, retries: 3 },
      { ...base, kind: "speak", target: "pe-pa-ya", accuracy: 1, syllablesTotal: 3, syllablesCorrect: 3, retries: 0 },
    ]);
    expect(s.writeAccuracy).toBeCloseTo(0.7);
    expect(s.speakSyllableRate).toBeCloseTo(4 / 6);
    expect(s.repeatedWords).toEqual([{ word: "me-nu-lis", retries: 3 }]);
  });
  it("null bila belum ada latihan", () => {
    const s = practiceSummary([]);
    expect(s.writeAccuracy).toBeNull();
    expect(s.speakSyllableRate).toBeNull();
  });
});

describe("deriveChildStatus (Lampiran B.9)", () => {
  it("belum skrining, perlu diulang, sudah skrining, sedang belajar", () => {
    expect(deriveChildStatus({ screenings: [], sessions: [] })).toBe("not-screened");
    expect(deriveChildStatus({ screenings: [screening({ isValid: false })], sessions: [] })).toBe("needs-retest");
    expect(deriveChildStatus({ screenings: [screening()], sessions: [] })).toBe("screened");
    expect(deriveChildStatus({ screenings: [screening()], sessions: [session("a", 0)] })).toBe("learning");
  });
});

describe("buildNotifications (FR-56)", () => {
  it("hasil skrining baru dalam 7 hari memicu notifikasi dengan tautan ke laporan", () => {
    const n = buildNotifications(child({ screenings: [screening({ completedAt: ago(1) })] }), NOW);
    expect(n.map((x) => x.kind)).toEqual(["screening-complete"]);
    expect(n[0].href).toBe("/dashboard/child/c1/screening");
  });

  it("skrining lama (> 7 hari) tidak memicu notifikasi", () => {
    expect(buildNotifications(child({ screenings: [screening({ completedAt: ago(10) })] }), NOW).some((x) => x.kind === "screening-complete")).toBe(false);
  });

  it("sesi tidak valid memicu ajakan mengulang, bukan hasil", () => {
    const n = buildNotifications(child({ screenings: [screening({ isValid: false })] }), NOW);
    expect(n[0].kind).toBe("retest");
  });

  it("tidak aktif tepat 5 hari memicu, 4 hari tidak", () => {
    expect(buildNotifications(child({ sessions: [session("a", 5)] }), NOW).map((x) => x.kind)).toContain("inactive");
    expect(buildNotifications(child({ sessions: [session("a", 4)] }), NOW).map((x) => x.kind)).not.toContain("inactive");
  });

  it("teks tidak aktif mengikuti pedoman: faktual, tanpa membuat cemas", () => {
    const n = buildNotifications(child({ sessions: [session("a", 6)] }), NOW).find((x) => x.kind === "inactive");
    expect(n?.title).toBe("Rizky sudah 6 hari tidak membuka EJA");
  });

  it("akurasi turun >= 10 poin memicu notifikasi beserta topik yang sering salah", () => {
    const sessions = [session("s1", 1, "L1")];
    const recent = Array.from({ length: 10 }, (_, i) => quiz("s1", 1, i < 3));
    const prev = Array.from({ length: 10 }, (_, i) => quiz("s1", 9, i < 8));
    const n = buildNotifications(child({ sessions, quizzes: [...recent, ...prev] }), NOW).find((x) => x.kind === "quiz-drop");
    expect(n?.title).toContain("turun 50 poin");
    expect(n?.detail).toContain("L1");
  });

  it("anak tanpa aktivitas apa pun tidak menghasilkan notifikasi", () => {
    expect(buildNotifications(child(), NOW)).toEqual([]);
  });
});

describe("batas harian dan kunci waktu", () => {
  it("startOfDayIso = tengah malam WIB (17:00 UTC hari sebelumnya)", () => {
    expect(startOfDayIso(NOW)).toBe("2026-10-14T17:00:00.000Z");
  });

  it("screeningsToday menghitung sesi valid maupun tidak pada hari WIB yang sama", () => {
    const list = [screening({ completedAt: ago(0, 1) }), screening({ id: "s2", completedAt: ago(0, 2), isValid: false }), screening({ id: "s3", completedAt: ago(1) })];
    expect(screeningsToday(list, NOW)).toBe(2);
  });

  it("weekKey = Senin WIB pada minggu itu", () => {
    // 15 Okt 2026 adalah Kamis; Senin-nya 12 Okt.
    expect(weekKey(NOW)).toBe("2026-10-12");
    expect(weekKey(Date.UTC(2026, 9, 11, 10, 0, 0))).toBe("2026-10-05"); // Minggu 11 Okt -> Senin 5 Okt
  });

  it("id notifikasi stabil per peristiwa: sama untuk data sama, berbeda untuk skrining baru", () => {
    const a = buildNotifications(child({ screenings: [screening({ id: "s1" })] }), NOW)[0];
    const b = buildNotifications(child({ screenings: [screening({ id: "s1" })] }), NOW + 1000)[0];
    const c = buildNotifications(child({ screenings: [screening({ id: "s9" })] }), NOW)[0];
    expect(a.id).toBe(b.id);
    expect(a.id).not.toBe(c.id);
  });
});

void DAY;
