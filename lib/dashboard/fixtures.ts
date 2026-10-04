import { assessRisk, type ScreeningScores } from "@/lib/screening/scoring";
import type { ChildData, LearningSessionRecord, PracticeRecord, QuizRecord, ScreeningRecord } from "./types";

// Data contoh untuk mode demo (Supabase belum dikonfigurasi). Dihitung relatif terhadap `now` supaya grafik selalu terisi.
// Tiga profil sengaja mewakili tiga keadaan: eskalasi (Rizky), Risiko Rendah + tidak aktif (Nadia), belum skrining (Bima).

const DAY = 86_400_000;
const L = {
  half: { id: "l-half", subject: "Matematika", unit: "Pecahan", title: "Mengenal setengah" },
  compare: { id: "l-compare", subject: "Matematika", unit: "Pecahan", title: "Membandingkan pecahan" },
  plant: { id: "l-plant", subject: "IPAS", unit: "Makhluk hidup", title: "Bagian tumbuhan" },
};

function screening(id: string, childId: string, scores: ScreeningScores, completedAt: number, over: Partial<ScreeningRecord> = {}): ScreeningRecord {
  const a = assessRisk(scores);
  return { id, childId, scores, riskScore: a.riskScore, riskLevel: a.riskLevel, completedAt: new Date(completedAt).toISOString(), isValid: true, invalidReason: null, ...over };
}

export function buildDemoData(now: number): ChildData[] {
  const at = (daysAgo: number, hourWib = 16) => {
    // Tanggal diambil menurut WIB (UTC+7), dan tidak pernah di masa depan.
    const d = new Date(now + 7 * 3_600_000 - daysAgo * DAY);
    return Math.min(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hourWib - 7, 0, 0), now - 30 * 60_000);
  };

  // --- Rizky: sudah skrining dua kali (membaik), aktif belajar, akurasi kuis menurun minggu ini ---
  const rizkyId = "demo-rizky";
  const rizkySessions: LearningSessionRecord[] = [];
  const rizkyQuizzes: QuizRecord[] = [];
  for (let d = 0; d <= 20; d++) {
    if (d % 4 === 3) continue;
    const lesson = [L.half, L.compare, L.plant][d % 3];
    const start = at(d);
    const sid = `rs-${d}`;
    rizkySessions.push({ id: sid, childId: rizkyId, lesson, startedAt: new Date(start).toISOString(), endedAt: new Date(start + (8 + (d % 7)) * 60_000).toISOString(), xp: 10 });
    for (let q = 1; q <= 5; q++) {
      // "Membandingkan pecahan" selalu sulit; pelajaran lain menurun di minggu ini.
      const correct = lesson.id === L.compare.id ? q <= 2 : d < 7 ? q <= 3 : q !== 5;
      rizkyQuizzes.push({ sessionId: sid, childId: rizkyId, isCorrect: correct, attempt: 1, answeredAt: new Date(start + q * 60_000).toISOString() });
    }
  }
  const rizkyPractices: PracticeRecord[] = [
    { childId: rizkyId, kind: "write", target: "bola", accuracy: 0.82, syllablesTotal: 0, syllablesCorrect: 0, retries: 0, createdAt: new Date(at(2)).toISOString() },
    { childId: rizkyId, kind: "write", target: "meja", accuracy: 0.64, syllablesTotal: 0, syllablesCorrect: 0, retries: 1, createdAt: new Date(at(3)).toISOString() },
    { childId: rizkyId, kind: "speak", target: "me-nu-lis", accuracy: 0.5, syllablesTotal: 3, syllablesCorrect: 1, retries: 3, createdAt: new Date(at(1)).toISOString() },
    { childId: rizkyId, kind: "speak", target: "peng-an-tar", accuracy: 0.67, syllablesTotal: 3, syllablesCorrect: 2, retries: 2, createdAt: new Date(at(4)).toISOString() },
    { childId: rizkyId, kind: "speak", target: "pe-pa-ya", accuracy: 1, syllablesTotal: 3, syllablesCorrect: 3, retries: 0, createdAt: new Date(at(5)).toISOString() },
  ];

  // --- Nadia: Risiko Rendah, terakhir belajar 6 hari lalu ---
  const nadiaId = "demo-nadia";
  const nadiaSessions: LearningSessionRecord[] = [10, 8, 6].map((d, i) => ({
    id: `ns-${i}`,
    childId: nadiaId,
    lesson: L.plant,
    startedAt: new Date(at(d)).toISOString(),
    endedAt: new Date(at(d) + 12 * 60_000).toISOString(),
    xp: 10,
  }));
  const nadiaQuizzes: QuizRecord[] = nadiaSessions.flatMap((s, i) =>
    [1, 2, 3, 4, 5].map((q) => ({ sessionId: s.id, childId: nadiaId, isCorrect: q !== 5 || i === 2, attempt: 1, answeredAt: s.startedAt })),
  );

  return [
    {
      profile: { id: rizkyId, name: "Rizky", grade: 3, school: "SD Negeri 1 Contoh", avatar: null },
      screenings: [
        screening("rz-2", rizkyId, { phonological: 0.62, rapidNaming: 0.55, spelling: 0.6, digitSpan: 0.2 }, at(1)),
        screening("rz-1", rizkyId, { phonological: 0.5, rapidNaming: 0.45, spelling: 0.55, digitSpan: 0.2 }, at(60)),
      ],
      sessions: rizkySessions,
      quizzes: rizkyQuizzes,
      practices: rizkyPractices,
    },
    {
      profile: { id: nadiaId, name: "Nadia", grade: 5, school: "SD Negeri 1 Contoh", avatar: null },
      screenings: [screening("nd-1", nadiaId, { phonological: 0.9, rapidNaming: 0.8, spelling: 0.85, digitSpan: 0.7 }, at(12))],
      sessions: nadiaSessions,
      quizzes: nadiaQuizzes,
      practices: [],
    },
    {
      profile: { id: "demo-bima", name: "Bima", grade: 1, school: null, avatar: null },
      screenings: [],
      sessions: [],
      quizzes: [],
      practices: [],
    },
  ];
}
