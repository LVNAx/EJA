export type RiskLevel = "low" | "moderate" | "high";

export interface ScreeningScores {
  phonological: number;
  rapidNaming: number;
  spelling: number;
  digitSpan: number;
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function calculateRiskScore(scores: ScreeningScores): { riskScore: number; riskLevel: RiskLevel } {
  const riskScore =
    scores.phonological * 0.35 +
    scores.rapidNaming * 0.3 +
    scores.spelling * 0.2 +
    scores.digitSpan * 0.15;

  const riskLevel: RiskLevel = riskScore > 0.75 ? "low" : riskScore > 0.45 ? "moderate" : "high";
  return { riskScore, riskLevel };
}

export function rapidNamingItemScore(timeUsedMs: number, isCorrect: boolean, maxMs = 3000): number {
  const speed = Math.max(0, 1 - timeUsedMs / maxMs);
  return speed * 0.5 + (isCorrect ? 0.5 : 0);
}

export function digitSpanScore(maxSpan: number): number {
  return clamp01((maxSpan - 2) / 5);
}

export function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export const RISK_COPY: Record<RiskLevel, { label: string; badge: string; text: (name: string) => string }> = {
  low: {
    label: "Risiko Rendah",
    badge: "bg-success-50 text-success-700 border-success",
    text: (n) => `Kemampuan membaca ${n} berada di rentang normal. Tetap pantau perkembangannya secara berkala.`,
  },
  moderate: {
    label: "Risiko Sedang",
    badge: "bg-accent-100 text-accent-600 border-accent-300",
    text: (n) => `Terdapat indikasi kesulitan membaca pada ${n}. Disarankan latihan rutin dan konsultasi ke guru.`,
  },
  high: {
    label: "Risiko Tinggi",
    badge: "bg-red-50 text-red-600 border-red-200",
    text: (n) => `Terdapat indikasi kuat disleksia pada ${n}. Sangat disarankan konsultasi dengan psikolog klinis atau dokter anak tumbuh kembang.`,
  },
};

export const DISCLAIMER =
  "Hasil ini bukan diagnosis medis. Hanya psikolog klinis atau dokter anak tumbuh kembang yang dapat menegakkan diagnosis disleksia.";
