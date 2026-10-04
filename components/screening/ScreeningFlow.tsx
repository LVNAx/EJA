"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Ear, Gamepad2, PenLine, Star, Zap, type LucideIcon } from "lucide-react";
import { AuroraBackground } from "./AuroraBackground";
import { StepProgress } from "./StepProgress";
import { PhonologicalTest } from "./tests/PhonologicalTest";
import { RapidNamingTest } from "./tests/RapidNamingTest";
import { SpellingTest } from "./tests/SpellingTest";
import { DigitSpanTest } from "./tests/DigitSpanTest";
import { saveScreening } from "@/app/screening/[childId]/actions";
import { calculateRiskScore, type ScreeningScores } from "@/lib/screening/scoring";

type Stage = "intro" | "i1" | "t1" | "i2" | "t2" | "i3" | "t3" | "i4" | "t4" | "saving";

const INTROS: Record<1 | 2 | 3 | 4, { Icon: LucideIcon; title: string; text: string }> = {
  1: { Icon: Ear, title: "Dengarkan Bunyi", text: "Kamu akan mendengar sebuah kata. Pilih gambar yang bunyi awalnya sama." },
  2: { Icon: Zap, title: "Sebutkan Cepat!", text: "Sebuah huruf besar muncul. Ketuk huruf yang sama secepat mungkin." },
  3: { Icon: PenLine, title: "Tulisan yang Benar", text: "Dengarkan kata, lalu pilih tulisan yang benar." },
  4: { Icon: Brain, title: "Ingat Urutannya", text: "Angka muncul satu per satu. Ingat urutannya, lalu ketuk angkanya." },
};

const stageNumber = (s: Stage): 1 | 2 | 3 | 4 | null => {
  const m = /^[it]([1-4])$/.exec(s);
  return m ? (Number(m[1]) as 1 | 2 | 3 | 4) : null;
};

function IconBadge({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.4)]">
      <Icon size={38} strokeWidth={2.2} />
    </span>
  );
}

export function ScreeningFlow({ childId, childName }: { childId: string; childName: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [scores, setScores] = useState<Partial<ScreeningScores>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const finish = (all: ScreeningScores) => {
    setStage("saving");
    startTransition(async () => {
      const res = await saveScreening(childId, all);
      const local = calculateRiskScore(all);
      try {
        sessionStorage.setItem(`eja-screening-${childId}`, JSON.stringify({ scores: all, ...local, saved: res.ok }));
      } catch {
        /* sessionStorage tidak tersedia */
      }
      if (!res.ok) setError(res.error ?? null);
      router.push(`/screening/${childId}/result`);
    });
  };

  const done = (key: keyof ScreeningScores, next: Stage) => (value: number) => {
    const merged = { ...scores, [key]: value };
    setScores(merged);
    if (key === "digitSpan") finish(merged as ScreeningScores);
    else setStage(next);
  };

  const n = stageNumber(stage);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-6">
      <AuroraBackground />
      {n && <StepProgress current={n} />}

      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }} className="flex flex-1 flex-col justify-center">
          {stage === "intro" && (
            <div className="card flex flex-col items-center gap-5 p-8 text-center">
              <IconBadge Icon={Gamepad2} />
              <h1 className="text-3xl font-bold leading-tight">Halo, <span className="marker">{childName}</span>!</h1>
              <p className="text-neutral-600">Yuk main 4 permainan seru. Tidak ada nilai jelek, kerjakan sebisa kamu ya.</p>
              <button type="button" className="btn-primary w-full" onClick={() => setStage("i1")}>Ayo Mulai</button>
            </div>
          )}

          {(stage === "i1" || stage === "i2" || stage === "i3" || stage === "i4") && n && (
            <div className="card flex flex-col items-center gap-5 p-8 text-center">
              <IconBadge Icon={INTROS[n].Icon} />
              <h2 className="text-2xl font-bold">{INTROS[n].title}</h2>
              <p className="text-neutral-600">{INTROS[n].text}</p>
              <button type="button" className="btn-primary w-full" onClick={() => setStage(`t${n}` as Stage)}>Mulai</button>
            </div>
          )}

          {stage === "t1" && <PhonologicalTest onComplete={done("phonological", "i2")} />}
          {stage === "t2" && <RapidNamingTest onComplete={done("rapidNaming", "i3")} />}
          {stage === "t3" && <SpellingTest onComplete={done("spelling", "i4")} />}
          {stage === "t4" && <DigitSpanTest onComplete={done("digitSpan", "saving")} />}

          {stage === "saving" && (
            <div className="card flex flex-col items-center gap-4 p-8 text-center" role="status">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}><Star size={56} className="fill-accent-500 text-accent-500" /></motion.span>
              <p className="text-lg font-semibold">Hebat! Sedang menyimpan hasilmu…</p>
              {error && <p className="text-sm text-neutral-500">Catatan: hasil belum tersimpan ke server ({error}).</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
