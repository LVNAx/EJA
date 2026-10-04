"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { AuroraBackground } from "./AuroraBackground";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { ScreeningReport } from "@/components/dashboard/ScreeningReport";
import { ROUTES } from "@/lib/routes";
import type { RiskLevel, ScreeningScores } from "@/lib/screening/scoring";

interface StoredResult {
  scores: ScreeningScores;
  riskScore: number;
  riskLevel: RiskLevel;
  completedAt: string;
  valid?: boolean;
  invalidReason?: string | null;
}

/** Hasil tes demo dari halaman depan (tanpa akun, tidak disimpan ke server). Anak sungguhan melihat hasil di dasbor orang tua. */
export function DemoResult({ childId }: { childId: string }) {
  const [data, setData] = useState<StoredResult | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`eja-screening-${childId}`);
      if (raw) setData(JSON.parse(raw) as StoredResult);
    } catch {
      /* abaikan */
    }
    setChecked(true);
  }, [childId]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 py-8">
      <AuroraBackground />
      <p role="status" className="no-print flex items-center gap-2 text-sm font-medium text-brand-700"><FlaskConical size={16} aria-hidden="true" /> Mode demo: hasil ini tidak disimpan. Di EJA, hasil hanya terlihat oleh orang tua di dasbor.</p>

      {!checked && <div className="card p-8 text-center">Memuat hasil…</div>}

      {checked && !data && (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold">Belum ada hasil tes demo.</p>
          <Link href={ROUTES.screening(childId)} className="btn-primary">Mulai tes demo</Link>
        </div>
      )}

      {data && data.valid === false && (
        <div className="card flex flex-col items-start gap-4 p-8">
          <h1 className="text-2xl font-bold">Skrining ini belum bisa dinilai</h1>
          <p className="max-w-2xl text-neutral-700">{data.invalidReason} Coba lagi saat anak santai dan fokus.</p>
          <Link href={ROUTES.screening(childId)} className="btn-primary">Ulangi tes demo</Link>
        </div>
      )}

      {data && data.valid !== false && (
        <ScreeningReport
          data={{ childName: "Anak Anda", completedAt: data.completedAt, scores: data.scores, riskScore: data.riskScore, riskLevel: data.riskLevel }}
          actions={
            <>
              <PrintButton />
              <Link href={ROUTES.screening(childId)} className="btn-ghost">Coba lagi</Link>
              <Link href="/daftar" className="btn-primary !px-6 !py-3 !text-base">Daftar untuk menyimpan</Link>
            </>
          }
        />
      )}
    </main>
  );
}
