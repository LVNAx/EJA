import { z } from "zod";
import { GAZE_LIMITS, type ValidationPoint } from "./gaze-model";
import type { GazeSample } from "./reading-summary";

export const STUDY_PASSAGES = [
  {
    id: "buku",
    title: "Buku Lani",
    guided: false,
    lines: [
      "Lani membawa buku merah.",
      "Ia membaca bersama Raka.",
      "Buku itu bercerita tentang kucing.",
    ],
    questions: [
      {
        prompt: "Apa warna buku Lani?",
        options: ["Biru", "Merah", "Kuning"],
        correct: 1,
        region: 0,
      },
      {
        prompt: "Lani membaca bersama siapa?",
        options: ["Raka", "Sari", "Bimo"],
        correct: 0,
        region: 1,
      },
    ],
  },
  {
    id: "bola",
    title: "Bola Bimo",
    guided: true,
    lines: [
      "Bimo membawa bola biru.",
      "Ia bermain bersama Sari.",
      "Mereka bermain di halaman rumah.",
    ],
    questions: [
      {
        prompt: "Apa warna bola Bimo?",
        options: ["Merah", "Kuning", "Biru"],
        correct: 2,
        region: 0,
      },
      {
        prompt: "Bimo bermain bersama siapa?",
        options: ["Lani", "Sari", "Raka"],
        correct: 1,
        region: 1,
      },
    ],
  },
] as const;

export type ReadingRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export const STUDY_LIMITS = {
  stableMs: 400,
  transitionGapMs: 500,
  minimumMapped: 0.4,
} as const;
export type RegionValidation = {
  usable: boolean;
  errorX: number;
  errorY: number;
  reason: string;
};

/** Held-out targets use the actual passage rectangles, not a generic screen grid. */
export function validateReadingRegions(
  checks: ValidationPoint[],
  regions: ReadingRegion[],
): RegionValidation {
  const errors = checks.flatMap((c) =>
    c.predictions.map((p) => ({
      x: Math.abs(p.x - c.target.x),
      y: Math.abs(p.y - c.target.y),
    })),
  );
  const q90 = (xs: number[]) =>
    xs.sort((a, b) => a - b)[Math.max(0, Math.ceil(xs.length * 0.9) - 1)] ??
    Infinity;
  const errorX = q90(errors.map((e) => e.x)),
    errorY = q90(errors.map((e) => e.y));
  const targetsValid =
    regions.length === 3 &&
    regions.every(
      (r, i) =>
        r.width > 0 &&
        r.height > 0 &&
        r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.width <= 1.001 &&
        r.y + r.height <= 1.001 &&
        (!i || r.y > regions[i - 1].y + regions[i - 1].height),
    );
  const enough =
    checks.length === 6 &&
    checks.every((c) => c.predictions.length >= GAZE_LIMITS.minPointSamples);
  const perTarget = checks.every((c, i) => {
    const r = regions[Math.floor(i / 2)];
    if (!r) return false;
    return (
      c.predictions.filter(
        (p) =>
          p.x >= r.x &&
          p.x <= r.x + r.width &&
          p.y >= r.y &&
          p.y <= r.y + r.height,
      ).length >=
      c.predictions.length * 0.9
    );
  });
  const usable =
    targetsValid &&
    enough &&
    perTarget &&
    Number.isFinite(errorX) &&
    Number.isFinite(errorY) &&
    errorY < Math.min(...regions.map((r) => r.height)) / 3 &&
    errorX < Math.min(...regions.map((r) => r.width)) / 4;
  return {
    usable,
    errorX: Number.isFinite(errorX) ? errorX : 1,
    errorY: Number.isFinite(errorY) ? errorY : 1,
    reason: usable
      ? "Pengecekan dapat membedakan tiga bagian bacaan."
      : "Perkiraan belum cukup tepat untuk membedakan bagian bacaan. Jawaban tetap bisa dinilai.",
  };
}

const boundedMs = z.number().finite().min(0).max(600_000);
export const observationSchema = z
  .object({
    durationMs: boundedMs,
    trackedMs: boundedMs,
    mappedMs: boundedMs,
    regionMs: z.array(boundedMs).length(3),
    visits: z.array(z.number().int().min(0).max(1000)).length(3),
    returns: z.number().int().min(0).max(1000),
    usable: z.boolean(),
    reason: z.string().max(300),
    calibrated: z.boolean(),
    interrupted: z.boolean(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.trackedMs > v.durationMs + 0.01 ||
      v.mappedMs > v.trackedMs + 0.01 ||
      Math.abs(v.regionMs.reduce((s, x) => s + x, 0) - v.mappedMs) > 0.01 ||
      (!v.usable &&
        (v.mappedMs > 0 || v.returns > 0 || v.visits.some((x) => x > 0)))
    )
      ctx.addIssue({
        code: "custom",
        message: "Ringkasan pengamatan tidak konsisten.",
      });
    if (
      v.usable &&
      (!v.calibrated ||
        v.interrupted ||
        v.durationMs < GAZE_LIMITS.minReadingMs ||
        v.trackedMs / v.durationMs < GAZE_LIMITS.minCoverage ||
        v.mappedMs / v.durationMs < STUDY_LIMITS.minimumMapped ||
        !v.visits.some((x) => x > 0))
    )
      ctx.addIssue({
        code: "custom",
        message: "Kualitas pengamatan belum memenuhi pengecekan.",
      });
  });
export type StudyObservation = z.infer<typeof observationSchema>;

/** Coarse, stable region changes at webcam sampling rates. Never saccades or word fixations. */
export function analyzeReadingRegions(
  samples: GazeSample[],
  durationMs: number,
  regions: ReadingRegion[],
  validation: RegionValidation | null,
  interrupted = false,
): StudyObservation {
  const duration = Math.max(
    0,
    Math.min(600_000, Number.isFinite(durationMs) ? durationMs : 0),
  );
  const events = samples
    .filter((s) => Number.isFinite(s.t) && s.t >= 0 && s.t <= duration)
    .sort((a, b) => a.t - b.t);
  const regionMs = [0, 0, 0],
    visits = [0, 0, 0];
  let trackedMs = 0,
    returns = 0;
  const episodes: {
    region: number;
    start: number;
    end: number;
    duration: number;
    frames: number;
  }[] = [];
  let run: (typeof episodes)[number] | null = null;
  const flush = () => {
    if (run && run.duration >= STUDY_LIMITS.stableMs && run.frames >= 3)
      episodes.push(run);
    run = null;
  };
  for (let i = 0; i < events.length; i++) {
    const e = events[i],
      next = events[i + 1]?.t ?? duration;
    const dt = Math.min(GAZE_LIMITS.maxSampleGapMs, Math.max(0, next - e.t));
    if (e.eyesTracked) trackedMs += dt;
    const point = e.point;
    const region =
      validation?.usable &&
      e.eyesTracked &&
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
        ? regions.findIndex(
            (r) =>
              point.x >= r.x + validation.errorX &&
              point.x <= r.x + r.width - validation.errorX &&
              point.y >= r.y + validation.errorY &&
              point.y <= r.y + r.height - validation.errorY,
          )
        : -1;
    if (region < 0) {
      flush();
      continue;
    }
    regionMs[region] += dt;
    if (
      run &&
      (run.region !== region || e.t - run.end > GAZE_LIMITS.maxSampleGapMs)
    )
      flush();
    if (!run) run = { region, start: e.t, end: e.t, duration: 0, frames: 0 };
    run.end = e.t + dt;
    run.duration += dt;
    run.frames++;
    if (next - e.t > GAZE_LIMITS.maxSampleGapMs) flush();
  }
  flush();
  episodes.forEach((e, i) => {
    visits[e.region]++;
    const prev = episodes[i - 1];
    if (
      prev &&
      e.start - prev.end <= STUDY_LIMITS.transitionGapMs &&
      e.region < prev.region
    )
      returns++;
  });
  const mappedMs = regionMs.reduce((a, b) => a + b, 0);
  const reason = interrupted
    ? "Sesi terputus. Pola perpindahan tidak dianalisis."
    : !validation?.usable
      ? "Kalibrasi bagian bacaan belum lolos. Pola mata belum dapat dinilai."
      : duration < GAZE_LIMITS.minReadingMs
        ? "Pengamatan terlalu singkat untuk merangkum pola mata."
        : trackedMs / duration < GAZE_LIMITS.minCoverage
          ? "Sinyal mata terlalu sering hilang atau kamera terlalu lambat."
          : mappedMs / duration < STUDY_LIMITS.minimumMapped
            ? "Terlalu banyak posisi pandangan yang belum dapat dibedakan antarbagian."
            : !episodes.length
              ? "Belum ada pengamatan bagian yang cukup stabil."
              : "Perkiraan perpindahan antarbagian tersedia.";
  const usable = reason === "Perkiraan perpindahan antarbagian tersedia.";
  return {
    durationMs: duration,
    trackedMs,
    mappedMs: usable ? mappedMs : 0,
    regionMs: usable ? regionMs : [0, 0, 0],
    visits: usable ? visits : [0, 0, 0],
    returns: usable ? returns : 0,
    usable,
    reason,
    calibrated: !!validation?.usable,
    interrupted,
  };
}

export const studyRoundSchema = z
  .object({
    passageId: z.enum(["buku", "bola"]),
    observation: observationSchema,
    answers: z.array(z.number().int().min(0).max(2).nullable()).length(2),
    oral: z.array(z.enum(["correct", "incorrect", "unassessed"])).length(3),
    assisted: z.boolean(),
  })
  .strict();
export const readingStudySchema = z
  .object({
    id: z.uuid(),
    completedAt: z.iso
      .datetime({ offset: true })
      .transform((v) => new Date(v).toISOString()),
    version: z.literal(1),
    mode: z.enum(["comparison", "guided-practice"]),
    rounds: z.array(studyRoundSchema).min(1).max(2),
  })
  .strict()
  .superRefine((v, ctx) => {
    const expected = v.mode === "comparison" ? ["buku", "bola"] : ["bola"];
    if (
      v.rounds.some((r, i) => r.passageId !== expected[i]) ||
      (v.mode === "guided-practice" && v.rounds.length !== 1)
    )
      ctx.addIssue({ code: "custom", message: "Urutan bacaan tidak sesuai." });
  });
export type StudyRound = z.infer<typeof studyRoundSchema>;
export type ReadingStudy = z.infer<typeof readingStudySchema>;

export function studyRoundResult(round: StudyRound) {
  const passage = STUDY_PASSAGES.find((p) => p.id === round.passageId)!;
  const assessed = round.answers.filter((a) => a !== null).length;
  const correct = round.answers.filter(
    (a, i) => a === passage.questions[i].correct,
  ).length;
  return {
    passage,
    assessed,
    correct,
    score: assessed ? Math.round((100 * correct) / assessed) : null,
    oralAssessed: round.oral.filter((a) => a !== "unassessed").length,
    oralCorrect: round.oral.filter((a) => a === "correct").length,
  };
}

export function readingStudyAdvice(record: ReadingStudy) {
  const results = record.rounds.map(studyRoundResult);
  const latest = results.at(-1)!;
  const round = record.rounds.at(-1)!;
  const wrong = round.answers.findIndex(
    (a, i) => a !== null && a !== latest.passage.questions[i].correct,
  );
  const oralErrors = round.oral.filter((a) => a === "incorrect").length;
  const previous = results.length === 2 ? results[0] : null;
  const guidedImprovement =
    !!previous &&
    previous.assessed === 2 &&
    latest.assessed === 2 &&
    latest.correct > previous.correct;
  const needsPractice =
    wrong >= 0 ||
    oralErrors > 0 ||
    round.assisted ||
    latest.assessed < 2 ||
    guidedImprovement;
  const region =
    wrong >= 0
      ? latest.passage.questions[wrong].region
      : round.oral.findIndex((a) => a === "incorrect");
  const reason =
    wrong >= 0
      ? `Pemahaman: ${latest.correct} dari ${latest.assessed} jawaban sesuai. Ulangi bagian ${region + 1} bersama pendamping.`
      : oralErrors
        ? `${oralErrors} bagian bacaan masih perlu diulang menurut pendamping. Mulai dari satu kalimat.`
        : latest.assessed < 2
          ? "Pertanyaan pemahaman belum lengkap. Coba lagi saat anak siap."
          : round.assisted
            ? "Jawaban sesuai dengan bantuan. Coba panduan bagian lagi, lalu kurangi bantuan jika anak siap."
            : guidedImprovement
              ? `Pada dua bacaan berbeda, jawaban sesuai berubah dari ${previous!.correct}/2 menjadi ${latest.correct}/2. Coba panduan lagi pada bacaan lain untuk memeriksa polanya.`
              : "Jawaban pemahaman sesuai. Lanjutkan bacaan pendek dengan contoh berbeda.";
  const observation = round.observation;
  const context =
    observation.usable && region >= 0
      ? `Bagian ${region + 1} terpetakan sekitar ${(observation.regionMs[region] / 1000).toFixed(1).replace(".", ",")} detik. Bahas jawabannya bersama; durasi ini tidak membuktikan pemahaman.`
      : observation.usable
        ? `${observation.returns} perkiraan perpindahan ke bagian sebelumnya tercatat. Membaca ulang dapat menjadi strategi belajar.`
        : "Saran memakai hasil jawaban; pola mata sesi ini belum dapat dipakai.";
  return {
    needsPractice,
    reason,
    context,
    path: "/latihan/pola-membaca?latihan=baris",
    support:
      "Gunakan panduan satu bagian, baca pelan-pelan, lalu jawab dua pertanyaan.",
  };
}
