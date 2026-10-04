"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { AuroraBackground } from "./AuroraBackground";
import { DISCLAIMER, RISK_COPY, type RiskLevel, type ScreeningScores } from "@/lib/screening/scoring";

export interface ResultData {
  scores: ScreeningScores;
  riskScore: number;
  riskLevel: RiskLevel;
}

const DIMENSIONS: { key: keyof ScreeningScores; label: string; hint: string; weight: string }[] = [
  { key: "phonological", label: "Kesadaran Bunyi", hint: "Mengenali dan membedakan bunyi bahasa", weight: "35%" },
  { key: "rapidNaming", label: "Penamaan Cepat", hint: "Kecepatan mengenali huruf secara otomatis", weight: "30%" },
  { key: "spelling", label: "Ketepatan Ejaan", hint: "Mengubah bunyi menjadi tulisan", weight: "20%" },
  { key: "digitSpan", label: "Memori Kerja", hint: "Mengingat urutan angka sesaat", weight: "15%" },
];

export function ScreeningResult({ childId, childName, initial }: { childId: string; childName: string; initial: ResultData | null }) {
  const [data, setData] = useState<ResultData | null>(initial);
  const [checked, setChecked] = useState(Boolean(initial));

  useEffect(() => {
    if (!initial) {
      try {
        const raw = sessionStorage.getItem(`eja-screening-${childId}`);
        if (raw) setData(JSON.parse(raw) as ResultData);
      } catch {
        /* abaikan */
      }
    }
    setChecked(true);
  }, [childId, initial]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-8">
      <AuroraBackground />
      {!checked && <div className="card p-8 text-center">Memuat hasil…</div>}

      {checked && !data && (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold">Belum ada hasil skrining untuk {childName}.</p>
          <Link href={`/screening/${childId}`} className="btn-primary">Mulai Skrining</Link>
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Hasil skrining {childName}</p>
            <span className={`rounded-full border px-6 py-2 text-xl font-bold ${RISK_COPY[data.riskLevel].badge}`}>{RISK_COPY[data.riskLevel].label}</span>
            <p className="text-neutral-600">{RISK_COPY[data.riskLevel].text(childName)}</p>
          </div>

          <div className="card flex flex-col gap-5 p-6">
            <h2 className="text-xl font-bold">Skor per dimensi</h2>
            {DIMENSIONS.map((d, i) => {
              const pct = Math.round(data.scores[d.key] * 100);
              return (
                <div key={d.key}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="font-semibold">{d.label} <span className="text-xs font-medium text-neutral-400">· bobot {d.weight}</span></span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
                    <motion.div className="h-full rounded-full bg-accent-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.15 * i }} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{d.hint}</p>
                </div>
              );
            })}
            <p className="text-xs text-neutral-500">Semakin tinggi skor, semakin baik kemampuan pada dimensi tersebut.</p>
          </div>

          <p className="flex gap-3 rounded-card border border-accent-300 bg-accent-50 p-4 text-sm font-medium"><TriangleAlert size={20} className="mt-0.5 shrink-0 text-accent-600" />{DISCLAIMER}</p>

          <Link href={`/child/${childId}`} className="btn-primary w-full">Mulai Belajar</Link>
        </motion.div>
      )}
    </main>
  );
}
