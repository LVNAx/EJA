import { lessons } from "../math/content";
import type { AppState } from "../state/store";

export function mathResults(state: Pick<AppState, "sessions" | "evidence">) {
  return lessons.map((lesson) => {
    const session = Object.values(state.sessions)
      .filter(
        (s) =>
          s.kind === "math" &&
          s.activityId === lesson.id &&
          s.completedAt &&
          Number.isFinite(Date.parse(s.completedAt)),
      )
      .sort(
        (a, b) =>
          b.completedAt!.localeCompare(a.completedAt!) ||
          a.id.localeCompare(b.id),
      )[0];
    const evidence = session ? state.evidence[session.id] : undefined;
    const expected = lesson.chunks.filter((c) => c.type === "quiz");
    const quizzes = expected.flatMap((c) => {
      const q = evidence?.quizzes[c.id];
      return q && q.attempts > 0 ? [q] : [];
    });
    const firstTry = quizzes.filter((q) => q.firstTryCorrect).length;
    return {
      id: lesson.id,
      title: lesson.title,
      at: session?.completedAt,
      total: expected.length,
      assessed: quizzes.length,
      solved: quizzes.filter((q) => q.solved).length,
      firstTry,
      score: quizzes.length
        ? Math.round((100 * firstTry) / quizzes.length)
        : null,
      attempts: quizzes.reduce((sum, q) => sum + q.attempts, 0),
      hints: evidence?.hints ?? 0,
      path: `/materi/${lesson.id}`,
    };
  });
}
