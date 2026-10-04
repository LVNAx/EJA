"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Delete } from "lucide-react";
import { FLASH_MS, digitLevels } from "@/lib/screening/questions";
import { digitSpanScore } from "@/lib/screening/scoring";

type Phase = "show" | "input" | "feedback";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function DigitSpanTest({ onComplete }: { onComplete: (score: number) => void }) {
  const [level, setLevel] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("show");
  const [shownIdx, setShownIdx] = useState(-1);
  const [answer, setAnswer] = useState<number[]>([]);
  const [wasCorrect, setWasCorrect] = useState(false);
  const maxSpan = useRef(0);
  const sequence = digitLevels[level][attempt];

  // Flash angka satu per satu (800ms), lalu minta anak mengetik.
  useEffect(() => {
    if (phase !== "show") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setShownIdx(-1);
    setAnswer([]);
    sequence.forEach((_, i) => {
      timers.push(setTimeout(() => setShownIdx(i), 500 + i * (FLASH_MS + 250)));
      timers.push(setTimeout(() => setShownIdx(-1), 500 + i * (FLASH_MS + 250) + FLASH_MS));
    });
    timers.push(setTimeout(() => setPhase("input"), 500 + sequence.length * (FLASH_MS + 250)));
    return () => timers.forEach(clearTimeout);
  }, [phase, sequence, level, attempt]);

  const submit = () => {
    const ok = answer.length === sequence.length && answer.every((d, i) => d === sequence[i]);
    setWasCorrect(ok);
    setPhase("feedback");
    if (ok) maxSpan.current = Math.max(maxSpan.current, sequence.length);

    setTimeout(() => {
      if (ok) {
        if (level + 1 >= digitLevels.length) return onComplete(digitSpanScore(maxSpan.current));
        setLevel(level + 1);
        setAttempt(0);
      } else {
        if (attempt === 1) return onComplete(digitSpanScore(maxSpan.current));
        setAttempt(1);
      }
      setPhase("show");
    }, 1000);
  };

  const press = (d: number) => setAnswer((a) => (a.length < sequence.length ? [...a, d] : a));

  return (
    <div className="card flex w-full flex-col items-center gap-6 p-6">
      <p className="text-center text-lg font-semibold">
        {phase === "show" ? "Perhatikan angkanya baik-baik" : phase === "input" ? "Ketuk angkanya sesuai urutan tadi" : wasCorrect ? (<span className="inline-flex items-center gap-2 text-success-700"><CheckCircle2 size={22} /> Hebat!</span>) : (<span className="inline-flex items-center gap-2">Tidak apa-apa, ayo lanjut <ArrowRight size={20} /></span>)}
      </p>

      {phase === "show" && (
        <div className="flex h-44 w-44 items-center justify-center rounded-[32px] bg-brand-100 text-8xl font-bold" aria-live="polite">
          <AnimatePresence mode="wait">
            {shownIdx >= 0 && (
              <motion.span key={`${level}-${attempt}-${shownIdx}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {sequence[shownIdx]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {phase !== "show" && (
        <>
          <div className="flex min-h-[72px] items-center justify-center gap-2">
            {sequence.map((_, i) => (
              <span key={i} className={`flex h-14 w-12 items-center justify-center rounded-2xl border-2 text-3xl font-bold ${phase === "feedback" ? (wasCorrect ? "border-success bg-success-50" : "border-red-500 bg-red-50") : "border-neutral-200 bg-white"}`}>
                {answer[i] ?? ""}
              </span>
            ))}
          </div>
          {phase === "input" && (
            <>
              <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
                {KEYS.map((k) => (
                  <button key={k} type="button" onClick={() => press(Number(k))} className="option-card !min-h-[64px] !text-3xl">{k}</button>
                ))}
                <button type="button" onClick={() => setAnswer((a) => a.slice(0, -1))} className="option-card !min-h-[64px] !text-2xl" aria-label="Hapus"><Delete size={26} /></button>
                <button type="button" onClick={() => press(0)} className="option-card !min-h-[64px] !text-3xl">0</button>
                <span />
              </div>
              <button type="button" onClick={submit} disabled={answer.length !== sequence.length} className="btn-primary w-full max-w-[300px]">Kirim</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
