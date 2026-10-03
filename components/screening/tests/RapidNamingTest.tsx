"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { QuestionFrame } from "../QuestionFrame";
import { RAPID_NAMING_MAX_MS, rapidNamingQuestions } from "@/lib/screening/questions";
import { average, rapidNamingItemScore } from "@/lib/screening/scoring";

export function RapidNamingTest({ onComplete }: { onComplete: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const scores = useRef<number[]>([]);
  const startedAt = useRef(0);
  const answered = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();
  const limitTimer = useRef<ReturnType<typeof setTimeout>>();
  const q = rapidNamingQuestions[index];

  const finishItem = useCallback(
    (itemScore: number) => {
      clearTimeout(limitTimer.current);
      scores.current.push(itemScore);
      advanceTimer.current = setTimeout(() => {
        if (index + 1 >= rapidNamingQuestions.length) onComplete(average(scores.current));
        else {
          setIndex((n) => n + 1);
          setPicked(null);
        }
      }, 450);
    },
    [index, onComplete],
  );

  // Mulai timer tiap soal baru; lewat 3 detik dianggap tidak dijawab.
  useEffect(() => {
    startedAt.current = performance.now();
    answered.current = false;
    limitTimer.current = setTimeout(() => {
      if (answered.current) return;
      answered.current = true;
      setPicked(-1);
      finishItem(0);
    }, RAPID_NAMING_MAX_MS);
    return () => {
      clearTimeout(limitTimer.current);
      clearTimeout(advanceTimer.current);
    };
  }, [index, finishItem]);

  const choose = (i: number) => {
    if (answered.current) return;
    answered.current = true;
    const used = performance.now() - startedAt.current;
    setPicked(i);
    finishItem(rapidNamingItemScore(used, i === q.correct, RAPID_NAMING_MAX_MS));
  };

  return (
    <QuestionFrame questionKey={index} index={index} total={rapidNamingQuestions.length} label="Ketuk huruf yang sama secepatnya!">
      <div className="card flex flex-col items-center gap-6 p-6">
        <motion.div key={q.letter} initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex h-40 w-40 items-center justify-center rounded-[32px] bg-brand-100 text-9xl font-bold" aria-label={`Huruf ${q.letter}`}>
          {q.letter}
        </motion.div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <motion.div key={`t-${index}`} className="h-full origin-left rounded-full bg-brand-500" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: RAPID_NAMING_MAX_MS / 1000, ease: "linear" }} />
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          {q.options.map((letter, i) => {
            const state = picked === null || picked === -1 ? "" : i === q.correct ? "correct" : i === picked ? "wrong" : "";
            return (
              <button key={`${letter}-${i}`} type="button" disabled={picked !== null} onClick={() => choose(i)} className={`option-card !min-h-[96px] !text-5xl ${state}`}>
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </QuestionFrame>
  );
}
