import type { AppState } from "@/features/learning/state/store";
import { lessons } from "@/features/learning/math/content";
import { localDateKey } from "@/features/learning/state/progress";

export function childSummary(state: AppState, now: Date) {
  const today = localDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const completed = Object.values(state.sessions).filter((session) => session.completedAt);
  const active = Object.values(state.sessions)
    .filter((session) => !session.completedAt && (session.kind === "math"
      ? state.lessons[session.activityId]?.activeSessionId === session.id
      : state.activePractices[session.kind] === session.id))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  return {
    completed,
    active,
    todayCount: completed.filter((session) => localDateKey(new Date(session.completedAt!)) === today).length,
    streak: state.lastActiveDate === today || state.lastActiveDate === localDateKey(yesterday) ? state.streak : 0,
    completedLessons: lessons.filter((lesson) => state.lessons[lesson.id]?.completed).length,
    recent: [...completed].sort((a, b) => b.completedAt!.localeCompare(a.completedAt!)).slice(0, 3),
  };
}
