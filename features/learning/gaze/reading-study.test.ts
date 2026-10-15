import { describe, expect, it } from "vitest";
import {
  analyzeReadingRegions,
  readingStudyAdvice,
  readingStudySchema,
  STUDY_PASSAGES,
  studyRoundResult,
  validateReadingRegions,
  type ReadingRegion,
  type ReadingStudy,
} from "./reading-study";
import type { GazeSample } from "./reading-summary";
import { recommendNextPractice } from "../model/practice-plan";
import { buildProgressModel } from "../model/progress-model";

const regions: ReadingRegion[] = [0.15, 0.4, 0.65].map((y) => ({
  x: 0.1,
  y,
  width: 0.8,
  height: 0.16,
}));
const checks = regions.flatMap((r) =>
  [0.35, 0.65].map((x) => ({
    target: { x, y: r.y + r.height / 2 },
    predictions: Array.from({ length: 12 }, () => ({
      x,
      y: r.y + r.height / 2,
    })),
  })),
);
const valid = validateReadingRegions(checks, regions);
function frames(sequence: number[], each = 1000): GazeSample[] {
  return sequence.flatMap((region, i) =>
    Array.from({ length: each / 100 }, (_, k) => ({
      t: i * each + k * 100,
      point: region < 0 ? null : { x: 0.5, y: regions[region].y + 0.08 },
      eyesTracked: region >= 0,
    })),
  );
}
function study(): ReadingStudy {
  return readingStudySchema.parse({
    id: "12345678-1234-4234-8234-123456789abc",
    completedAt: "2026-10-15T10:00:00Z",
    version: 1,
    mode: "comparison",
    rounds: STUDY_PASSAGES.map((p) => ({
      passageId: p.id,
      observation: analyzeReadingRegions(
        frames([0, 1, 2, 1, 2, 2]),
        6000,
        regions,
        valid,
      ),
      answers: p.questions.map((q) => q.correct),
      oral: ["unassessed", "unassessed", "unassessed"],
      assisted: false,
    })),
  });
}
describe("pengamatan bagian bacaan", () => {
  it("menguji posisi bacaan terpisah dan menolak kalibrasi yang hanya cukup untuk area layar besar", () => {
    expect(valid.usable).toBe(true);
    expect(
      validateReadingRegions(
        checks.map((c) => ({
          ...c,
          predictions: c.predictions.map((p) => ({ ...p, y: p.y + 0.07 })),
        })),
        regions,
      ).usable,
    ).toBe(false);
    expect(validateReadingRegions(checks.slice(0, 5), regions).usable).toBe(
      false,
    );
    expect(
      validateReadingRegions(
        checks.map((c) => ({ ...c, predictions: c.predictions.slice(0, 2) })),
        regions,
      ).usable,
    ).toBe(false);
  });
  it("menolak posisi tumpang tindih atau di luar layar", () => {
    expect(
      validateReadingRegions(checks, [regions[0], regions[0], regions[2]])
        .usable,
    ).toBe(false);
    expect(
      validateReadingRegions(
        checks,
        regions.map((r) => ({ ...r, height: 1 })),
      ).usable,
    ).toBe(false);
  });
  it("menghitung waktu per bagian dan perpindahan mundur yang stabil", () => {
    const o = analyzeReadingRegions(
      frames([0, 1, 2, 1, 2, 2]),
      6000,
      regions,
      valid,
    );
    expect(o).toMatchObject({
      usable: true,
      returns: 1,
      regionMs: [1000, 2000, 3000],
      visits: [1, 2, 2],
      trackedMs: 6000,
      mappedMs: 6000,
    });
  });
  it("getaran singkat dan perpindahan biasa ke bagian berikutnya tidak dihitung mundur", () => {
    expect(
      analyzeReadingRegions(frames([0, 0, 1, 1, 2, 2]), 6000, regions, valid)
        .returns,
    ).toBe(0);
    const jitter = frames([0, 0, 1, 1, 2, 2]);
    jitter[22].point = { x: 0.5, y: regions[0].y + 0.08 };
    expect(analyzeReadingRegions(jitter, 6000, regions, valid).returns).toBe(0);
  });
  it("tidak menyambungkan kunjungan melewati kamera yang hilang lama", () => {
    const o = analyzeReadingRegions(
      frames([2, 2, -1, 0, 0, 0]),
      6000,
      regions,
      valid,
    );
    expect(o.usable).toBe(true);
    expect(o.returns).toBe(0);
    expect(o.trackedMs).toBe(5000);
  });
  it("menyisihkan batas bagian yang berada dalam galat kalibrasi", () => {
    const events = frames([0, 0, 1, 1, 2, 2]).map((s) => ({
      ...s,
      point: { x: 0.5, y: regions[0].y + 0.001 },
    }));
    const o = analyzeReadingRegions(events, 6000, regions, {
      ...valid,
      errorY: 0.02,
    });
    expect(o.usable).toBe(false);
    expect(o.mappedMs).toBe(0);
  });
  it("tanpa kalibrasi, sesi pendek, sinyal buruk, atau interupsi tidak menghasilkan metrik pola", () => {
    for (const o of [
      analyzeReadingRegions(frames([0, 1, 2, 1, 2, 2]), 6000, regions, null),
      analyzeReadingRegions(frames([0]), 1000, regions, valid),
      analyzeReadingRegions(
        frames([0, -1, -1, -1, -1, -1]),
        6000,
        regions,
        valid,
      ),
      analyzeReadingRegions(
        frames([0, 1, 2, 1, 2, 2]),
        6000,
        regions,
        valid,
        true,
      ),
    ]) {
      expect(o.usable).toBe(false);
      expect(o.regionMs).toEqual([0, 0, 0]);
      expect(o.returns).toBe(0);
    }
  });
  it("frame jarang tidak dianggap terus melihat", () => {
    const o = analyzeReadingRegions(
      [
        { t: 0, point: { x: 0.5, y: 0.23 }, eyesTracked: true },
        { t: 5000, point: { x: 0.5, y: 0.48 }, eyesTracked: true },
      ],
      6000,
      regions,
      valid,
    );
    expect(o.trackedMs).toBe(500);
    expect(o.usable).toBe(false);
  });
  it("jawaban bukan durasi atau banyaknya perpindahan menentukan nilai", () => {
    const record = study(),
      round = record.rounds[0];
    expect(studyRoundResult(round).score).toBe(100);
    round.observation.returns = 999;
    expect(studyRoundResult(round).score).toBe(100);
    round.answers = [null, null];
    expect(studyRoundResult(round).score).toBeNull();
    round.answers = [null, 2];
    expect(studyRoundResult(round)).toMatchObject({ score: 0, assessed: 1 });
  });
  it("saran merujuk bagian pada pertanyaan yang keliru dan berlaku tanpa kamera", () => {
    const record = study();
    record.rounds[1].answers = [0, 1];
    expect(readingStudyAdvice(record)).toMatchObject({
      needsPractice: true,
      path: "/latihan/pola-membaca?latihan=baris",
    });
    expect(readingStudyAdvice(record).reason).toContain("bagian 1");
    record.rounds[1].observation = analyzeReadingRegions(
      [],
      6000,
      regions,
      null,
    );
    expect(readingStudyAdvice(record).reason).toContain("bagian 1");
    expect(readingStudyAdvice(record).context).toContain("belum dapat dipakai");
  });
  it("tidak menerima ringkasan mustahil, jenis risiko, atau urutan bacaan ganda", () => {
    const record = study();
    expect(readingStudySchema.safeParse(record).success).toBe(true);
    expect(readingStudySchema.safeParse({ ...record, risk: 97 }).success).toBe(
      false,
    );
    expect(
      readingStudySchema.safeParse({
        ...record,
        rounds: [record.rounds[0], record.rounds[0]],
      }).success,
    ).toBe(false);
    const bad = structuredClone(record);
    bad.rounds[0].observation.trackedMs = 999999;
    expect(readingStudySchema.safeParse(bad).success).toBe(false);
  });
  it("saran eksperimen masuk beranda tanpa menambah observasi Bayesian latihan", () => {
    const record = study();
    record.rounds[1].answers = [0, 1];
    const model = buildProgressModel({ sessions: {}, evidence: {} });
    expect(recommendNextPractice(model.skills, [], [record])).toMatchObject({
      source: "reading-study",
      skill: { path: "/latihan/pola-membaca?latihan=baris" },
    });
    expect(model.assessedSessions).toBe(0);
  });
  it("perbandingan dengan panduan menjadi percobaan bantuan berikutnya tanpa klaim efektivitas", () => {
    const record = study();
    record.rounds[0].answers = [0, 2];
    expect(readingStudyAdvice(record).needsPractice).toBe(true);
    expect(readingStudyAdvice(record).reason).toContain("dua bacaan berbeda");
  });
});
