"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Ear, Hash, Pencil } from "lucide-react";
import { FontSelector } from "@/components/accessibility/FontSelector";
import { Logo } from "@/components/site/Logo";
import { TASKS } from "@/lib/screening/protocol";
import {
  assessmentRecordSchema,
  type AssessmentAnswer,
  type AssessmentRecord,
} from "@/lib/screening/assessment";
import {
  rememberDemoResult,
  saveLocalAssessment,
} from "@/lib/screening/assessment-store";
import { saveAssessment } from "@/app/screening/[childId]/assessment-actions";
import { ROUTES } from "@/lib/routes";
import { SoundTest } from "./tests/SoundTest";
import { ReadingTest } from "./tests/ReadingTest";
import { NamingTest } from "./tests/NamingTest";
import { DictationTest } from "./tests/DictationTest";
import type { EyeObservation } from "./ReadingTracker";
import "./assessment.css";

const ICONS = [Ear, BookOpen, Hash, Pencil];
export function ScreeningFlow({
  childId,
  childName,
  demo,
}: {
  childId: string;
  childName: string;
  demo: boolean;
}) {
  const [stage, setStage] = useState<
    "welcome" | "intro" | "task" | "saving" | "done"
  >("welcome");
  const [taskIndex, setTaskIndex] = useState(0),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const answers = useRef<AssessmentAnswer[]>([]),
    eyes = useRef<EyeObservation>(),
    record = useRef<AssessmentRecord>();
  const completedTask = useRef(false);
  const task = TASKS[taskIndex],
    Icon = ICONS[taskIndex];
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>(".assessment-main h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [stage, taskIndex]);
  const save = async (value: AssessmentRecord) => {
    setStage("saving");
    setError("");
    const localSaved = saveLocalAssessment(childId, value);
    if (demo) {
      const sessionSaved = rememberDemoResult(childId, value);
      if (!localSaved && !sessionSaved)
        setError(
          "Penyimpanan browser tidak tersedia. Catatan hanya tersedia selama halaman ini terbuka.",
        );
      setStage("done");
      return;
    }
    try {
      const result = await saveAssessment(childId, value);
      if (!result.ok) {
        setError(result.error ?? "Hasil belum tersimpan ke akun.");
        return;
      }
      setStage("done");
    } catch {
      setError(
        localSaved
          ? "Koneksi terputus. Catatan pada browser ini masih tersedia."
          : "Catatan belum tersimpan. Coba lagi sebelum menutup halaman.",
      );
    }
  };
  const finishTask = (
    responses: AssessmentAnswer[],
    observed?: EyeObservation,
  ) => {
    if (completedTask.current) return;
    completedTask.current = true;
    answers.current.push(...responses);
    if (observed) eyes.current = observed;
    if (taskIndex < TASKS.length - 1) {
      setTaskIndex(taskIndex + 1);
      setStage("intro");
    } else {
      const value = assessmentRecordSchema.parse({
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
        submission: {
          version: 2,
          answers: answers.current,
          ...(eyes.current ? { eyeTracking: eyes.current } : {}),
        },
      });
      record.current = value;
      void save(value);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div className="assessment-shell">
      <header className="assessment-header">
        <Logo />
        <FontSelector />
      </header>
      <main id="main" className="assessment-main">
        <Link
          className="assessment-back"
          href={demo ? "/demo/belajar" : ROUTES.childHome(childId)}
        >
          ← Kembali
        </Link>
        {(stage === "intro" || stage === "task") && (
          <nav className="assessment-steps" aria-label="Tahapan tes">
            {TASKS.map((t, i) => (
              <span
                key={t.key}
                aria-current={i === taskIndex ? "step" : undefined}
                className={
                  i === taskIndex ? "current" : i < taskIndex ? "complete" : ""
                }
              >
                <b>
                  {i < taskIndex ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    i + 1
                  )}
                </b>
                <span>{t.title}</span>
              </span>
            ))}
          </nav>
        )}
        {stage === "welcome" && (
          <section className="assessment-card assessment-welcome">
            <span className="assessment-icon">
              <BookOpen size={30} aria-hidden="true" />
            </span>
            <div className="assessment-card-heading">
              <p className="assessment-kicker">Kenali cara belajarmu</p>
              <h1>Halo, {childName}.</h1>
              <p>Empat kegiatan singkat bersama pendamping.</p>
            </div>
            <div className="assessment-overview">
              {TASKS.map((t, i) => {
                const TaskIcon = ICONS[i];
                return (
                  <div key={t.key}>
                    <TaskIcon size={23} aria-hidden="true" />
                    <span>{t.title}</span>
                  </div>
                );
              })}
            </div>
            <label className="assessment-check">
              <input
                type="checkbox"
                checked={ready}
                onChange={(e) => setReady(e.target.checked)}
              />
              Pendamping sudah siap.
            </label>
            <button
              className="assessment-primary"
              disabled={!ready}
              onClick={() => setStage("intro")}
            >
              Mulai kegiatan
            </button>
            <p className="assessment-helper">
              Boleh berhenti atau melewati bagian yang belum bisa dilakukan.
            </p>
          </section>
        )}
        {stage === "intro" && (
          <section className="assessment-card assessment-welcome">
            <span className="assessment-icon">
              <Icon size={30} aria-hidden="true" />
            </span>
            <div className="assessment-card-heading">
              <p className="assessment-kicker">
                Kegiatan {taskIndex + 1} dari 4
              </p>
              <h1>{task.title}</h1>
              <p>{task.instruction}</p>
            </div>
            <div className="assessment-example">{task.example}</div>
            <button
              className="assessment-primary"
              onClick={() => {
                completedTask.current = false;
                setStage("task");
              }}
            >
              Saya siap
            </button>
          </section>
        )}
        {stage === "task" && taskIndex === 0 && (
          <SoundTest onComplete={finishTask} />
        )}
        {stage === "task" && taskIndex === 1 && (
          <ReadingTest onComplete={finishTask} />
        )}
        {stage === "task" && taskIndex === 2 && (
          <NamingTest onComplete={finishTask} />
        )}
        {stage === "task" && taskIndex === 3 && (
          <DictationTest onComplete={finishTask} />
        )}
        {stage === "saving" && (
          <section className="assessment-card">
            <h1>
              {error ? "Catatan belum tersimpan ke akun" : "Menyimpan catatan…"}
            </h1>
            {error && (
              <>
                <p role="alert">{error}</p>
                <button
                  className="assessment-primary"
                  onClick={() => record.current && void save(record.current)}
                >
                  Coba simpan lagi
                </button>
                <button
                  className="assessment-secondary"
                  onClick={() => setStage("done")}
                >
                  Selesai, lanjut belajar
                </button>
              </>
            )}
          </section>
        )}
        {stage === "done" && (
          <section className="assessment-card assessment-welcome">
            <span className="assessment-icon">
              <Check size={30} aria-hidden="true" />
            </span>
            <div className="assessment-card-heading">
              <h1>Terima kasih!</h1>
              <p>Kegiatan selesai. Saatnya beristirahat.</p>
            </div>
            {error && (
              <p role="alert" className="assessment-notice">
                {error}
              </p>
            )}
            {demo && (
              <Link
                className="assessment-primary"
                href={`/screening/${childId}/result`}
              >
                Lihat catatan pendamping
              </Link>
            )}
            <Link
              className="assessment-secondary"
              href={demo ? "/demo/belajar" : ROUTES.childHome(childId)}
            >
              Lanjut belajar
            </Link>
          </section>
        )}
      </main>
      <footer className="assessment-footer">
        EJA · Belajar sesuai langkahmu.
      </footer>
    </div>
  );
}
