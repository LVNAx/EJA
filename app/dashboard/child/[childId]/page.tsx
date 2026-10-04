import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { ChildModeButton } from "@/components/dashboard/ChildModeButton";
import { DisclaimerNote } from "@/components/dashboard/DisclaimerNote";
import { LearningMonitor, PracticeResults, QuizResults, ScreeningHistory } from "@/components/dashboard/ChildSections";
import { NotificationList } from "@/components/dashboard/NotificationList";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { loadChild } from "@/lib/dashboard/data";
import { MAX_SCREENINGS_PER_DAY } from "@/lib/screening/config";
import { buildNotifications, deriveChildStatus, latestScreening, latestValidScreening, screeningsToday } from "@/lib/dashboard/metrics";
import { buildRecommendation } from "@/lib/recommendations/build";
import { formatDateLong } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export default async function ChildDashboardPage({ params }: { params: { childId: string } }) {
  const { child, now, readIds } = await loadChild(params.childId);
  if (!child) notFound();

  const { profile } = child;
  const status = deriveChildStatus(child);
  const latest = latestValidScreening(child.screenings);
  const newest = latestScreening(child.screenings);
  const rec = latest ? buildRecommendation(latest.scores, latest.riskLevel) : null;
  const notifications = buildNotifications(child, now);
  const limitReached = screeningsToday(child.screenings, now) >= MAX_SCREENINGS_PER_DAY;

  return (
    <div className="flex flex-col gap-8">
      <div className="pt-2">
        <Link href={ROUTES.dashboard} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-ink"><ArrowLeft size={16} aria-hidden="true" /> Semua anak</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{profile.name}</h1>
            <p className="mt-1 text-neutral-600">{[profile.grade ? `Kelas ${profile.grade}` : null, profile.school].filter(Boolean).join(" · ")}</p>
          </div>
          <nav aria-label="Bagian halaman" className="flex flex-wrap gap-2 text-sm font-semibold">
            {[["#profil", "Profil skrining"], ["#belajar", "Belajar"], ["#kuis", "Kuis"], ["#praktik", "Latihan"]].map(([href, label]) => (
              <a key={href} href={href} className="glass rounded-full px-4 py-2 hover:bg-white/80">{label}</a>
            ))}
          </nav>
        </div>
      </div>

      {notifications.length > 0 && <NotificationList items={notifications} readIds={readIds} />}

      {/* Profil skrining */}
      <section id="profil" className="flex flex-col gap-4 scroll-mt-6" aria-labelledby="profil-skrining">
        <h2 id="profil-skrining" className="flex items-center gap-2 text-2xl font-bold"><ClipboardList size={24} className="text-brand-600" aria-hidden="true" /> Profil skrining</h2>
        {latest && rec ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="card flex flex-col gap-3 p-6">
              <RadarChart scores={latest.scores} compact />
            </div>
            <div className="card flex flex-col gap-4 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Skrining {formatDateLong(latest.completedAt)}</p>
              <RiskBadge level={rec.level} size="lg" />
              <p className="text-lg font-semibold">{rec.meaning}</p>
              <p className="text-neutral-700">{rec.consult.text}</p>
              {rec.attention.length > 0 && <p className="text-sm text-neutral-700"><span className="font-bold">Perlu perhatian:</span> {rec.attention.map((d) => d.label).join(", ")}.</p>}
              <Link href={ROUTES.childScreeningReport(profile.id)} className="btn-primary mt-auto self-start !px-6 !py-3 !text-base">Baca laporan lengkap <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        ) : status === "needs-retest" && newest ? (
          <div className="card flex flex-col items-start gap-3 p-6">
            <p className="text-lg font-bold">Skrining terakhir belum bisa dinilai</p>
            <p className="text-neutral-700">{newest.invalidReason ?? "Sesi tidak selesai atau jawabannya terlalu cepat."} Ajak {profile.name} mengulang di waktu ia santai dan fokus.</p>
            <ChildModeButton childId={profile.id} kind="screening" limitReached={limitReached} className="btn-primary !px-6 !py-3 !text-base">Ulangi skrining</ChildModeButton>
          </div>
        ) : (
          <div className="card flex flex-col items-start gap-3 p-6">
            <p className="text-lg font-bold">Belum ada hasil skrining</p>
            <p className="text-neutral-700">Skrining berupa empat permainan singkat. Hasilnya hanya terlihat oleh Anda, bukan oleh {profile.name}.</p>
            <ChildModeButton childId={profile.id} kind="screening" limitReached={limitReached} className="btn-primary !px-6 !py-3 !text-base">Mulai skrining</ChildModeButton>
          </div>
        )}
        <ScreeningHistory childId={profile.id} screenings={child.screenings} />
      </section>

      <div id="belajar" className="scroll-mt-6"><LearningMonitor data={child} now={now} /></div>
      <div id="kuis" className="scroll-mt-6"><QuizResults data={child} now={now} /></div>
      <div id="praktik" className="scroll-mt-6"><PracticeResults data={child} /></div>

      <DisclaimerNote />
    </div>
  );
}
