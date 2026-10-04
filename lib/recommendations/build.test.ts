import { describe, expect, it } from "vitest";
import { buildRecommendation, bandOf } from "./build";
import { DIMENSION_COPY, LEVEL_COPY } from "./content";

describe("bandOf", () => {
  it("memakai pita baik >= 0,75, perlu dipantau >= 0,45, selain itu perlu perhatian", () => {
    expect(bandOf(0.75)).toBe("good");
    expect(bandOf(0.74)).toBe("watch");
    expect(bandOf(0.45)).toBe("watch");
    expect(bandOf(0.44)).toBe("attention");
  });
});

describe("buildRecommendation", () => {
  it("anak Risiko Rendah: tidak ada dimensi perhatian dan tidak ada profesional yang disarankan", () => {
    const r = buildRecommendation({ phonological: 0.9, rapidNaming: 0.8, spelling: 0.85, digitSpan: 0.8 });
    expect(r.level).toBe("low");
    expect(r.attention).toHaveLength(0);
    expect(r.strengths).toHaveLength(4);
    expect(r.consult.urgency).toBe("monitor");
    expect(r.consult.professionals).toHaveLength(0);
    expect(r.escalationNote).toBeNull();
  });

  it("Risiko Rendah dengan satu dimensi 'perlu dipantau': tidak ada akomodasi sekolah atau pendekatan khusus yang bertentangan", () => {
    const r = buildRecommendation({ phonological: 0.9, rapidNaming: 0.8, spelling: 0.85, digitSpan: 0.7 });
    expect(r.level).toBe("low");
    expect(r.teacherActions).toEqual(LEVEL_COPY.low.teacherActions);
    expect(r.helpfulApproaches).toEqual([]);
  });

  it("kasus satu dimensi sangat rendah: level naik, catatan eskalasi menyebut dimensinya", () => {
    const r = buildRecommendation({ phonological: 0.62, rapidNaming: 0.55, spelling: 0.6, digitSpan: 0.2 });
    expect(r.level).toBe("high");
    expect(r.escalationNote).toContain("memori kerja");
    expect(r.escalationNote).toContain("Risiko Sedang");
    expect(r.escalationNote).toContain("Risiko Tinggi");
    expect(r.consult.urgency).toBe("soon");
    expect(r.consult.professionals.map((p) => p.role)).toContain("Psikolog klinis anak");
  });

  it("dimensi paling lemah mendapat saran khususnya dan muncul paling awal", () => {
    const r = buildRecommendation({ phonological: 0.3, rapidNaming: 0.9, spelling: 0.5, digitSpan: 0.9 });
    expect(r.attention[0].key).toBe("phonological");
    expect(r.parentActions).toContain(DIMENSION_COPY.phonological.parentTips[0]);
    expect(r.helpfulApproaches).toContain(DIMENSION_COPY.phonological.helpfulApproach);
  });

  it("saran tidak mengandung duplikat dan akomodasi guru Sedang memuat tiga saran dasar proposal", () => {
    const r = buildRecommendation({ phonological: 0.5, rapidNaming: 0.5, spelling: 0.5, digitSpan: 0.5 });
    expect(r.level).toBe("moderate");
    expect(new Set(r.teacherActions).size).toBe(r.teacherActions.length);
    for (const t of LEVEL_COPY.moderate.teacherActions) expect(r.teacherActions).toContain(t);
  });

  it("label dan arti mengikuti level yang tersimpan; catatan eskalasi dihilangkan bila level tersimpan berbeda dari hitung ulang", () => {
    // Baris lama sebelum aturan eskalasi ada: tersimpan Rendah, hitung ulang Sedang.
    const r = buildRecommendation({ phonological: 1, rapidNaming: 1, spelling: 1, digitSpan: 0.2 }, "low");
    expect(r.level).toBe("low");
    expect(r.escalationNote).toBeNull();
  });

  it("tidak ada teks yang menyatakan diagnosis", () => {
    const all = [JSON.stringify(LEVEL_COPY), JSON.stringify(DIMENSION_COPY)].join(" ").toLowerCase();
    expect(all).not.toMatch(/anak anda (mengalami|menderita) disleksia|pasti disleksia|terdiagnosis/);
  });
});
