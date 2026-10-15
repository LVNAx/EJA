import type { AppState, Session } from "../state/store";
import { evidenceSchema, type LearningEvidence } from "../state/evidence";

/** Deliberately isolated simulation. Never writes to the child's stored records. */
export function progressDemoData(): Pick<AppState, "sessions" | "evidence"> {
  const sessions: Record<string, Session> = {};
  const evidence: Record<string, LearningEvidence> = {};
  for (let i = 0; i < 6; i++) {
    for (const kind of ["reading", "writing", "math"] as const) {
      const id = `simulation-${kind}-${i}`;
      const at = new Date(
        Date.UTC(
          2026,
          9,
          i + 1,
          kind === "reading" ? 8 : kind === "writing" ? 9 : 10,
        ),
      ).toISOString();
      sessions[id] = {
        id,
        kind,
        activityId:
          kind === "math"
            ? "pecahan-dasar"
            : kind === "reading"
              ? "pecahan"
              : "A",
        title:
          kind === "math"
            ? "Pecahan"
            : kind === "reading"
              ? "Membaca pecahan"
              : "Menulis A",
        startedAt: at,
        completedAt: at,
        xpEarned: 0,
        learned: [],
      };
      evidence[id] = evidenceSchema.parse({
        ...(kind === "reading"
          ? { readingAttempts: 1, readingMatches: i >= 2 ? 1 : 0 }
          : {}),
        ...(kind === "writing"
          ? { writingScores: [[35, 45, 58, 74, 82, 88][i]] }
          : {}),
        ...(kind === "math"
          ? {
              hints: i === 0 ? 0 : 1,
              quizzes: {
                kuis: {
                  attempts: i === 0 ? 1 : 2,
                  incorrect: i === 0 ? 0 : 1,
                  solved: true,
                  firstTryCorrect: i === 0,
                },
              },
            }
          : {}),
      });
    }
  }
  return { sessions, evidence };
}
