import Link from "next/link";
import { ArrowRight, ClipboardList, Flame } from "lucide-react";
import { ChildModeButton } from "./ChildModeButton";
import { ROUTES } from "@/lib/routes";
import { pct, relativeDays } from "@/lib/format";
import { MAX_SCREENINGS_PER_DAY } from "@/lib/screening/config";
import { daysSince, deriveChildStatus, lastActivityAt, latestScreening, latestValidScreening, learningStreak, quizAccuracy, screeningsToday, sessionsThisWeek } from "@/lib/dashboard/metrics";
import type { ChildData, ChildStatus } from "@/lib/dashboard/types";
import { RiskBadge } from "./RiskBadge";

const STATUS_TEXT: Record<ChildStatus, string> = {
  "not-screened": "Belum skrining",
  "needs-retest": "Skrining perlu diulang",
  screened: "Sudah skrining",
  learning: "Sedang belajar",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  );
}

/** Ringkasan per anak (FR-50): tingkat risiko terakhir, sesi minggu ini, akurasi kuis, dan hari beruntun. */
export function ChildCard({ child, now }: { child: ChildData; now: number }) {
  const { profile } = child;
  const status = deriveChildStatus(child);
  const latest = latestValidScreening(child.screenings);
  const newest = latestScreening(child.screenings);
  const streak = learningStreak(child.sessions, now);
  const last = lastActivityAt(child);

  return (
    <article className="card flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">{profile.name[0]}</span>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-sm text-neutral-600">{[profile.grade ? `Kelas ${profile.grade}` : null, profile.school].filter(Boolean).join(" · ") || "Profil anak"}</p>
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-neutral-700">{STATUS_TEXT[status]}</span>
      </div>

      {latest ? (
        <div className="flex flex-wrap items-center gap-2"><RiskBadge level={latest.riskLevel} /><span className="text-sm text-neutral-600">Skrining terakhir {relativeDays(daysSince(latest.completedAt, now))}</span></div>
      ) : newest && !newest.isValid ? (
        <p className="rounded-2xl border border-accent-300 bg-accent-50 p-3 text-sm font-medium">Sesi skrining terakhir belum bisa dinilai. {newest.invalidReason ?? ""} Ajak {profile.name} mengulang.</p>
      ) : (
        <p className="rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm font-medium">Belum ada hasil skrining. Mulai skrining untuk melihat profil kemampuan {profile.name}.</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Sesi minggu ini" value={String(sessionsThisWeek(child.sessions, now))} />
        <Metric label="Akurasi kuis" value={pct(quizAccuracy(child.quizzes))} />
        <div className="rounded-2xl bg-white/70 p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Hari beruntun</p>
          <p className="mt-0.5 flex items-center gap-1 text-xl font-bold"><Flame size={18} className={streak > 0 ? "text-accent-600" : "text-neutral-400"} aria-hidden="true" />{streak}</p>
        </div>
      </div>

      {last && <p className="text-xs text-neutral-500">Terakhir aktif {relativeDays(daysSince(last, now))}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Link href={ROUTES.childDashboard(profile.id)} className="btn-primary !px-5 !py-2.5 !text-base">Lihat dasbor <ArrowRight size={16} aria-hidden="true" /></Link>
        {status === "not-screened" || status === "needs-retest" ? (
          <ChildModeButton childId={profile.id} kind="screening" limitReached={screeningsToday(child.screenings, now) >= MAX_SCREENINGS_PER_DAY} className="btn-ghost"><ClipboardList size={16} aria-hidden="true" /> {status === "needs-retest" ? "Ulangi skrining" : "Mulai skrining"}</ChildModeButton>
        ) : (
          <Link href={ROUTES.childScreeningReport(profile.id)} className="btn-ghost">Laporan skrining</Link>
        )}
      </div>
    </article>
  );
}
