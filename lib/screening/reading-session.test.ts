import { describe, expect, it } from "vitest";
import { submissionSchema, buildAssessment } from "./assessment";
import { readingSessionSchema, type ReadingSession } from "./reading-session";
import { buildAssessmentPlan } from "./learning-plan";
const session: ReadingSession = {
  limitMs: 60000,
  extensionMs: 30000,
  elapsedMs: 70000,
  status: "completed",
  interruptions: 0,
  experience: "moving",
  responseTimes: [
    { itemId: "meaning-1", atMs: 40000 },
    { itemId: "meaning-2", atMs: 70000 },
  ],
};
const answers = [
  {
    type: "choice" as const,
    itemId: "meaning-1",
    option: 1,
    durationMs: 40000,
    assisted: false,
    audioPlays: 0,
    interruptions: 0,
  },
  {
    type: "choice" as const,
    itemId: "meaning-2",
    option: 0,
    durationMs: 30000,
    assisted: false,
    audioPlays: 0,
    interruptions: 0,
  },
];
describe("catatan baca dan jawab berwaktu", () => {
  it("menerima waktu tambahan dan menghitung jawaban tanpa penalti waktu atau pengalaman", () => {
    const plain = { version: 2, answers };
    expect(buildAssessment({ ...plain, readingSession: session })).toEqual(
      buildAssessment(plain),
    );
    expect(
      submissionSchema.safeParse({ ...plain, readingSession: session }).success,
    ).toBe(true);
  });
  it("menolak durasi, tambahan, atau waktu jawaban yang tidak konsisten", () => {
    for (const change of [
      { elapsedMs: 90001 },
      { extensionMs: 1000 },
      { responseTimes: [{ itemId: "meaning-1", atMs: 80000 }] },
      {
        responseTimes: [
          { itemId: "meaning-1", atMs: 1 },
          { itemId: "meaning-1", atMs: 2 },
        ],
      },
    ])
      expect(
        readingSessionSchema.safeParse({ ...session, ...change }).success,
      ).toBe(false);
  });
  it("waktu habis menyisakan soal belum dinilai dan tidak membuat jawaban fiktif", () => {
    const expired = {
      ...session,
      status: "expired",
      extensionMs: 0,
      elapsedMs: 60000,
      responseTimes: [],
    };
    expect(
      submissionSchema.safeParse({
        version: 2,
        answers: [],
        readingSession: expired,
      }).success,
    ).toBe(true);
    expect(
      buildAssessment({ version: 2, answers: [], readingSession: expired })[1]
        .assessed,
    ).toBe(0);
    expect(
      submissionSchema.safeParse({
        version: 2,
        answers: [],
        readingSession: session,
      }).success,
    ).toBe(false);
  });
  it("laporan pengalaman anak dapat menawarkan bantuan tanpa menyimpulkan dari iris", () => {
    const plan = buildAssessmentPlan({
      id: "12345678-1234-4234-8234-123456789abc",
      completedAt: "2026-10-15T10:00:00Z",
      submission: { version: 2, answers, readingSession: session },
    });
    expect(plan.next.path).toBe("/latihan/pola-membaca?latihan=baris");
    expect(plan.next.reason).toContain("Anak menyampaikan");
  });
});
