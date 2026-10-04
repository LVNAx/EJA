import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, RotateCcw } from "lucide-react";
import { ChildModeButton } from "@/components/dashboard/ChildModeButton";
import { DisclaimerNote } from "@/components/dashboard/DisclaimerNote";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { ScreeningReport } from "@/components/dashboard/ScreeningReport";
import { loadChild } from "@/lib/dashboard/data";
import { MAX_SCREENINGS_PER_DAY } from "@/lib/screening/config";
import { latestScreening, previousValidScreening, screeningsToday } from "@/lib/dashboard/metrics";
import { ROUTES } from "@/lib/routes";

export default async function ScreeningReportPage({ params, searchParams }: { params: { childId: string }; searchParams: { s?: string } }) {
  const { child, now } = await loadChild(params.childId);
  if (!child) notFound();

  const { profile } = child;
  const limitReached = screeningsToday(child.screenings, now) >= MAX_SCREENINGS_PER_DAY;
  // ?s=<id> membuka sesi dari riwayat; tanpa itu, sesi terbaru.
  const record = (searchParams.s ? child.screenings.find((s) => s.id === searchParams.s) : null) ?? latestScreening(child.screenings);
  const back = (
    <Link href={ROUTES.childDashboard(profile.id)} className="no-print inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-neutral-600 hover:text-ink"><ArrowLeft size={16} aria-hidden="true" /> Dasbor {profile.name}</Link>
  );

  if (!record) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <ClipboardList size={48} className="text-brand-500" strokeWidth={1.6} aria-hidden="true" />
          <h1 className="text-2xl font-bold">Belum ada hasil skrining untuk {profile.name}</h1>
          <p className="max-w-md text-neutral-600">Skrining berupa empat permainan singkat dan hasilnya hanya terlihat oleh Anda.</p>
          <ChildModeButton childId={profile.id} kind="screening" limitReached={limitReached} className="btn-primary">Mulai skrining</ChildModeButton>
        </div>
        <DisclaimerNote />
      </div>
    );
  }

  // Sesi tidak valid tidak menghasilkan status (BR-04): tampilkan alasan dan tawaran ulang.
  if (!record.isValid) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <div className="card flex flex-col items-start gap-4 p-8">
          <RotateCcw size={36} className="text-accent-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Skrining ini belum bisa dinilai</h1>
          <p className="max-w-2xl text-neutral-700">{record.invalidReason ?? "Sesi tidak selesai atau terlalu banyak jawaban yang sangat cepat, sehingga hasilnya belum bisa dipercaya."} Ini bukan salah {profile.name}. Coba lagi saat ia santai dan fokus.</p>
          <ChildModeButton childId={profile.id} kind="screening" limitReached={limitReached} className="btn-primary">Ulangi skrining</ChildModeButton>
        </div>
        <DisclaimerNote />
      </div>
    );
  }

  const prev = previousValidScreening(child.screenings, record);

  return (
    <div className="flex flex-col gap-4">
      {back}
      <ScreeningReport
        data={{
          childName: profile.name,
          grade: profile.grade,
          completedAt: record.completedAt,
          scores: record.scores,
          riskScore: record.riskScore,
          riskLevel: record.riskLevel,
          previous: prev ? { scores: prev.scores, completedAt: prev.completedAt } : null,
        }}
        actions={<PrintButton />}
      />
    </div>
  );
}
