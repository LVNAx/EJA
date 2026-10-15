import type { AppState, Session } from "../state/store";
import type { LearningEvidence } from "../state/evidence";

/** Demo model assumptions; these are not fitted or clinically validated parameters. */
export const MODEL_CONFIG = {
  priorSuccess: 1,
  priorFailure: 1,
  maxSessions: 20,
  minimumSessions: 3,
  writingTarget: 70,
  trendWindow: 3,
} as const;

export const SKILLS = [
  {
    id: "reading",
    label: "Membaca",
    path: "/latihan/membaca",
    target: "Ada bacaan yang terdeteksi sesuai dalam satu sesi mikrofon.",
    note: "Hasil mikrofon dipengaruhi perangkat dan lingkungan. Membaca tanpa mikrofon tetap dicatat, tetapi tidak menjadi hasil model.",
    support:
      "Dengarkan satu kata per suku kata, lalu baca bersama. Mikrofon boleh dilewati.",
  },
  {
    id: "writing",
    label: "Menulis",
    path: "/latihan/menulis",
    target:
      "Kecocokan bentuk terakhir dalam satu sesi mencapai 70% atau lebih.",
    note: "Nilai menulis mengukur kemiripan garis dengan contoh, belum menilai seluruh kemampuan menulis.",
    support:
      "Lihat contoh arah garis, lalu coba satu huruf atau angka bersama.",
  },
  {
    id: "fractions",
    label: "Pecahan",
    path: "/materi/pecahan-dasar",
    target: "Semua kuis pecahan dijawab tepat pada percobaan pertama.",
    note: "Materi ini memakai pertanyaan yang sama saat diulang; hasil belum menunjukkan penguasaan soal baru.",
    support:
      "Ulangi gambar kue yang dibagi sama besar, lalu coba kuis pecahan.",
  },
  {
    id: "multiplication",
    label: "Perkalian",
    path: "/materi/perkalian-kelompok",
    target: "Semua kuis perkalian dijawab tepat pada percobaan pertama.",
    note: "Materi ini memakai pertanyaan yang sama saat diulang; hasil belum menunjukkan penguasaan soal baru.",
    support:
      "Hitung benda di setiap kelompok bersama, lalu jumlahkan semuanya.",
  },
] as const;

export type SkillId = (typeof SKILLS)[number]["id"];
export type Observation = {
  sessionId: string;
  title: string;
  at: string;
  success: boolean;
  hints: number;
  audioPlays: number;
};
export type Trend = "insufficient" | "improving" | "mixed" | "steady";
export type SkillProgress = {
  skill: (typeof SKILLS)[number];
  history: Observation[];
  totalSessions: number;
  successes: number;
  alpha: number;
  beta: number;
  probability: number | null;
  interval: [number, number] | null;
  enoughData: boolean;
  trend: Trend;
};

function skillFor(session: Session): SkillId | null {
  if (session.kind === "reading" || session.kind === "writing")
    return session.kind;
  if (session.activityId === "pecahan-dasar") return "fractions";
  if (session.activityId === "perkalian-kelompok") return "multiplication";
  return null;
}

function sessionOutcome(
  session: Session,
  evidence?: LearningEvidence,
): boolean | null {
  if (!evidence) return null;
  if (session.kind === "reading") {
    return evidence.readingAttempts > 0 ? evidence.readingMatches > 0 : null;
  }
  if (session.kind === "writing") {
    const last = evidence.writingScores.at(-1);
    return last === undefined ? null : last >= MODEL_CONFIG.writingTarget;
  }
  const quizzes = Object.values(evidence.quizzes).filter(
    (quiz) => quiz.attempts > 0,
  );
  return quizzes.length ? quizzes.every((quiz) => quiz.firstTryCorrect) : null;
}

/** Beta CDF for positive integer shapes, using its exact binomial-tail identity. */
function betaCdf(x: number, alpha: number, beta: number): number {
  const n = alpha + beta - 1;
  let coefficient = 1;
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    if (k >= alpha) sum += coefficient * x ** k * (1 - x) ** (n - k);
    coefficient *= (n - k) / (k + 1);
  }
  return sum;
}

function betaQuantile(p: number, alpha: number, beta: number): number {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 45; i++) {
    const mid = (low + high) / 2;
    if (betaCdf(mid, alpha, beta) < p) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function sessionTrend(history: Observation[]): Trend {
  const width = MODEL_CONFIG.trendWindow;
  if (history.length < width * 2) return "insufficient";
  const previous = history
    .slice(-width * 2, -width)
    .filter((item) => item.success).length;
  const recent = history.slice(-width).filter((item) => item.success).length;
  if (recent > previous) return "improving";
  if (recent < previous) return "mixed";
  return "steady";
}

/**
 * Beta–Bernoulli posterior predictive model, rebuilt from saved observations.
 * One completed session = one Bernoulli outcome, avoiding duplicate updates on
 * renders/reloads and avoiding treating retries within a session as independent.
 * Each skill uses its latest 20 observed sessions. Help is never a failure.
 */
export function buildProgressModel(
  state: Pick<AppState, "sessions" | "evidence">,
) {
  const histories: Record<SkillId, Observation[]> = {
    reading: [],
    writing: [],
    fractions: [],
    multiplication: [],
  };
  let unassessedSessions = 0;
  const completed = Object.values(state.sessions)
    .filter(
      (session) =>
        session.completedAt && Number.isFinite(Date.parse(session.completedAt)),
    )
    .sort(
      (a, b) =>
        a.completedAt!.localeCompare(b.completedAt!) ||
        a.id.localeCompare(b.id),
    );
  for (const session of completed) {
    const skill = skillFor(session);
    if (!skill) continue;
    const evidence = state.evidence[session.id];
    const success = sessionOutcome(session, evidence);
    if (success === null) {
      unassessedSessions++;
      continue;
    }
    histories[skill].push({
      sessionId: session.id,
      title: session.title,
      at: session.completedAt!,
      success,
      hints: evidence?.hints ?? 0,
      audioPlays: evidence?.audioPlays ?? 0,
    });
  }
  const skills: SkillProgress[] = SKILLS.map((skill) => {
    const history = histories[skill.id].slice(-MODEL_CONFIG.maxSessions);
    const successes = history.filter((item) => item.success).length;
    const alpha = MODEL_CONFIG.priorSuccess + successes;
    const beta = MODEL_CONFIG.priorFailure + history.length - successes;
    return {
      skill,
      history,
      totalSessions: histories[skill.id].length,
      successes,
      alpha,
      beta,
      probability: history.length ? alpha / (alpha + beta) : null,
      interval: history.length
        ? [betaQuantile(0.05, alpha, beta), betaQuantile(0.95, alpha, beta)]
        : null,
      enoughData: history.length >= MODEL_CONFIG.minimumSessions,
      trend: sessionTrend(history),
    };
  });
  return {
    skills,
    unassessedSessions,
    assessedSessions: Object.values(histories).reduce(
      (sum, items) => sum + items.length,
      0,
    ),
  };
}

export function recommendPractice(skills: SkillProgress[]) {
  const observed = skills.filter((item) => item.probability !== null);
  const needsPractice = observed
    .filter((item) => item.enoughData && item.probability! < 0.65)
    .sort((a, b) => a.probability! - b.probability!)[0];
  const gathering = observed
    .filter((item) => !item.enoughData)
    .sort((a, b) => a.history.length - b.history.length)[0];
  const unseen = skills.find((item) => item.probability === null);
  const lowest = [...observed].sort(
    (a, b) => a.probability! - b.probability!,
  )[0];
  const chosen = needsPractice ?? gathering ?? unseen ?? lowest ?? skills[0];
  return {
    skill: chosen.skill,
    reason: needsPractice
      ? `Target belum tercapai pada ${chosen.history.length - chosen.successes} dari ${chosen.history.length} sesi terakhir. Kita bisa mengulang dengan bantuan.`
      : gathering
        ? `Baru ada ${chosen.history.length} sesi yang bisa diperiksa. Coba lagi bersama pendamping untuk mengenali polanya.`
        : unseen
          ? "Belum ada hasil yang bisa diperiksa untuk kegiatan ini. Coba satu latihan pendek bersama pendamping."
          : "Teruskan latihan singkat dengan contoh yang berbeda. Kamu boleh memilih kegiatan lain.",
  };
}

export const TREND_LABELS: Record<Trend, string> = {
  insufficient: "Perlu 6 sesi untuk membandingkan perubahan",
  improving: "Target lebih sering tercapai pada 3 sesi terakhir",
  mixed: "Target lebih jarang tercapai pada 3 sesi terakhir; coba dampingi",
  steady: "Jumlah sesi yang mencapai target belum berubah",
};
