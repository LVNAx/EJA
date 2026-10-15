"use client";
import { useCallback, useRef, useState } from "react";
import type { AssessmentAnswer } from "@/lib/screening/assessment";
import type { ReadingSession } from "@/lib/screening/reading-session";
import {
  MEANING_ITEMS,
  PASSAGE,
  READING_ITEMS,
} from "@/lib/screening/protocol";
import type { TrackerFactory } from "@/features/learning/gaze/camera-tracker";
import {
  ReadingTracker,
  type EyeObservation,
  type ReadingTrackerHandle,
} from "../ReadingTracker";
import { Interrupted, TestCard } from "./TestCard";
import { useTestClock } from "./useTestClock";
import { useReadingWindow } from "./useReadingWindow";

export function ReadingTest({
  onComplete,
  autoCamera = true,
  createTracker,
}: {
  onComplete: (
    answers: AssessmentAnswer[],
    eyes?: EyeObservation,
    session?: ReadingSession,
  ) => void;
  autoCamera?: boolean;
  createTracker?: TrackerFactory;
}) {
  const [index, setIndex] = useState(READING_ITEMS.length as number),
    [phase, setPhase] = useState<
      "ready" | "reading" | "review" | "experience" | "words"
    >("ready");
  const [assisted, setAssisted] = useState(false),
    [durationMs, setDuration] = useState<number | null>(null),
    [cameraLoading, setCameraLoading] = useState(autoCamera);
  const answers = useRef<AssessmentAnswer[]>([]),
    observation = useRef<EyeObservation>(),
    tracker = useRef<ReadingTrackerHandle>(null);
  const session = useRef<ReadingSession>(),
    responseTimes = useRef<ReadingSession["responseTimes"]>([]),
    questionTime = useRef(0),
    finished = useRef(false);
  const observe = useCallback((stats: EyeObservation) => {
    observation.current = stats;
  }, []);
  const clock = useTestClock();
  const reading = useReadingWindow(
    () => {
      questionTime.current += clock.finish() ?? 0;
    },
    () => {
      clock.finish();
    },
  );
  const isWord = index < READING_ITEMS.length,
    word = READING_ITEMS[index],
    meaning = MEANING_ITEMS[index - READING_ITEMS.length];
  const complete = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(answers.current, observation.current, session.current);
  };
  const finishText = (status: ReadingSession["status"]) => {
    reading.finish();
    clock.finish();
    observation.current = tracker.current?.finish() ?? observation.current;
    session.current = {
      ...reading.snapshot(status),
      responseTimes: [...responseTimes.current],
    };
    setPhase("experience");
  };
  const start = () => {
    setPhase("reading");
    clock.start();
    if (!isWord) {
      answers.current = answers.current.filter(
        (a) => !MEANING_ITEMS.some((q) => q.id === a.itemId),
      );
      responseTimes.current = [];
      questionTime.current = 0;
      tracker.current?.reset();
      reading.start();
    }
  };
  const recordMeaning = (option: number) => {
    if (reading.status !== "running") return;
    const budget = reading.snapshot("completed");
    if (reading.elapsed() >= budget.limitMs + budget.extensionMs) {
      finishText("expired");
      return;
    }
    if (answers.current.some((a) => a.itemId === meaning.id)) return;
    const measured = clock.finish();
    if (measured === null) return;
    answers.current.push({
      type: "choice",
      itemId: meaning.id,
      option,
      durationMs: questionTime.current + measured,
      assisted,
      audioPlays: 0,
      interruptions: reading.snapshot("completed").interruptions,
    });
    responseTimes.current.push({ itemId: meaning.id, atMs: reading.elapsed() });
    questionTime.current = 0;
    if (index === READING_ITEMS.length) {
      setIndex(index + 1);
      setAssisted(false);
      clock.start();
    } else finishText("completed");
  };
  const recordWord = (verdict: "correct" | "incorrect" | "unassessed") => {
    answers.current.push({
      type: "oral",
      itemId: word.id,
      verdict,
      durationMs,
      assisted,
      interruptions: clock.interruptions.current,
    });
    if (index === READING_ITEMS.length - 1) {
      complete();
      return;
    }
    setIndex(index + 1);
    setPhase("ready");
    setAssisted(false);
    setDuration(null);
    clock.reset();
  };
  const chooseExperience = (experience: ReadingSession["experience"]) => {
    if (session.current) session.current = { ...session.current, experience };
    setPhase("words");
  };
  const retryText = () => {
    tracker.current?.reset();
    setIndex(READING_ITEMS.length);
    setPhase("ready");
    clock.reset();
  };
  return (
    <TestCard
      title={
        phase === "experience"
          ? "Bagaimana tulisan terasa?"
          : phase === "words"
            ? "Lanjut kata pendek?"
            : isWord
              ? "Baca dengan suara jelas"
              : "Baca dan jawab · 60 detik"
      }
      instruction={
        phase === "experience"
          ? "Pilih yang kamu rasakan. Boleh dilewati."
          : phase === "words"
            ? "Enam kata singkat, tanpa batas waktu."
            : isWord
              ? word.kind === "pseudo"
                ? "Kata rekaan. Ucapkan sesuai hurufnya."
                : "Pendamping mendengarkan bacaanmu."
              : "Baca teks, lalu jawab dua pertanyaan. Waktu bisa ditambah."
      }
      index={isWord ? index + 2 : index - READING_ITEMS.length}
      total={READING_ITEMS.length + MEANING_ITEMS.length}
    >
      <div hidden={isWord || phase === "experience" || phase === "words"}>
        <ReadingTracker
          ref={tracker}
          active={
            !isWord &&
            phase === "reading" &&
            reading.status === "running" &&
            !clock.interrupted
          }
          onObservation={observe}
          onLoading={setCameraLoading}
          autoStart={autoCamera}
          createTracker={createTracker}
          elapsedMs={reading.elapsed}
        />
      </div>
      {phase === "ready" && (
        <button
          className="assessment-primary"
          disabled={cameraLoading && !isWord}
          onClick={start}
        >
          {isWord ? "Mulai baca" : "Mulai baca dan jawab"}
        </button>
      )}
      {phase === "experience" && (
        <div className="assessment-form">
          {[
            ["steady", "Tulisan terasa tetap"],
            ["moving", "Tulisan terasa bergerak atau bercampur"],
            ["unsure", "Tidak tahu"],
            ["unanswered", "Lewati"],
          ].map(([value, label]) => (
            <button
              className="assessment-secondary"
              key={value}
              onClick={() =>
                chooseExperience(value as ReadingSession["experience"])
              }
            >
              {label}
            </button>
          ))}
          <p className="assessment-helper">
            Ini cerita pengalamanmu. Kamera tidak dapat memastikan apa yang kamu
            lihat.
          </p>
        </div>
      )}
      {phase === "words" && (
        <div className="assessment-two">
          <button
            className="assessment-primary"
            onClick={() => {
              setIndex(0);
              setPhase("ready");
              clock.reset();
            }}
          >
            Lanjut enam kata
          </button>
          <button className="assessment-secondary" onClick={complete}>
            Selesai bagian membaca
          </button>
        </div>
      )}
      {(phase === "reading" || phase === "review") && (
        <>
          {isWord ? (
            <div className="assessment-word" aria-label="Kata yang dibaca">
              {word.text}
            </div>
          ) : (
            <>
              <div
                className="assessment-reading-timer"
                aria-label="Batas waktu membaca"
              >
                <strong>{reading.remaining} detik tersisa</strong>
                <button
                  disabled={
                    !reading.canExtend || reading.status === "interrupted"
                  }
                  className="assessment-secondary"
                  onClick={() => {
                    const resume = reading.status === "expired";
                    reading.addTime();
                    if (resume) clock.start();
                  }}
                >
                  Tambah 30 detik
                </button>
              </div>
              <div className="assessment-passage">
                {PASSAGE.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </>
          )}
          {phase === "reading" &&
            (isWord ? (
              <>
                {clock.interrupted ? (
                  <Interrupted onRetry={start} />
                ) : (
                  <button
                    className="assessment-primary"
                    onClick={() => {
                      setDuration(clock.finish());
                      setPhase("review");
                    }}
                  >
                    Sudah dibaca
                  </button>
                )}
              </>
            ) : (
              <>
                {reading.status === "interrupted" || clock.interrupted ? (
                  <Interrupted onRetry={retryText} />
                ) : reading.status === "expired" ? (
                  <div className="assessment-notice">
                    <h2>Waktu selesai</h2>
                    <p>
                      Jawaban yang sudah diberikan tetap tercatat. Pertanyaan
                      yang belum dijawab tidak dianggap salah.
                    </p>
                    <button
                      className="assessment-primary"
                      onClick={() => finishText("expired")}
                    >
                      Selesai dan lihat catatan
                    </button>
                  </div>
                ) : (
                  <div className="assessment-meaning">
                    <h2>{meaning.prompt}</h2>
                    <label className="assessment-check">
                      <input
                        type="checkbox"
                        checked={assisted}
                        onChange={(e) => setAssisted(e.target.checked)}
                      />
                      Dibantu saat menjawab
                    </label>
                    {meaning.options.map((label, option) => (
                      <button
                        className="assessment-secondary"
                        key={label}
                        onClick={() => recordMeaning(option)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ))}
          {phase === "review" && (
            <div className="assessment-review">
              <p className="assessment-kicker">Catatan pendamping</p>
              <h2>Ucapan sesuai tulisan?</h2>
              <label className="assessment-check">
                <input
                  type="checkbox"
                  checked={assisted}
                  onChange={(e) => setAssisted(e.target.checked)}
                />
                Dibantu saat membaca
              </label>
              <div className="assessment-two">
                <button
                  className="assessment-primary"
                  onClick={() => recordWord("correct")}
                >
                  Sesuai
                </button>
                <button
                  className="assessment-secondary"
                  onClick={() => recordWord("incorrect")}
                >
                  Ada kekeliruan
                </button>
              </div>
              <button
                className="assessment-skip"
                onClick={() => recordWord("unassessed")}
              >
                Belum bisa dinilai
              </button>
            </div>
          )}
        </>
      )}
      {phase !== "experience" && phase !== "words" && (
        <button
          className="assessment-skip"
          onClick={() => {
            if (!isWord) {
              if (phase === "reading")
                finishText(
                  reading.status === "interrupted" ? "interrupted" : "skipped",
                );
              else {
                observation.current = tracker.current?.finish();
                complete();
              }
            } else complete();
          }}
        >
          Lewati bagian ini
        </button>
      )}
    </TestCard>
  );
}
