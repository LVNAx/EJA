import { z } from "zod";

export const evidenceSchema = z.object({
  audioPlays: z.number().int().nonnegative().default(0),
  hints: z.number().int().nonnegative().default(0),
  quizzes: z
    .record(
      z.string(),
      z.object({
        attempts: z.number().int().nonnegative(),
        incorrect: z.number().int().nonnegative(),
        solved: z.boolean(),
        firstTryCorrect: z.boolean(),
      }),
    )
    .default({}),
  writingScores: z.array(z.number().min(0).max(100)).default([]),
  readingAttempts: z.number().int().nonnegative().default(0),
  readingMatches: z.number().int().nonnegative().default(0),
  selfRead: z.boolean().default(false),
});
export type LearningEvidence = z.infer<typeof evidenceSchema>;

export function evidenceStatus(
  kind: "math" | "reading" | "writing",
  evidence?: LearningEvidence,
): string {
  if (!evidence) return "Belum ada catatan bantuan";
  if (kind === "math") {
    const quizzes = Object.values(evidence.quizzes);
    if (!quizzes.length) return "Sedang mempelajari contoh";
    if (quizzes.some((quiz) => !quiz.solved)) return "Perlu latihan lagi";
    return quizzes.some((quiz) => !quiz.firstTryCorrect) || evidence.hints > 0
      ? "Berhasil setelah berlatih atau dibantu"
      : "Menjawab dengan tepat pada percobaan pertama";
  }
  if (kind === "writing") {
    const last = evidence.writingScores.at(-1);
    return last === undefined
      ? "Belum ada tulisan yang diperiksa"
      : last >= 70
        ? "Bentuk tulisan sudah mendekati contoh"
        : "Perlu berlatih mengikuti garis";
  }
  if (evidence.readingMatches > 0) return "Kata terdeteksi sesuai bacaan";
  if (evidence.selfRead) return "Membaca mandiri; belum dinilai otomatis";
  return evidence.readingAttempts > 0
    ? "Pengenalan suara belum cocok; perlu didampingi"
    : "Belum ada hasil pengenalan suara";
}
