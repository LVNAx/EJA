"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AudioText } from "@/features/learning/components/audio-text";
import { Icon } from "@/features/learning/components/icons";
import { MathVisual } from "@/features/learning/math/math-visual";
import { lessonById } from "@/features/learning/math/content";
import {
  advanceLesson,
  recordQuizAnswer,
  recordHelp,
  ensureLessonSession,
  finishLesson,
  goToLessonStep,
  useAppState,
  useStorageStatus,
} from "@/features/learning/state/store";
import { playRewardSound } from "@/features/learning/state/sound";
import { learningHref } from "@/features/learning/paths";

const syllables: Record<string, string> = {
  utuh: "u – tuh",
  bagian: "ba – gi – an",
  seperempat: "se – per – em – pat",
  kelompok: "ke – lom – pok",
  perkalian: "per – ka – li – an",
};

export default function LessonPage() {
  const { childId, lessonId } = useParams<{
    childId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const lesson = lessonById(lessonId);
  const state = useAppState();
  const saved = useStorageStatus();
  const [selection, setSelection] = useState<{
    chunk: string;
    index: number;
  } | null>(null);
  const [help, setHelp] = useState<{ chunk: string; level: number } | null>(
    null,
  );
  useEffect(() => {
    if (lesson) ensureLessonSession(lesson.id);
  }, [lesson]);

  if (!lesson)
    return (
      <div className="container not-found">
        <h1>Materi belum ditemukan</h1>
        <Link
          className="button button-primary"
          href={learningHref(childId, "/matematika")}
        >
          Pilih materi
        </Link>
      </div>
    );
  const progress = state.lessons[lesson.id];
  const sessionId = progress?.activeSessionId;
  if (!sessionId)
    return (
      <div className="container loading-page" role="status">
        Menyiapkan materi...
      </div>
    );
  const step = Math.min(progress.currentStep, lesson.chunks.length - 1);
  const chunk = lesson.chunks[step];
  const quiz = chunk.quiz;
  const evidence = state.evidence[sessionId]?.quizzes[chunk.id];
  const solved = evidence?.solved ?? false;
  const answer =
    selection?.chunk === chunk.id
      ? selection.index
      : solved
        ? (quiz?.answerIndex ?? null)
        : null;
  const helpLevel = help?.chunk === chunk.id ? help.level : 0;
  const hints = quiz?.hints ?? [];
  const canContinue = !quiz || solved;
  const listen = () => recordHelp(sessionId, "audio");
  const showHelp = () => {
    const limit = quiz ? hints.length : 1;
    if (helpLevel >= limit) return;
    setHelp({ chunk: chunk.id, level: helpLevel + 1 });
    recordHelp(sessionId, "hint");
  };
  const choose = (index: number) => {
    if (solved || !quiz) return;
    setSelection({ chunk: chunk.id, index });
    recordQuizAnswer(lesson.id, chunk.id, index);
    if (index === quiz.answerIndex) {
      if (state.settings.rewardSound) playRewardSound();
    } else {
      const level = Math.min(hints.length, (evidence?.incorrect ?? 0) + 1);
      if (level > helpLevel) {
        setHelp({ chunk: chunk.id, level });
        recordHelp(sessionId, "hint");
      }
    }
  };
  const next = () => {
    if (!canContinue) return;
    setSelection(null);
    setHelp(null);
    if (step === lesson.chunks.length - 1) {
      const id = finishLesson(lesson.id, chunk.id);
      if (id) router.push(learningHref(childId, `/ringkasan/${id}`));
    } else advanceLesson(lesson.id, chunk.id, step + 1);
  };

  return (
    <div className="container lesson-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <Link href={learningHref(childId, "/matematika")}>Matematika</Link>
        <span>/</span>
        <span>{lesson.title}</span>
      </div>
      <div className="lesson-topline">
        <div>
          <span className="section-kicker">BELAJAR PELAN-PELAN</span>
          <h1>{lesson.title}</h1>
        </div>
        <span className="step-badge">
          Langkah {step + 1} dari {lesson.chunks.length}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={lesson.chunks.length}
        aria-label="Kemajuan materi"
      >
        <span
          style={{ width: `${((step + 1) / lesson.chunks.length) * 100}%` }}
        />
      </div>
      <div className="lesson-layout">
        <div className="visual-panel">
          <span className="panel-kicker">LIHAT GAMBARNYA</span>
          <MathVisual visual={chunk.visual} />
          <div className="visual-panel-bottom">
            Kamu boleh melihatnya pelan-pelan.
          </div>
        </div>
        <section
          className="content-panel"
          key={chunk.id}
          aria-labelledby={`chunk-${chunk.id}`}
        >
          <span className="step-index">LANGKAH {step + 1}</span>
          <h2 id={`chunk-${chunk.id}`}>{chunk.title}</h2>
          <AudioText
            text={chunk.text}
            spokenText={chunk.spokenText}
            rate={state.settings.audioRate}
            onListen={listen}
          />
          {chunk.readingTarget && (
            <p className="word-help">
              Baca pelan-pelan:{" "}
              <strong>
                {syllables[chunk.readingTarget] ?? chunk.readingTarget}
              </strong>
            </p>
          )}
          {quiz && (
            <div className="quiz-block">
              <p className="quiz-label">SEKARANG COBA JAWAB</p>
              <h3>{quiz.question}</h3>
              <div className="quiz-options">
                {quiz.options.map((option, index) => (
                  <button
                    key={option}
                    disabled={solved}
                    className={`quiz-option ${answer === index ? (index === quiz.answerIndex ? "correct" : "try-again") : ""}`}
                    onClick={() => choose(index)}
                    aria-pressed={answer === index}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                    {solved && index === quiz.answerIndex && (
                      <Icon name="check" size={19} />
                    )}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <p
                  className={`quiz-feedback ${solved ? "positive" : "gentle"}`}
                  role="status"
                >
                  {solved
                    ? quiz.explanation
                    : "Belum tepat. Kita lihat petunjuknya, lalu coba lagi."}
                </p>
              )}
            </div>
          )}
          {(chunk.example || hints.length > 0) && (
            <div className="learning-help">
              <button
                className="button button-outline"
                onClick={showHelp}
                disabled={helpLevel >= (quiz ? hints.length : 1)}
                aria-expanded={helpLevel > 0}
                aria-controls={`help-${chunk.id}`}
              >
                {helpLevel > 0 && quiz
                  ? "Lihat petunjuk berikutnya"
                  : quiz
                    ? "Bantu aku menjawab"
                    : "Lihat contoh sehari-hari"}
              </button>
              {helpLevel > 0 && (
                <div
                  className="help-card"
                  id={`help-${chunk.id}`}
                  role="status"
                >
                  <strong>
                    {quiz ? "Ayo hitung bersama" : "Bayangkan ini"}
                  </strong>
                  {quiz ? (
                    <ol>
                      {hints.slice(0, helpLevel).map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>{chunk.example}</p>
                  )}
                  <AudioText
                    hideText
                    label="Dengarkan petunjuk"
                    text={
                      quiz
                        ? hints.slice(0, helpLevel).join(" ")
                        : chunk.example!
                    }
                    rate={state.settings.audioRate}
                    onListen={listen}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <div className="lesson-actions">
        <button
          className="button button-outline"
          disabled={step === 0}
          onClick={() => {
            setSelection(null);
            setHelp(null);
            goToLessonStep(lesson.id, step - 1);
          }}
        >
          <Icon name="back" size={18} /> Kembali
        </button>
        <span className="save-hint" role="status">
          {saved
            ? "Tersimpan di perangkat ini"
            : "Belum tersimpan. Biarkan halaman ini terbuka."}
        </span>
        <button
          className="button button-primary"
          onClick={next}
          disabled={!canContinue}
        >
          {step === lesson.chunks.length - 1 ? "Selesaikan materi" : "Lanjut"}
          <Icon name="arrow" size={18} />
        </button>
      </div>
      {!canContinue && (
        <p className="assistive-note">
          Coba jawab dulu. Kamu boleh memakai petunjuk atau kembali ke contoh.
        </p>
      )}
    </div>
  );
}
