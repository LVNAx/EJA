"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LearningProgressReport } from "@/features/learning/components/learning-progress-report";
import { learningHref } from "@/features/learning/paths";

export default function ProgressPage() {
  const { childId } = useParams<{ childId: string }>();
  return (
    <div className="container progress-page">
      <Link className="progress-link" href={learningHref(childId)}>
        ← Kembali ke belajar
      </Link>
      <h1>Catatan untuk pendamping</h1>
      <LearningProgressReport childId={childId} />
    </div>
  );
}
