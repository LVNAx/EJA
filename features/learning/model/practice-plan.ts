import type { AssessmentRecord } from "@/lib/screening/assessment";
import { buildAssessmentPlan } from "@/lib/screening/learning-plan";
import { readingStudyAdvice, type ReadingStudy } from "../gaze/reading-study";
import {
  recommendPractice,
  SKILLS,
  type SkillProgress,
} from "./progress-model";

/** Assessment selects an initial practice. Newer practice results take over. */
export function recommendNextPractice(
  skills: SkillProgress[],
  records: AssessmentRecord[],
  studies: ReadingStudy[] = [],
) {
  const latest = [...records].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )[0];
  const fallback = recommendPractice(skills);
  const study = [...studies].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )[0];
  if (study && (!latest || study.completedAt > latest.completedAt)) {
    const followedUp = skills
      .find((s) => s.skill.id === "reading")
      ?.history.some((h) => h.at > study.completedAt);
    if (!followedUp) {
      const advice = readingStudyAdvice(study);
      if (advice.needsPractice)
        return {
          skill: {
            ...SKILLS[0],
            label: "Bacaan pendek",
            path: advice.path,
            support: advice.support,
          },
          reason: `Dari eksperimen membaca · ${advice.reason}`,
          source: "reading-study" as const,
        };
      return { ...fallback, source: "practice" as const };
    }
  }
  if (!latest) return { ...fallback, source: "practice" as const };
  const plan = buildAssessmentPlan(latest);
  if (
    latest.submission.readingSession?.experience !== "moving" &&
    plan.tasks.every(
      (t) =>
        t.status === "complete" && t.correct === t.assessed && t.assisted === 0,
    )
  )
    return { ...fallback, source: "practice" as const };
  const skillId =
    plan.next.key === "dictation" || plan.next.key === "naming"
      ? "writing"
      : "reading";
  const followedUp = skills
    .find((s) => s.skill.id === skillId)
    ?.history.some((h) => h.at > latest.completedAt);
  if (followedUp) return { ...fallback, source: "practice" as const };
  return {
    skill: {
      ...SKILLS.find((s) => s.id === skillId)!,
      label: plan.next.label,
      path: plan.next.path,
      support: plan.next.instruction,
    },
    reason: `Dari tes terakhir · ${plan.next.reason}`,
    source: "assessment" as const,
  };
}
