import { SCREENING_CONFIG } from "./config";

/** Waktu respons (ms) tiap butir yang dijawab, per tes. Tes memori kerja tidak punya butir bertenggat sehingga tidak dihitung. */
export interface ResponseTimings {
  phonological: number[];
  rapidNaming: number[];
  spelling: number[];
}

export interface SessionQuality {
  valid: boolean;
  /** Teks untuk orang tua bila tidak valid. */
  reason: string | null;
  fastShare: number;
  counted: number;
}

const KEYS: (keyof ResponseTimings)[] = ["phonological", "rapidNaming", "spelling"];

/** FR-18: terlalu banyak jawaban yang terlalu cepat dianggap tebakan, sesi ditandai tidak valid dan tidak menghasilkan status. */
export function evaluateSessionQuality(t: ResponseTimings): SessionQuality {
  let counted = 0;
  let fast = 0;
  for (const k of KEYS) {
    const limit = SCREENING_CONFIG.quality.fastAnswerMs[k];
    for (const ms of t[k] ?? []) {
      if (!Number.isFinite(ms) || ms < 0) continue;
      counted += 1;
      if (ms < limit) fast += 1;
    }
  }
  const fastShare = counted === 0 ? 0 : fast / counted;
  const valid = fastShare <= SCREENING_CONFIG.quality.maxFastShare;
  return {
    valid,
    reason: valid ? null : "Terlalu banyak jawaban yang sangat cepat, sehingga sepertinya jawaban diberikan tanpa mendengarkan atau melihat soal dengan saksama.",
    fastShare,
    counted,
  };
}

/** Batasi input dari klien: jumlah dan nilai wajar, supaya tidak membengkakkan payload atau memutarbalikkan hitungan. */
export function sanitizeTimings(raw: Partial<ResponseTimings> | undefined): ResponseTimings {
  const clean = (xs: unknown): number[] => (Array.isArray(xs) ? xs.slice(0, 50).filter((n): n is number => typeof n === "number" && Number.isFinite(n)).map((n) => Math.min(Math.max(n, 0), 120_000)) : []);
  return { phonological: clean(raw?.phonological), rapidNaming: clean(raw?.rapidNaming), spelling: clean(raw?.spelling) };
}
