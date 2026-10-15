"use client";
import { useCallback, useRef, useState } from "react";
import type { AssessmentAnswer } from "@/lib/screening/assessment";
import {
  MEANING_ITEMS,
  PASSAGE,
  READING_ITEMS,
} from "@/lib/screening/protocol";
import { ReadingTracker, type EyeObservation } from "../ReadingTracker";
import { Interrupted, TestCard } from "./TestCard";
import { useTestClock } from "./useTestClock";

export function ReadingTest({
  onComplete,
}: {
  onComplete: (answers: AssessmentAnswer[], eyes?: EyeObservation) => void;
}) {
  const [index, setIndex] = useState(0),
    [phase, setPhase] = useState<"ready" | "reading" | "review">("ready");
  const [assisted, setAssisted] = useState(false),
    [durationMs, setDuration] = useState<number | null>(null),
    [cameraLoading, setCameraLoading] = useState(false);
  const answers = useRef<AssessmentAnswer[]>([]),
    observation = useRef<EyeObservation>();
  const observe = useCallback((stats: EyeObservation) => {
    observation.current = stats;
  }, []);
  const clock = useTestClock();
  const isWord = index < READING_ITEMS.length;
  const word = READING_ITEMS[index];
  const meaning = MEANING_ITEMS[index - READING_ITEMS.length];
  const next = (answer: AssessmentAnswer) => {
    answers.current.push(answer);
    if (index + 1 === READING_ITEMS.length + MEANING_ITEMS.length) {
      onComplete(answers.current, observation.current);
      return;
    }
    setIndex(index + 1);
    setPhase("ready");
    setAssisted(false);
    setDuration(null);
    clock.reset();
  };
  const start = () => {
    setPhase("reading");
    clock.start();
  };
  return (
    <TestCard
      title={isWord ? "Baca dengan suara jelas" : "Baca, lalu jawab"}
      instruction={
        isWord
          ? word.kind === "pseudo"
            ? "Kata rekaan. Ucapkan sesuai hurufnya."
            : "Tekan mulai saat kamu siap."
          : "Jawaban ada dalam bacaan."
      }
      index={index}
      total={READING_ITEMS.length + MEANING_ITEMS.length}
    >
      <ReadingTracker
        active={phase === "reading" && !clock.interrupted}
        onObservation={observe}
        onLoading={setCameraLoading}
      />
      {phase === "ready" ? (
        <button
          className="assessment-primary"
          disabled={cameraLoading}
          onClick={start}
        >
          Mulai baca
        </button>
      ) : (
        <>
          {isWord ? (
            <div className="assessment-word" aria-label="Kata yang dibaca">
              {word.text}
            </div>
          ) : (
            <div className="assessment-passage">
              {PASSAGE.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
          {phase === "reading" && (
            <>
              {clock.interrupted ? (
                <Interrupted onRetry={start} />
              ) : isWord ? (
                <button
                  className="assessment-primary"
                  onClick={() => {
                    setDuration(clock.finish());
                    setPhase("review");
                  }}
                >
                  Sudah dibaca
                </button>
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
                      onClick={() =>
                        next({
                          type: "choice",
                          itemId: meaning.id,
                          option,
                          durationMs: clock.finish(),
                          assisted,
                          audioPlays: 0,
                          interruptions: clock.interruptions.current,
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
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
                  onClick={() =>
                    next({
                      type: "oral",
                      itemId: word.id,
                      verdict: "correct",
                      durationMs,
                      assisted,
                      interruptions: clock.interruptions.current,
                    })
                  }
                >
                  Sesuai
                </button>
                <button
                  className="assessment-secondary"
                  onClick={() =>
                    next({
                      type: "oral",
                      itemId: word.id,
                      verdict: "incorrect",
                      durationMs,
                      assisted,
                      interruptions: clock.interruptions.current,
                    })
                  }
                >
                  Ada kekeliruan
                </button>
              </div>
              <button
                className="assessment-skip"
                onClick={() =>
                  next({
                    type: "oral",
                    itemId: word.id,
                    verdict: "unassessed",
                    durationMs,
                    assisted,
                    interruptions: clock.interruptions.current,
                  })
                }
              >
                Belum bisa dinilai
              </button>
            </div>
          )}
        </>
      )}
      <button
        className="assessment-skip"
        onClick={() => onComplete(answers.current, observation.current)}
      >
        Lewati bagian ini
      </button>
    </TestCard>
  );
}
