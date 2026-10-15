import { describe, expect, it } from "vitest";
import {
  assessmentRecordSchema,
  buildAssessment,
  submissionSchema,
  type AssessmentAnswer,
} from "./assessment";
import {
  DICTATION_ITEMS,
  MEANING_ITEMS,
  NAMING_GRID,
  READING_ITEMS,
  SOUND_ITEMS,
} from "./protocol";
import { rapidNamingItemScore } from "./scoring";

const common = { durationMs: 2000, assisted: false, interruptions: 0 };
const fullAnswers = (): AssessmentAnswer[] => [
  ...SOUND_ITEMS.map((q) => ({
    ...common,
    type: "choice" as const,
    itemId: q.id,
    option: q.correct,
    audioPlays: 1,
  })),
  ...READING_ITEMS.map((q) => ({
    ...common,
    type: "oral" as const,
    itemId: q.id,
    verdict: "correct" as const,
  })),
  ...MEANING_ITEMS.map((q) => ({
    ...common,
    type: "choice" as const,
    itemId: q.id,
    option: q.correct,
    audioPlays: 0,
  })),
  {
    ...common,
    type: "naming",
    itemId: "naming-grid",
    errors: [],
    reviewed: true,
    familiar: true,
  },
  ...DICTATION_ITEMS.map((q) => ({
    ...common,
    type: "dictation" as const,
    itemId: q.id,
    text: q.word,
    audioPlays: 1,
  })),
];
const report = (answers: AssessmentAnswer[]) =>
  buildAssessment({ version: 2, answers });

describe("tes versi 2: bukti jawaban", () => {
  it("merangkum empat kegiatan tanpa menghasilkan skor gabungan atau risiko", () => {
    const result = report(fullAnswers());
    expect(result.map((t) => [t.correct, t.assessed, t.total])).toEqual([
      [6, 6, 6],
      [8, 8, 8],
      [12, 12, 12],
      [4, 4, 4],
    ]);
    expect(result.every((t) => t.status === "complete")).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/riskScore|riskLevel/);
  });
  it("jawaban salah tetap salah pada waktu cepat maupun lambat", () => {
    for (const durationMs of [400, 2900]) {
      const answer: AssessmentAnswer = {
        ...common,
        durationMs,
        type: "naming",
        itemId: "naming-grid",
        errors: NAMING_GRID.map((_, i) => i),
        reviewed: true,
        familiar: true,
      };
      expect(report([answer])[2]).toMatchObject({
        correct: 0,
        assessed: 12,
        status: "complete",
      });
      expect(rapidNamingItemScore(durationMs, false)).toBe(0);
    }
  });
  it("bukti kosong, tidak diperiksa, atau durasi hilang tidak menjadi skor nol ataupun lulus", () => {
    expect(
      report([]).every((t) => t.status === "unassessed" && t.assessed === 0),
    ).toBe(true);
    const answers = fullAnswers().map((a) => ({ ...a, durationMs: null }));
    expect(report(answers).every((t) => t.assessed === 0)).toBe(true);
    const naming = fullAnswers().find((a) => a.type === "naming")!;
    expect(
      report([
        {
          ...naming,
          type: "naming",
          errors: [],
          reviewed: false,
          familiar: true,
        },
      ])[2].assessed,
    ).toBe(0);
    expect(
      report([
        {
          ...naming,
          type: "naming",
          errors: [],
          reviewed: true,
          familiar: false,
        },
      ])[2].assessed,
    ).toBe(0);
  });
  it("audio gagal tidak menghasilkan penilaian bunyi atau dikte meskipun jawaban kebetulan benar", () => {
    const answers = fullAnswers().map((a) =>
      "audioPlays" in a ? { ...a, audioPlays: 0 } : a,
    );
    expect(report(answers)[0].assessed).toBe(0);
    expect(report(answers)[3].assessed).toBe(0);
    expect(report(answers)[1].assessed).toBe(8);
  });
  it("dikte mengabaikan kapital dan spasi tepi, tetapi mempertahankan kesalahan ejaan", () => {
    const answer = fullAnswers().find((a) => a.type === "dictation")!;
    for (const [text, correct] of [
      ["  KUCING ", 1],
      ["kusing", 0],
      ["ku cing", 0],
      ["kucing!", 0],
    ] as const)
      expect(
        report([{ ...answer, type: "dictation", text, audioPlays: 1 }])[3]
          .correct,
      ).toBe(correct);
  });
  it("bagian yang dilewati tidak ikut pembagi hasil dan tetap menampilkan jumlah butir belum dinilai", () => {
    expect(report(fullAnswers().slice(0, 2))[0]).toMatchObject({
      correct: 2,
      assessed: 2,
      total: 6,
      status: "partial",
    });
  });
  it("bantuan dan interupsi dicatat tanpa mengubah jawaban benar menjadi salah", () => {
    expect(
      report([{ ...fullAnswers()[0], assisted: true, interruptions: 2 }])[0],
    ).toMatchObject({ correct: 1, assisted: 1, interruptions: 2 });
  });
  it("menolak butir asing, duplikat, pilihan fiktif, dan angka waktu yang tidak valid", () => {
    const one = fullAnswers()[0];
    for (const answers of [
      [one, one],
      [{ ...one, itemId: "unknown" }],
      [{ ...one, type: "oral" }],
      [{ ...one, option: 99 }],
      [{ ...one, durationMs: NaN }],
      [{ ...one, durationMs: -1 }],
    ])
      expect(submissionSchema.safeParse({ version: 2, answers }).success).toBe(
        false,
      );
    expect(
      submissionSchema.safeParse({
        version: 2,
        answers: [
          {
            ...common,
            itemId: "meaning-1",
            type: "choice",
            option: 3,
            audioPlays: 0,
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("menolak jumlah kesalahan ganda serta skor atau risiko yang disisipkan dari klien", () => {
    expect(
      submissionSchema.safeParse({ version: 2, answers: [], riskLevel: "low" })
        .success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({
        version: 2,
        answers: [
          {
            ...common,
            itemId: "naming-grid",
            type: "naming",
            errors: [0, 0],
            reviewed: true,
            familiar: true,
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("sinyal kamera tidak memengaruhi ketepatan jawaban", () => {
    const input = { version: 2, answers: fullAnswers() };
    expect(
      buildAssessment({
        ...input,
        eyeTracking: { observedMs: 5000, trackedMs: 5000 },
      }),
    ).toEqual(buildAssessment(input));
    expect(
      submissionSchema.safeParse({
        ...input,
        eyeTracking: { observedMs: 10, trackedMs: 11 },
      }).success,
    ).toBe(false);
  });
  it("menerima tanggal Supabase dan mengubahnya menjadi UTC yang konsisten", () => {
    const record = assessmentRecordSchema.parse({
      id: "12345678-1234-4234-8234-123456789abc",
      completedAt: "2026-10-15T09:00:00+00:00",
      submission: { version: 2, answers: [] },
    });
    expect(record.completedAt).toBe("2026-10-15T09:00:00.000Z");
  });
});
