"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CameraExperiment } from "@/features/learning/gaze/camera-experiment";
import { learningHref } from "@/features/learning/paths";
import { ROUTES } from "@/lib/routes";
import "@/features/learning/gaze/experiment.css";

export default function ReadingPatternPage() {
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
        Demo kamera saat membaca. Untuk mencatat jawaban anak, buka{" "}
        <Link
          className="camera-assessment-link"
          href={ROUTES.screening(childId)}
        >
          Tes kemampuan
        </Link>
        .
      </p>
      <CameraExperiment assessmentHref={ROUTES.screening(childId)} />
    </div>
  );
}
