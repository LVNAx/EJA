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
  completeQuiz,
  ensureLessonSession,
  finishLesson,
  goToLessonStep,
  useAppState,
} from "@/features/learning/state/store";
import { playRewardSound } from "@/features/learning/state/sound";
import { learningHref } from "@/features/learning/paths";

export default function LessonPage() {
  const { childId, lessonId } = useParams<{ childId: string; lessonId: string }>();
  const router = useRouter();
  const lesson = lessonById(lessonId);
  const state = useAppState();
  const [answer, setAnswer] = useState<number | null>(null);
  useEffect(() => {
    if (lesson) ensureLessonSession(lesson.id);
  }, [lesson]);
  if (!lesson)
    return (
      <div className="container not-found">
        <h1>Materi belum ditemukan</h1>
        <p>Pilih materi yang tersedia untuk mulai belajar.</p>
        <Link className="button button-primary" href={learningHref(childId, "/matematika")}>
          Lihat materi
        </Link>
      </div>
    );
  const progress = state.lessons[lesson.id];
  if (!progress?.activeSessionId)
    return <div className="container loading-page">Menyiapkan materi...</div>;
  const step = Math.min(progress.currentStep, lesson.chunks.length - 1);
  const chunk = lesson.chunks[step];
  const quiz = chunk.quiz;
  const isCorrect = quiz ? answer === quiz.answerIndex : false;
  const next = () => {
    setAnswer(null);
    if (step === lesson.chunks.length - 1) {
      const sessionId = finishLesson(lesson.id, chunk.id);
      if (sessionId) router.push(learningHref(childId, `/ringkasan/${sessionId}`));
    } else advanceLesson(lesson.id, chunk.id, step + 1);
  };
  const choose = (index: number) => {
    setAnswer(index);
    if (index === quiz?.answerIndex) {
      completeQuiz(lesson.id, chunk.id);
      if (state.settings.rewardSound) playRewardSound();
    }
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
          <span className="section-kicker">RUANG BELAJAR</span>
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
            Amati gambarnya pelan-pelan ✨
          </div>
        </div>
        <section className="content-panel" key={chunk.id}>
          <span className="step-index">
            LANGKAH {String(step + 1).padStart(2, "0")}
          </span>
          <h2>{chunk.title}</h2>
          <AudioText text={chunk.text} rate={state.settings.audioRate} />
          {chunk.readingTarget && (
            <p className="word-help">
              Kata penting: <strong>{chunk.readingTarget}</strong>
            </p>
          )}
          {quiz && (
            <div className="quiz-block">
              <p className="quiz-label">COBA JAWAB</p>
              <h3>{quiz.question}</h3>
              <div className="quiz-options">
                {quiz.options.map((option, index) => (
                  <button
                    key={option}
                    className={`quiz-option ${answer === index ? (index === quiz.answerIndex ? "correct" : "try-again") : ""}`}
                    onClick={() => choose(index)}
                    aria-pressed={answer === index}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                    {answer === index && index === quiz.answerIndex && (
                      <Icon name="check" size={19} />
                    )}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <p
                  className={`quiz-feedback ${isCorrect ? "positive" : "gentle"}`}
                  role="status"
                >
                  {isCorrect
                    ? quiz.explanation
                    : "Belum cocok. Coba pilihan lain jika kamu mau."}
                </p>
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
            setAnswer(null);
            goToLessonStep(lesson.id, step - 1);
          }}
        >
          <Icon name="back" size={18} /> Kembali
        </button>
        <span className="save-hint">
          <Icon name="check" size={16} /> Kemajuan tersimpan otomatis
        </span>
        <button className="button button-primary" onClick={next}>
          {step === lesson.chunks.length - 1 ? "Selesaikan Materi" : "Lanjut"}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
