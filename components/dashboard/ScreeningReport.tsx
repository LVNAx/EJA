import { CalendarDays, GraduationCap, HeartHandshake, Info, Lightbulb, RotateCcw, Stethoscope, Users } from "lucide-react";
import { buildRecommendation } from "@/lib/recommendations/build";
import { BRING_TO_CONSULT, CAVEAT_APPROACH, CONTENT_REVIEW, DRAFT_NOTICE, FACTORS_AFFECTING_RESULT, type DimensionBand } from "@/lib/recommendations/content";
import { REFERRAL_GUIDANCE, verifiedProfessionals } from "@/lib/recommendations/professionals";
import { SCREENING_CONFIG } from "@/lib/screening/config";
import { formatDateLong, decimal } from "@/lib/format";
import type { RiskLevel, ScreeningScores } from "@/lib/screening/scoring";
import { DisclaimerNote } from "./DisclaimerNote";
import { RadarChart } from "./RadarChart";
import { RiskBadge } from "./RiskBadge";

export interface ReportData {
  childName: string;
  grade?: number | null;
  completedAt: string;
  scores: ScreeningScores;
  riskScore: number;
  riskLevel: RiskLevel;
  /** Sesi valid sebelumnya, untuk perbandingan di radar. */
  previous?: { scores: ScreeningScores; completedAt: string } | null;
}

const BAND_LABEL: Record<DimensionBand, string> = { good: "Baik", watch: "Perlu dipantau", attention: "Perlu perhatian" };
const BAND_BAR: Record<DimensionBand, string> = { good: "bg-success", watch: "bg-accent-500", attention: "bg-red-500" };
const WEIGHT: Record<string, number> = SCREENING_CONFIG.weights;

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-neutral-700">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Laporan hasil untuk orang tua: tingkat risiko, radar, penjelasan awam, saran, dan disclaimer (FR-20). Tidak untuk anak (FR-19). */
export function ScreeningReport({ data, actions }: { data: ReportData; actions?: React.ReactNode }) {
  const rec = buildRecommendation(data.scores, data.riskLevel);
  const name = data.childName;

  return (
    <div className="flex flex-col gap-6">
      {/* Kop khusus cetak/PDF */}
      <div className="hidden print:block">
        <p className="text-lg font-bold">EJA - Laporan Skrining</p>
        <p className="text-sm">{name}{data.grade ? `, kelas ${data.grade}` : ""} · Tanggal tes: {formatDateLong(data.completedAt)}</p>
      </div>

      {/* Ringkasan */}
      <section className="card flex flex-col gap-4 p-6 md:p-8" aria-labelledby="ringkasan">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500"><CalendarDays size={14} aria-hidden="true" /> Skrining {formatDateLong(data.completedAt)}</p>
            <h1 id="ringkasan" className="mt-1 text-3xl font-bold md:text-4xl">Hasil skrining {name}</h1>
          </div>
          {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={rec.level} size="lg" />
          <span className="text-sm font-semibold text-neutral-600">Skor gabungan {decimal(data.riskScore)} dari 1,00</span>
        </div>
        <p className="text-xl font-semibold">{rec.meaning}</p>
        <p className="max-w-3xl text-neutral-700">{rec.reassurance}</p>
        {rec.escalationNote && (
          <p className="flex gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700">
            <Info size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" /> {rec.escalationNote}
          </p>
        )}
        <DisclaimerNote />
      </section>

      {/* Radar + penjelasan per dimensi */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]" aria-label="Profil empat dimensi">
        <div className="card flex flex-col gap-3 p-6">
          <h2 className="text-xl font-bold">Profil empat dimensi</h2>
          <p className="text-sm text-neutral-600">Semakin jauh ke tepi, semakin baik kemampuan pada dimensi itu.</p>
          <RadarChart scores={data.scores} previous={data.previous?.scores} currentLabel={formatDateLong(data.completedAt)} previousLabel={data.previous ? formatDateLong(data.previous.completedAt) : undefined} />
        </div>

        <div className="card flex flex-col gap-5 p-6">
          <h2 className="text-xl font-bold">Artinya apa?</h2>
          {rec.dimensions.map((d) => (
            <div key={d.key}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="font-bold">{d.label} <span className="text-xs font-medium text-neutral-500">· bobot {Math.round(WEIGHT[d.key] * 100)}%</span></h3>
                <span className="text-sm font-bold">{d.pct}% <span className="font-semibold text-neutral-600">· {BAND_LABEL[d.band]}{d.sharp ? ", sangat rendah" : ""}</span></span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
                <div className={`h-full rounded-full ${BAND_BAR[d.band]}`} style={{ width: `${d.pct}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-neutral-700">{d.meaning}</p>
              <p className="mt-1 text-xs text-neutral-500">{d.measures}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara belajar yang mungkin cocok */}
      {rec.helpfulApproaches.length > 0 && (
        <section className="card flex flex-col gap-3 p-6" aria-labelledby="cara-belajar">
          <h2 id="cara-belajar" className="flex items-center gap-2 text-xl font-bold"><Lightbulb size={22} className="text-accent-600" aria-hidden="true" /> Cara belajar yang kemungkinan cocok</h2>
          <List items={rec.helpfulApproaches} />
          <p className="text-xs text-neutral-500">{CAVEAT_APPROACH}</p>
        </section>
      )}

      {/* Saran konkret */}
      <section className="grid gap-6 md:grid-cols-2" aria-label="Saran">
        <div className="card flex flex-col gap-3 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold"><HeartHandshake size={22} className="text-brand-600" aria-hidden="true" /> Yang bisa Anda lakukan</h2>
          <List items={rec.parentActions} />
        </div>
        <div className="card flex flex-col gap-3 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold"><GraduationCap size={22} className="text-brand-600" aria-hidden="true" /> Untuk guru di sekolah</h2>
          <List items={rec.teacherActions} />
        </div>
      </section>

      {/* Konsultasi */}
      <section className="card flex flex-col gap-4 p-6" aria-labelledby="konsultasi">
        <h2 id="konsultasi" className="flex items-center gap-2 text-xl font-bold"><Stethoscope size={22} className="text-brand-600" aria-hidden="true" /> Kapan perlu bertemu profesional</h2>
        <p className="font-semibold">{rec.consult.text}</p>
        {rec.consult.professionals.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {rec.consult.professionals.map((p) => (
              <div key={p.role} className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
                <p className="flex items-center gap-2 font-bold"><Users size={16} aria-hidden="true" /> {p.role}</p>
                <p className="mt-1 text-sm text-neutral-600">{p.note}</p>
              </div>
            ))}
          </div>
        )}
        {rec.consult.urgency !== "monitor" && (
          <>
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-500">Mencari bantuan</p>
              {verifiedProfessionals().length > 0 ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {verifiedProfessionals().map((p) => (
                    <li key={p.name} className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
                      <p className="font-bold">{p.name}</p>
                      <p className="text-sm text-neutral-600">{p.role} · {p.city}</p>
                      <p className="mt-1 text-sm">{p.contact}</p>
                      <p className="mt-1 text-xs text-neutral-500">Diverifikasi oleh {p.verifiedBy}, {p.verifiedAt}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <List items={REFERRAL_GUIDANCE} />
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-500">Bawa saat konsultasi</p>
              <List items={BRING_TO_CONSULT} />
            </div>
          </>
        )}
      </section>

      {/* Ulang skrining + faktor */}
      <section className="card flex flex-col gap-4 p-6" aria-labelledby="ulang">
        <h2 id="ulang" className="flex items-center gap-2 text-xl font-bold"><RotateCcw size={22} className="text-brand-600" aria-hidden="true" /> Kapan skrining diulang</h2>
        <p className="text-neutral-700">{rec.retest}</p>
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-500">Hal yang dapat memengaruhi hasil</p>
          <List items={FACTORS_AFFECTING_RESULT} />
        </div>
      </section>

      {CONTENT_REVIEW.status === "draft" && <p role="note" className="text-center text-xs text-neutral-500">{DRAFT_NOTICE}</p>}
      <DisclaimerNote />
    </div>
  );
}
