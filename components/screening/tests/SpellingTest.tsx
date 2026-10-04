"use client";

import { useEffect, useRef, useState } from "react";
import { QuestionFrame } from "../QuestionFrame";
import { SpeakButton } from "../SpeakButton";
import { spellingQuestions } from "@/lib/screening/questions";

export function SpellingTest({ onComplete }: { onComplete: (score: number, responseMs: number[]) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const correctCount = useRef(0);
  const shownAt = useRef(0);
  const times = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const q = spellingQuestions[index];

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    shownAt.current = performance.now();
  }, [index]);

  const choose = (i: number) => {
    if (picked !== null) return;
    times.current.push(performance.now() - shownAt.current);
    setPicked(i);
    if (i === q.correct) correctCount.current += 1;
    timer.current = setTimeout(() => {
      if (index + 1 >= spellingQuestions.length) onComplete(correctCount.current / spellingQuestions.length, times.current);
      else {
        setIndex(index + 1);
        setPicked(null);
      }
    }, 900);
  };

  return (
    <QuestionFrame questionKey={index} index={index} total={spellingQuestions.length} label="Dengarkan, lalu pilih tulisan yang benar">
      <div className="card flex flex-col items-center gap-6 p-6">
        <p className="text-center text-lg font-semibold">Tulisan mana yang benar?</p>
        <SpeakButton text={q.audio} fallbackLabel={q.options[q.correct]} />
        <div className="grid w-full grid-cols-1 gap-3">
          {q.options.map((o, i) => {
            const state = picked === null ? "" : i === q.correct ? "correct" : i === picked ? "wrong" : "";
            return (
              <button key={`${o}-${i}`} type="button" disabled={picked !== null} onClick={() => choose(i)} className={`option-card !min-h-[64px] !text-2xl tracking-widest ${state}`}>
                {o}
              </button>
            );
          })}
        </div>
      </div>
    </QuestionFrame>
  );
}
