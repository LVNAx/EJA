import { describe, expect, it } from "vitest";
import { mathResults } from "./math-results";
import { recommendNextPractice } from "./practice-plan";
import { buildProgressModel } from "./progress-model";
import type { AppState, Session } from "../state/store";
import { evidenceSchema } from "../state/evidence";
import { lessons } from "../math/content";
import type { AssessmentRecord } from "@/lib/screening/assessment";

const session: Session = {
  id: "math-1",
  kind: "math",
  activityId: "pecahan-dasar",
  title: "Pecahan",
  startedAt: "2026-10-15T03:00:00.000Z",
  completedAt: "2026-10-15T04:00:00.000Z",
  xpEarned: 50,
  learned: [],
};
const record: AssessmentRecord = {
  id: "12345678-1234-4234-8234-123456789abc",
  completedAt: "2026-10-15T02:00:00.000Z",
  submission: {
    version: 2,
    answers: [
      {
        type: "oral",
        itemId: "word-1",
        durationMs: 2000,
        verdict: "incorrect",
        assisted: false,
        interruptions: 0,
      },
    ],
  },
};
describe("hasil matematika dan penerusan latihan", () => {
  it("kuis benar setelah mengulang tercatat selesai tetapi bukan tepat pertama", () => {
    const quiz = lessons[0].chunks.find((c) => c.type === "quiz")!;
    const state: Pick<AppState, "sessions" | "evidence"> = {
      sessions: { [session.id]: session },
      evidence: {
        [session.id]: evidenceSchema.parse({
          hints: 4,
          quizzes: {
            [quiz.id]: {
              attempts: 3,
              incorrect: 2,
              solved: true,
              firstTryCorrect: false,
            },
            unknown: {
              attempts: 1,
              incorrect: 0,
              solved: true,
              firstTryCorrect: true,
            },
          },
        }),
      },
    };
    expect(mathResults(state)[0]).toMatchObject({
      score: 0,
      assessed: 1,
      solved: 1,
      attempts: 3,
      hints: 4,
    });
    expect(mathResults(state)[1].score).toBeNull();
    state.evidence[session.id].quizzes[quiz.id] = {
      attempts: 1,
      incorrect: 0,
      solved: true,
      firstTryCorrect: true,
    };
    expect(mathResults(state)[0].score).toBe(100);
  });
  it("sesi belum selesai dan hasil tanpa bukti tidak diberi nilai", () => {
    expect(
      mathResults({
        sessions: { a: { ...session, completedAt: null } },
        evidence: {},
      })[0].score,
    ).toBeNull();
    expect(
      mathResults({ sessions: { a: session }, evidence: {} })[0].score,
    ).toBeNull();
  });
  it("hasil tes menjadi saran awal dan latihan baru mengambil alih tanpa mencampur posterior", () => {
    const empty = buildProgressModel({ sessions: {}, evidence: {} });
    expect(recommendNextPractice(empty.skills, [record])).toMatchObject({
      source: "assessment",
      skill: { id: "reading" },
    });
    expect(recommendNextPractice(empty.skills, []).source).toBe("practice");
    const state = {
      sessions: {
        newer: { ...session, id: "newer", kind: "reading" as const },
      },
      evidence: {
        newer: evidenceSchema.parse({ readingAttempts: 1, readingMatches: 1 }),
      },
    };
    const model = buildProgressModel(state);
    expect(recommendNextPractice(model.skills, [record]).source).toBe(
      "practice",
    );
    expect(model.skills[0].alpha).toBe(2);
    expect(model.skills[0].history).toHaveLength(1);
  });
});
