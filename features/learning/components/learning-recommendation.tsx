"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppState, useBrowserReady } from "../state/store";
import { buildProgressModel } from "../model/progress-model";
import { recommendNextPractice } from "../model/practice-plan";
import { useAssessmentHistory } from "@/lib/screening/assessment-store";
import { learningHref } from "../paths";
import { useReadingStudies } from "../gaze/study-store";

export function LearningRecommendation({ childId }: { childId: string }) {
  const state = useAppState(childId);
  const ready = useBrowserReady();
  const assessments = useAssessmentHistory(childId);
  const studies = useReadingStudies(childId);
  const suggestion = useMemo(
    () =>
      recommendNextPractice(
        buildProgressModel(state).skills,
        assessments,
        studies,
      ),
    [state, assessments, studies],
  );
  if (!ready) return null;
  return (
    <section
      className="practice-suggestion"
      aria-label="Saran latihan berikutnya"
    >
      <div>
        <p className="progress-kicker">LANGKAH BERIKUTNYA</p>
        <h2>Coba {suggestion.skill.label.toLocaleLowerCase("id-ID")}</h2>
        <p>{suggestion.reason}</p>
        <p>{suggestion.skill.support}</p>
      </div>
      <div className="progress-actions">
        <Link
          className="progress-button"
          href={learningHref(childId, suggestion.skill.path)}
        >
          Coba {suggestion.skill.label}
        </Link>
        <Link
          className="progress-link"
          href={learningHref(childId, "/perkembangan")}
        >
          Lihat perkembangan belajar
        </Link>
      </div>
    </section>
  );
}
