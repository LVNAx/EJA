import Link from "next/link";
import { BookOpen, CalendarDays, Clock, Flame, Mic, PenLine, Trophy, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { decimal, formatDateLong, formatDateShort, minutesText, pct, relativeDays } from "@/lib/format";
import {
  activityByDay,
  daysSince,
  learningStreak,
  practiceSummary,
  quizAccuracy,
  quizBySession,
  quizTrend,
  sessionsThisWeek,
  topicsLearned,
  totalMinutes,
  weakTopics,
} from "@/lib/dashboard/metrics";
import type { ChildData, ScreeningRecord } from "@/lib/dashboard/types";
import { ActivityChart } from "./ActivityChart";
import { QuizTrendChart } from "./QuizTrendChart";
import { RiskBadge } from "./RiskBadge";
import { StatTile } from "./StatTile";

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-5 text-neutral-600">{children}</p>;
}

/** Riwayat tes sebelumnya (FR-51). Tiap baris membuka laporan sesi itu. */
export function ScreeningHistory({ childId, screenings }: { childId: string; screenings: ScreeningRecord[] }) {
  const sorted = [...screenings].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  return (
    <section className="card flex flex-col gap-3 p-6" aria-labelledby="riwayat-skrining">
      <h2 id="riwayat-skrining" className="flex items-center gap-2 text-xl font-bold"><CalendarDays size={22} className="text-brand-600" aria-hidden="true" /> Riwayat skrining</h2>
      {sorted.length === 0 ? (
        <Empty>Belum ada skrining.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((s) => (
            <li key={s.id}>
              <Link href={`${ROUTES.childScreeningReport(childId)}?s=${s.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 transition-colors hover:border-brand-400">
                <span className="font-semibold">{formatDateLong(s.completedAt)}</span>
                {s.isValid ? (
                  <span className="flex items-center gap-3"><span className="text-sm text-neutral-600">Skor {decimal(s.riskScore)}</span><RiskBadge level={s.riskLevel} size="sm" /></span>
                ) : (
                  <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">Perlu diulang</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Monitoring belajar (FR-52): topik, durasi sesi, tanggal sesi terakhir, dan grafik frekuensi. */
export function LearningMonitor({ data, now }: { data: ChildData; now: number }) {
  const { sessions } = data;
  const topics = topicsLearned(sessions);
  const last = sessions.map((s) => s.startedAt).sort().at(-1);
  const streak = learningStreak(sessions, now);
  const xp = sessions.reduce((s, x) => s + x.xp, 0);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="monitoring-belajar">
      <h2 id="monitoring-belajar" className="flex items-center gap-2 text-2xl font-bold"><BookOpen size={24} className="text-brand-600" aria-hidden="true" /> Monitoring belajar</h2>
      {sessions.length === 0 ? (
        <Empty>{data.profile.name} belum memulai pelajaran. Data akan muncul di sini setelah sesi belajar pertama.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile Icon={CalendarDays} label="Sesi minggu ini" value={String(sessionsThisWeek(sessions, now))} hint={last ? `Terakhir ${relativeDays(daysSince(last, now))}` : undefined} />
            <StatTile Icon={Flame} label="Hari beruntun" value={`${streak} hari`} />
            <StatTile Icon={Clock} label="Waktu belajar" value={minutesText(totalMinutes(sessions))} hint="8 minggu terakhir" />
            <StatTile Icon={Trophy} label="Total XP" value={String(xp)} />
          </div>
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-bold">Frekuensi belajar 14 hari terakhir</h3>
            <ActivityChart days={activityByDay(sessions, now, 14)} />
          </div>
          <div className="card overflow-x-auto p-6">
            <h3 className="mb-3 text-lg font-bold">Topik yang dipelajari</h3>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead><tr className="border-b border-neutral-200 text-neutral-500"><th className="py-2 pr-3 font-semibold">Topik</th><th className="py-2 pr-3 font-semibold">Mata pelajaran</th><th className="py-2 pr-3 text-right font-semibold">Sesi</th><th className="py-2 pr-3 text-right font-semibold">Durasi</th><th className="py-2 text-right font-semibold">Terakhir</th></tr></thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.lessonId} className="border-b border-neutral-100 last:border-0">
                    <th className="py-2.5 pr-3 font-semibold">{t.title}</th>
                    <td className="py-2.5 pr-3 text-neutral-600">{t.subject}{t.unit ? ` · ${t.unit}` : ""}</td>
                    <td className="py-2.5 pr-3 text-right">{t.sessions}</td>
                    <td className="py-2.5 pr-3 text-right">{minutesText(Math.round(t.minutes))}</td>
                    <td className="py-2.5 text-right text-neutral-600">{formatDateShort(t.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/** Hasil kuis (FR-53): persentase benar, topik yang sering salah, dan tren. */
export function QuizResults({ data, now }: { data: ChildData; now: number }) {
  const acc = quizAccuracy(data.quizzes);
  const trend = quizTrend(data.quizzes, now);
  const points = quizBySession(data.quizzes, data.sessions).slice(-20);
  const weak = weakTopics(data.quizzes, data.sessions);
  const delta = trend.deltaPoints;
  const TrendIcon = delta === null || Math.abs(delta) < 3 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="hasil-kuis">
      <h2 id="hasil-kuis" className="flex items-center gap-2 text-2xl font-bold"><Trophy size={24} className="text-brand-600" aria-hidden="true" /> Hasil kuis</h2>
      {acc === null ? (
        <Empty>Belum ada kuis yang dikerjakan.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="card flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Benar pada percobaan pertama</p>
                <p className="text-4xl font-bold">{pct(acc)}</p>
              </div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
                <TrendIcon size={18} aria-hidden="true" />
                {delta === null ? "Tren belum cukup data" : `${delta > 0 ? "+" : ""}${delta} poin dibanding minggu lalu`}
              </p>
            </div>
            <QuizTrendChart points={points} />
          </div>
          <div className="card flex flex-col gap-3 p-6">
            <h3 className="text-lg font-bold">Topik yang sering salah</h3>
            {weak.length === 0 ? (
              <p className="text-neutral-600">Belum ada topik yang menonjol sulit. Bagus!</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {weak.map((t) => (
                  <li key={t.lessonId} className="rounded-2xl border border-neutral-200 bg-white/80 p-3">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-sm text-neutral-600">{t.subject}{t.unit ? ` · ${t.unit}` : ""}</p>
                    <p className="mt-1 text-sm font-bold">{t.wrong} salah dari {t.answered} soal ({pct(t.accuracy)} benar)</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-neutral-500">Topik ini bisa diajak diulang bersama. Salah pada kuis tidak mengurangi XP.</p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Menulis dan berbicara (FR-54, P1): akurasi, persen suku kata berhasil, kata yang sering diulang. */
export function PracticeResults({ data }: { data: ChildData }) {
  const s = practiceSummary(data.practices);
  return (
    <section className="flex flex-col gap-4" aria-labelledby="latihan">
      <h2 id="latihan" className="flex items-center gap-2 text-2xl font-bold"><PenLine size={24} className="text-brand-600" aria-hidden="true" /> Menulis dan berbicara</h2>
      {data.practices.length === 0 ? (
        <Empty>Belum ada latihan menulis atau berbicara.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatTile Icon={PenLine} label="Akurasi menulis" value={pct(s.writeAccuracy)} hint={`${s.writeCount} latihan`} />
          <StatTile Icon={Mic} label="Suku kata berhasil" value={pct(s.speakSyllableRate)} hint={`${s.speakCount} latihan berbicara`} />
          <div className="card flex flex-col gap-2 p-5">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Kata yang sering diulang</span>
            {s.repeatedWords.length === 0 ? (
              <span className="text-neutral-600">Belum ada.</span>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {s.repeatedWords.map((w) => <li key={w.word} className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">{w.word} · {w.retries}×</li>)}
              </ul>
            )}
            <span className="text-xs text-neutral-500">Bisa menandakan bunyi yang masih sulit.</span>
          </div>
        </div>
      )}
    </section>
  );
}
