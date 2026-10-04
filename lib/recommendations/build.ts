import { SCREENING_CONFIG } from "@/lib/screening/config";
import { DIMENSION_KEYS, assessRisk, type DimensionKey, type RiskAssessment, type RiskLevel, type ScreeningScores } from "@/lib/screening/scoring";
import { DIMENSION_COPY, LEVEL_COPY, PROFESSIONALS, type DimensionBand } from "./content";

export interface DimensionInsight {
  key: DimensionKey;
  label: string;
  short: string;
  score: number;
  pct: number;
  band: DimensionBand;
  /** Di bawah ambang eskalasi (sangat rendah). */
  sharp: boolean;
  measures: string;
  meaning: string;
}

export interface Recommendation {
  level: RiskLevel;
  label: string;
  meaning: string;
  reassurance: string;
  escalationNote: string | null;
  dimensions: DimensionInsight[];
  strengths: DimensionInsight[];
  attention: DimensionInsight[];
  parentActions: string[];
  teacherActions: string[];
  helpfulApproaches: string[];
  consult: { urgency: "monitor" | "consider" | "soon"; text: string; professionals: { role: string; note: string }[] };
  retest: string;
}

export function bandOf(score: number): DimensionBand {
  const b = SCREENING_CONFIG.dimensionBands;
  return score >= b.good ? "good" : score >= b.watch ? "watch" : "attention";
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",");

function escalationNote(a: RiskAssessment, dims: DimensionInsight[]): string | null {
  if (!a.escalated) return null;
  const names = dims.filter((d) => d.sharp).map((d) => d.label.toLowerCase());
  const base = LEVEL_COPY[a.baseLevel].label;
  const final = LEVEL_COPY[a.riskLevel].label;
  return `Skor gabungan ${fmt(a.riskScore)} sebenarnya masuk ${base}. Status dinaikkan satu tingkat menjadi ${final} karena ${names.join(" dan ")} sangat rendah (di bawah ${fmt(SCREENING_CONFIG.escalationBelow)}). Aturan ini mencegah kelemahan yang tajam tertutup oleh rata-rata.`;
}

/**
 * Menyusun rekomendasi dari skor per dimensi. `level` yang tersimpan di DB diutamakan untuk label,
 * tetapi penjelasan eskalasi dihitung ulang dari skor dengan konfigurasi yang sama.
 */
export function buildRecommendation(scores: ScreeningScores, storedLevel?: RiskLevel): Recommendation {
  const assessment = assessRisk(scores);
  const level = storedLevel ?? assessment.riskLevel;
  const copy = LEVEL_COPY[level];

  const dimensions: DimensionInsight[] = DIMENSION_KEYS.map((key) => {
    const score = scores[key];
    const band = bandOf(score);
    const d = DIMENSION_COPY[key];
    return {
      key,
      label: d.label,
      short: d.short,
      score,
      pct: Math.round(score * 100),
      band,
      sharp: score < SCREENING_CONFIG.escalationBelow,
      measures: d.measures,
      meaning: d.meaning[band],
    };
  });

  const attention = dimensions.filter((d) => d.band === "attention").sort((a, b) => a.score - b.score);
  const strengths = dimensions.filter((d) => d.band === "good").sort((a, b) => b.score - a.score);

  // Saran khusus dimensi dikumpulkan dari yang paling lemah, maksimal tiga per daftar supaya tidak membebani.
  const focus = attention.length > 0 ? attention : dimensions.filter((d) => d.band === "watch").sort((a, b) => a.score - b.score);
  const dimParent = focus.flatMap((d) => DIMENSION_COPY[d.key].parentTips.slice(0, 2)).slice(0, 4);
  // Pada Risiko Rendah tidak ada akomodasi sekolah dan tidak ada pendekatan khusus yang disarankan.
  const supportive = level !== "low";
  const dimTeacher = supportive ? focus.flatMap((d) => DIMENSION_COPY[d.key].teacherTips.slice(0, 1)).slice(0, 2) : [];

  const dedupe = (xs: string[]) => Array.from(new Set(xs));

  return {
    level,
    label: copy.label,
    meaning: copy.meaning,
    reassurance: copy.reassurance,
    escalationNote: storedLevel && storedLevel !== assessment.riskLevel ? null : escalationNote(assessment, dimensions),
    dimensions,
    strengths,
    attention,
    parentActions: dedupe([...copy.parentActions, ...dimParent]),
    teacherActions: dedupe([...copy.teacherActions, ...dimTeacher]),
    helpfulApproaches: supportive ? dedupe(focus.map((d) => DIMENSION_COPY[d.key].helpfulApproach)) : [],
    consult: {
      urgency: copy.consultUrgency,
      text: copy.consult,
      professionals: PROFESSIONALS.filter((p) => p.levels.includes(level)).map(({ role, note }) => ({ role, note })),
    },
    retest: copy.retest,
  };
}
