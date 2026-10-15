"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ReadingStudyFlow } from "@/features/learning/gaze/reading-study-flow";
import { learningHref } from "@/features/learning/paths";
import { ROUTES } from "@/lib/routes";
import "@/features/learning/gaze/experiment.css";

export default function ReadingPatternPage({
  searchParams,
}: {
  searchParams: { latihan?: string };
}) {
  const { childId } = useParams<{ childId: string }>();
  return (
    <div className="container camera-page">
      <Link
        className="progress-link"
        href={learningHref(childId, "/latihan/membaca")}
      >
        ← Membaca tanpa kamera
      </Link>
      <h1>Eksperimen Pola Membaca</h1>
      <Link className="progress-link" href="/demo/wajah-mata">
        Buka demo khusus titik wajah dan mata →
      </Link>
      <p>
        Baca, jawab, lalu coba bantuan yang sesuai. Tes kegiatan lain tersedia
        di{" "}
        <Link
          className="camera-assessment-link"
          href={ROUTES.screening(childId)}
        >
          Tes kemampuan
        </Link>
        .
      </p>
      <ReadingStudyFlow
        key={`${childId}:${searchParams.latihan ?? "comparison"}`}
        childId={childId}
        guidedPractice={searchParams.latihan === "baris"}
      />
    </div>
  );
}
