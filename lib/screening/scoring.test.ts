import { describe, expect, it } from "vitest";
import { assessRisk, calculateRiskScore, digitSpanScore, type ScreeningScores } from "./scoring";

const scores = (p: number, r: number, s: number, d: number): ScreeningScores => ({ phonological: p, rapidNaming: r, spelling: s, digitSpan: d });

describe("assessRisk — bobot dan ambang (BR-01, BR-02)", () => {
  it("memakai bobot 0,35 / 0,30 / 0,20 / 0,15", () => {
    expect(assessRisk(scores(1, 0, 0, 0)).riskScore).toBeCloseTo(0.35);
    expect(assessRisk(scores(0, 1, 0, 0)).riskScore).toBeCloseTo(0.3);
    expect(assessRisk(scores(0, 0, 1, 0)).riskScore).toBeCloseTo(0.2);
    expect(assessRisk(scores(0, 0, 0, 1)).riskScore).toBeCloseTo(0.15);
  });

  it("semua dimensi 1 menghasilkan skor 1 dan Risiko Rendah", () => {
    const a = assessRisk(scores(1, 1, 1, 1));
    expect(a.riskScore).toBeCloseTo(1);
    expect(a.riskLevel).toBe("low");
    expect(a.escalated).toBe(false);
  });

  it("ambang: tepat 0,75 = Sedang, tepat 0,45 = Tinggi (batas atas eksklusif)", () => {
    expect(assessRisk(scores(0.75, 0.75, 0.75, 0.75)).baseLevel).toBe("moderate");
    expect(assessRisk(scores(0.76, 0.76, 0.76, 0.76)).baseLevel).toBe("low");
    expect(assessRisk(scores(0.45, 0.45, 0.45, 0.45)).baseLevel).toBe("high");
    expect(assessRisk(scores(0.46, 0.46, 0.46, 0.46)).baseLevel).toBe("moderate");
  });
});

describe("assessRisk — eskalasi satu dimensi sangat rendah (BR-02)", () => {
  it("Rendah naik jadi Sedang bila satu dimensi < 0,30", () => {
    // 0,35*1 + 0,30*1 + 0,20*1 + 0,15*0,2 = 0,88 (Rendah), memori 0,2 < 0,3
    const a = assessRisk(scores(1, 1, 1, 0.2));
    expect(a.baseLevel).toBe("low");
    expect(a.riskLevel).toBe("moderate");
    expect(a.escalated).toBe(true);
    expect(a.sharpDimensions).toEqual(["digitSpan"]);
  });

  it("Sedang naik jadi Tinggi", () => {
    const a = assessRisk(scores(0.62, 0.55, 0.6, 0.2));
    expect(a.baseLevel).toBe("moderate");
    expect(a.riskLevel).toBe("high");
    expect(a.escalated).toBe(true);
  });

  it("Tinggi tetap Tinggi dan tidak dihitung sebagai eskalasi", () => {
    const a = assessRisk(scores(0.2, 0.2, 0.2, 0.2));
    expect(a.riskLevel).toBe("high");
    expect(a.escalated).toBe(false);
  });

  it("tepat 0,30 tidak memicu eskalasi (harus di bawah 0,30)", () => {
    const a = assessRisk(scores(1, 1, 1, 0.3));
    expect(a.sharpDimensions).toEqual([]);
    expect(a.riskLevel).toBe("low");
  });

  it("beberapa dimensi sangat rendah tetap hanya menaikkan satu tingkat", () => {
    // 0,35 + 0,30 + 0,20*0,29 + 0,15*0,29 = 0,7515 (Rendah)
    const a = assessRisk(scores(1, 1, 0.29, 0.29));
    expect(a.baseLevel).toBe("low");
    expect(a.riskLevel).toBe("moderate");
    expect(a.sharpDimensions).toEqual(["spelling", "digitSpan"]);
    expect(a.escalated).toBe(true);
  });

  it("calculateRiskScore mengembalikan level yang sudah dieskalasi", () => {
    expect(calculateRiskScore(scores(1, 1, 1, 0.2)).riskLevel).toBe("moderate");
  });
});

describe("digitSpanScore", () => {
  it("rentang 3 = 0,2 sehingga memicu eskalasi, rentang 7 = 1", () => {
    expect(digitSpanScore(3)).toBeCloseTo(0.2);
    expect(digitSpanScore(7)).toBe(1);
    expect(digitSpanScore(0)).toBe(0);
  });
});
