import { describe, expect, it } from "vitest";
import { evaluateSessionQuality, sanitizeTimings } from "./quality";
import { MAX_SCREENINGS_PER_DAY, SCREENING_CONFIG } from "./config";
import { digitSpanScore, rapidNamingItemScore } from "./scoring";

const normal = { phonological: Array(8).fill(2500), rapidNaming: Array(12).fill(1400), spelling: Array(8).fill(3000) };

describe("evaluateSessionQuality (FR-18)", () => {
  it("sesi normal valid", () => {
    const q = evaluateSessionQuality(normal);
    expect(q.valid).toBe(true);
    expect(q.reason).toBeNull();
    expect(q.counted).toBe(28);
  });

  it("terlalu banyak jawaban sangat cepat pada tes dengar: tidak valid dan ada alasan untuk orang tua", () => {
    const q = evaluateSessionQuality({ phonological: Array(8).fill(300), rapidNaming: Array(12).fill(1400), spelling: Array(8).fill(300) });
    // 16 dari 28 butir tertebak = 57% > 50%
    expect(q.valid).toBe(false);
    expect(q.reason).toMatch(/terlalu banyak jawaban/i);
  });

  it("tepat di batas porsi (50%) masih valid; di atasnya tidak", () => {
    const half = { phonological: [...Array(4).fill(200), ...Array(4).fill(2000)], rapidNaming: [], spelling: [] };
    expect(evaluateSessionQuality(half).valid).toBe(true);
    const over = { phonological: [...Array(5).fill(200), ...Array(3).fill(2000)], rapidNaming: [], spelling: [] };
    expect(evaluateSessionQuality(over).valid).toBe(false);
  });

  it("penamaan cepat memakai batas jauh lebih rendah: 700 ms tidak dianggap tebakan di sana, tetapi dianggap di tes dengar", () => {
    expect(evaluateSessionQuality({ phonological: [], rapidNaming: Array(12).fill(700), spelling: [] }).valid).toBe(true);
    expect(evaluateSessionQuality({ phonological: Array(8).fill(700), rapidNaming: [], spelling: [] }).valid).toBe(false);
  });

  it("tanpa data waktu: tidak dihukum", () => {
    expect(evaluateSessionQuality({ phonological: [], rapidNaming: [], spelling: [] }).valid).toBe(true);
  });
});

describe("sanitizeTimings", () => {
  it("membuang nilai bukan angka, membatasi panjang dan rentang", () => {
    const t = sanitizeTimings({ phonological: [100, NaN, "x" as unknown as number, 999_999], rapidNaming: Array(500).fill(10), spelling: undefined });
    expect(t.phonological).toEqual([100, 120_000]);
    expect(t.rapidNaming).toHaveLength(50);
    expect(t.spelling).toEqual([]);
    expect(sanitizeTimings(undefined)).toEqual({ phonological: [], rapidNaming: [], spelling: [] });
  });
});

describe("konfigurasi kalibrasi (BR-03, BR-04)", () => {
  it("skor memori kerja dan penamaan cepat membaca config, bukan angka tertanam", () => {
    const { floor, range } = SCREENING_CONFIG.digitSpan;
    expect(digitSpanScore(floor + range)).toBe(1);
    expect(digitSpanScore(floor)).toBe(0);
    expect(rapidNamingItemScore(0, true)).toBeCloseTo(1);
    expect(rapidNamingItemScore(SCREENING_CONFIG.rapidNaming.maxMs, false)).toBeCloseTo(0);
  });

  it("satu sesi awal ditambah dua ulang = 3 sesi per hari", () => {
    expect(MAX_SCREENINGS_PER_DAY).toBe(3);
  });
});
