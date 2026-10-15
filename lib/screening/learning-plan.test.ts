import { describe, expect, it } from "vitest";
import { answerScore, buildAssessmentPlan } from "./learning-plan";
import type { AssessmentRecord, AssessmentAnswer } from "./assessment";
import { SOUND_ITEMS } from "./protocol";

export const makeRecord = (
  answers: AssessmentAnswer[],
  eyes?: { observedMs: number; trackedMs: number },
): AssessmentRecord => ({
  id: "12345678-1234-4234-8234-123456789abc",
  completedAt: "2026-10-15T02:00:00.000Z",
  submission: { version: 2, answers, ...(eyes ? { eyeTracking: eyes } : {}) },
});
const common = { durationMs: 2000, assisted: false, interruptions: 0 };
describe("nilai jawaban dan rencana belajar", () => {
  it("memberi nilai hanya dari butir yang dinilai, bukan yang dilewati", () => {
    expect(answerScore({ correct: 2, assessed: 3 })).toBe(67);
    expect(answerScore({ correct: 0, assessed: 0 })).toBeNull();
    expect(answerScore({ correct: 0, assessed: 12 })).toBe(0);
  });
  it("memilih kesalahan yang paling perlu diulang dan memberi tautan latihan", () => {
    const plan = buildAssessmentPlan(
      makeRecord([
        {
          ...common,
          itemId: SOUND_ITEMS[0].id,
          type: "choice",
          option: SOUND_ITEMS[0].correct,
          audioPlays: 1,
        },
        { ...common, itemId: "word-1", type: "oral", verdict: "incorrect" },
      ]),
    );
    expect(plan.next).toMatchObject({
      key: "reading",
      path: "/latihan/membaca",
    });
    expect(plan.next.reason).toContain("1 dari 1");
    expect(plan.tasks[1].status).toBe("partial");
  });
  it("bantuan mengubah saran tanpa mengurangi nilai", () => {
    const plan = buildAssessmentPlan(
      makeRecord([
        {
          ...common,
          assisted: true,
          itemId: "word-1",
          type: "oral",
          verdict: "correct",
        },
      ]),
    );
    expect(answerScore(plan.tasks[1])).toBe(100);
    expect(plan.next.reason).toContain("dibantu");
  });
  it("kamera baik/buruk tidak mengubah nilai maupun saran pedagogis", () => {
    const answers: AssessmentAnswer[] = [
      { ...common, itemId: "word-1", type: "oral", verdict: "incorrect" },
    ];
    const good = buildAssessmentPlan(
      makeRecord(answers, { observedMs: 24400, trackedMs: 23668 }),
    );
    const poor = buildAssessmentPlan(
      makeRecord(answers, { observedMs: 24400, trackedMs: 1000 }),
    );
    expect(good.camera).toMatchObject({
      coverage: 97,
      sufficient: true,
      missingMs: 732,
    });
    expect(poor.camera?.sufficient).toBe(false);
    expect(good.tasks).toEqual(poor.tasks);
    expect(good.next).toEqual(poor.next);
    expect(poor.camera?.advice).toContain("cahaya");
  });
  it("kamera tanpa jawaban tidak menghasilkan nilai", () => {
    const plan = buildAssessmentPlan(
      makeRecord([], { observedMs: 24400, trackedMs: 24400 }),
    );
    expect(plan.tasks.every((t) => answerScore(t) === null)).toBe(true);
    expect(plan.next.reason).toContain("belum dinilai");
    expect(buildAssessmentPlan(makeRecord([])).camera).toBeNull();
  });
});
