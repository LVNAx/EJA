import { SCREENING_CONFIG } from "./config";

export type RiskLevel = "low" | "moderate" | "high";

export interface ScreeningScores {
  phonological: number;
  rapidNaming: number;
  spelling: number;
  digitSpan: number;
}

export type DimensionKey = keyof ScreeningScores;

export const DIMENSION_KEYS: DimensionKey[] = ["phonological", "rapidNaming", "spelling", "digitSpan"];

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export interface RiskAssessment {
  riskScore: number;
  /** Level murni dari skor gabungan, sebelum eskalasi. */
  baseLevel: RiskLevel;
  /** Level akhir yang disimpan dan ditampilkan ke orang tua. */
  riskLevel: RiskLevel;
  escalated: boolean;
  /** Dimensi di bawah ambang eskalasi. */
  sharpDimensions: DimensionKey[];
}

const ORDER: RiskLevel[] = ["low", "moderate", "high"];

export function levelFromScore(riskScore: number): RiskLevel {
  const t = SCREENING_CONFIG.levelThresholds;
  return riskScore > t.low ? "low" : riskScore > t.moderate ? "moderate" : "high";
}

export function assessRisk(scores: ScreeningScores): RiskAssessment {
  const w = SCREENING_CONFIG.weights;
  const riskScore =
    scores.phonological * w.phonological +
    scores.rapidNaming * w.rapidNaming +
    scores.spelling * w.spelling +
    scores.digitSpan * w.digitSpan;

  const baseLevel = levelFromScore(riskScore);
  const sharpDimensions = DIMENSION_KEYS.filter((k) => scores[k] < SCREENING_CONFIG.escalationBelow);
  const raised = ORDER[Math.min(ORDER.indexOf(baseLevel) + 1, ORDER.length - 1)];
  const riskLevel = sharpDimensions.length > 0 ? raised : baseLevel;

  return { riskScore, baseLevel, riskLevel, escalated: riskLevel !== baseLevel, sharpDimensions };
}

export function calculateRiskScore(scores: ScreeningScores): { riskScore: number; riskLevel: RiskLevel } {
  const { riskScore, riskLevel } = assessRisk(scores);
  return { riskScore, riskLevel };
}

export function rapidNamingItemScore(timeUsedMs: number, isCorrect: boolean, maxMs: number = SCREENING_CONFIG.rapidNaming.maxMs): number {
  const w = SCREENING_CONFIG.rapidNaming.speedWeight;
  const speed = Math.max(0, 1 - timeUsedMs / maxMs);
  return speed * w + (isCorrect ? 1 - w : 0);
}

export function digitSpanScore(maxSpan: number): number {
  const { floor, range } = SCREENING_CONFIG.digitSpan;
  return clamp01((maxSpan - floor) / range);
}

export function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export const DISCLAIMER =
  "Hasil ini bukan diagnosis medis. Hanya psikolog klinis atau dokter anak tumbuh kembang yang dapat menegakkan diagnosis disleksia. Gunakan hasil ini sebagai bahan diskusi dengan profesional.";
