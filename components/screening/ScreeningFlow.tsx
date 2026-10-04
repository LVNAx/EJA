"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Ear, Gamepad2, PartyPopper, PenLine, Star, Zap, type LucideIcon } from "lucide-react";
import { AuroraBackground } from "./AuroraBackground";
import { StepProgress } from "./StepProgress";
import { PhonologicalTest } from "./tests/PhonologicalTest";
import { RapidNamingTest } from "./tests/RapidNamingTest";
import { SpellingTest } from "./tests/SpellingTest";
import { DigitSpanTest } from "./tests/DigitSpanTest";
import { saveScreening } from "@/app/screening/[childId]/actions";
import { assessRisk, type ScreeningScores } from "@/lib/screening/scoring";
import { evaluateSessionQuality, type ResponseTimings } from "@/lib/screening/quality";
import { ROUTES } from "@/lib/routes";

type Stage = "intro" | "i1" | "t1" | "i2" | "t2" | "i3" | "t3" | "i4" | "t4" | "saving" | "done";

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

/**
 * `demo` = kunjungan dari halaman depan tanpa akun: hasil ditampilkan lewat sessionStorage.
 * Pada anak sungguhan, anak TIDAK melihat tingkat risiko (FR-19); hasil hanya ada di dasbor orang tua.
 */
export function ScreeningFlow({ childId, childName, demo }: { childId: string; childName: string; demo: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [scores, setScores] = useState<Partial<ScreeningScores>>({});
  const [timings, setTimings] = useState<ResponseTimings>({ phonological: [], rapidNaming: [], spelling: [] });
  const [final, setFinal] = useState<ScreeningScores | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = async (all: ScreeningScores, t: ResponseTimings) => {
    setSaveError(null);
    setStage("saving");

    if (demo) {
      const { riskScore, riskLevel } = assessRisk(all);
      const quality = evaluateSessionQuality(t);
      try {
        sessionStorage.setItem(`eja-screening-${childId}`, JSON.stringify({ scores: all, riskScore, riskLevel, completedAt: new Date().toISOString(), valid: quality.valid, invalidReason: quality.reason }));
      } catch {
        /* sessionStorage tidak tersedia */
      }
      router.push(`/screening/${childId}/result`);
      return;
    }

    try {
      const res = await saveScreening(childId, all, t);
      if (res.ok) setStage("done");
      else setSaveError(res.error ?? "Tidak diketahui");
    } catch {
      setSaveError("Koneksi bermasalah");
    }
  };

  const done = (key: keyof ScreeningScores, next: Stage) => (value: number, responseMs?: number[]) => {
    const merged = { ...scores, [key]: value };
    setScores(merged);
    const t = key === "digitSpan" || !responseMs ? timings : { ...timings, [key]: responseMs };
    setTimings(t);
    if (key === "digitSpan") {
      setFinal(merged as ScreeningScores);
      void save(merged as ScreeningScores, t);
    } else setStage(next);
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

          {stage === "saving" && !saveError && (
            <div className="card flex flex-col items-center gap-4 p-8 text-center" role="status">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}><Star size={56} className="fill-accent-500 text-accent-500" /></motion.span>
              <p className="text-lg font-semibold">Hebat! Sedang menyimpan hasilmu…</p>
            </div>
          )}

          {stage === "saving" && saveError && (
            <div className="card flex flex-col items-center gap-4 p-8 text-center" role="alert">
              <p className="text-lg font-semibold">Hasilmu belum tersimpan.</p>
              <p className="text-neutral-600">Minta tolong orang dewasa, lalu ketuk tombol di bawah.</p>
              <p className="text-xs text-neutral-500">Catatan untuk orang tua: {saveError}</p>
              <button type="button" className="btn-primary w-full" onClick={() => final && void save(final, timings)}>Coba simpan lagi</button>
            </div>
          )}

          {stage === "done" && (
            <div className="card flex flex-col items-center gap-5 p-8 text-center">
              <IconBadge Icon={PartyPopper} />
              <h2 className="text-3xl font-bold">Kamu hebat, {childName}!</h2>
              <p className="text-neutral-600">Semua permainan sudah selesai. Yuk lanjut belajar.</p>
              <Link href={ROUTES.childHome(childId)} className="btn-primary w-full">Mulai Belajar</Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
