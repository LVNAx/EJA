"use client";

import { useEffect, useRef, useState } from "react";
import { QuestionFrame } from "../QuestionFrame";
import { SpeakButton } from "../SpeakButton";
import { Illustration } from "../Illustration";
import { phonologicalQuestions } from "@/lib/screening/questions";

export function PhonologicalTest({
  onComplete,
}: {
  onComplete: (score: number, responseMs: number[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const correctCount = useRef(0);
  const shownAt = useRef(0);
  const times = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const q = phonologicalQuestions[index];

  useEffect(() => () => clearTimeout(timer.current), []);
  // Waktu respons dihitung sejak soal tampil (FR-16).
  useEffect(() => {
    shownAt.current = performance.now();
  }, [index]);

  const choose = (i: number) => {
    if (picked !== null || !heard) return;
    times.current.push(performance.now() - shownAt.current);
    setPicked(i);
    if (i === q.correct) correctCount.current += 1;
    timer.current = setTimeout(() => {
      if (index + 1 >= phonologicalQuestions.length) {
        onComplete(
          correctCount.current / phonologicalQuestions.length,
          times.current,
        );
      } else {
        setIndex(index + 1);
        setPicked(null);
        setHeard(false);
        setAudioError(false);
      }
    }, 900);
  };

  return (
    <QuestionFrame
      questionKey={index}
      index={index}
      total={phonologicalQuestions.length}
      label="Dengarkan bunyi awalnya"
    >
      <div className="card flex flex-col items-center gap-6 p-6">
        <p className="text-center text-lg font-semibold">
          Dengarkan kata. Pilih gambar dengan bunyi awal yang sama.
        </p>
        <p className="text-center text-sm text-neutral-600">
          Perhatikan bunyi pertama pada nama gambar.
        </p>
        <SpeakButton
          key={index}
          text={q.audio}
          onHeard={() => {
            setHeard(true);
            setAudioError(false);
          }}
          onUnavailable={() => setAudioError(true)}
        />
        {!heard && (
          <p role="status" className="text-center text-sm text-neutral-600">
            {audioError
              ? "Pilihan dibuka setelah kata berhasil dibacakan. Kamu boleh kembali dan melanjutkan nanti."
              : "Dengarkan kata sampai selesai, lalu pilih jawaban."}
          </p>
        )}
        <div className="grid w-full grid-cols-2 gap-3">
          {q.options.map((o, i) => {
            const state =
              picked === null
                ? ""
                : i === q.correct
                  ? "correct"
                  : i === picked
                    ? "wrong"
                    : "";
            return (
              <button
                key={o.label}
                type="button"
                disabled={picked !== null || !heard}
                onClick={() => choose(i)}
                className={`option-card ${state}`}
                aria-label={o.label}
              >
                <Illustration name={o.art} size={72} />
                <span className="text-sm text-neutral-600">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </QuestionFrame>
  );
}
