import { z } from "zod";
import { irisMotionSchema } from "@/features/learning/gaze/iris-motion";
import { readingSessionSchema } from "./reading-session";
import {
  DICTATION_ITEMS,
  MEANING_ITEMS,
  NAMING_GRID,
  READING_ITEMS,
  SOUND_ITEMS,
  TASKS,
  type TaskKey,
} from "./protocol";

const duration = z.number().finite().min(0).max(600_000).nullable();
const base = {
  itemId: z.string().max(40),
  durationMs: duration,
  assisted: z.boolean(),
  interruptions: z.number().int().min(0).max(100),
};
export const answerSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...base,
      type: z.literal("choice"),
      option: z.number().int().min(0).max(3).nullable(),
      audioPlays: z.number().int().min(0).max(50),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("oral"),
      verdict: z.enum(["correct", "incorrect", "unassessed"]),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("naming"),
      errors: z.array(z.number().int().min(0).max(11)).max(12),
      reviewed: z.boolean(),
      familiar: z.boolean(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("dictation"),
      text: z.string().max(80).nullable(),
      audioPlays: z.number().int().min(0).max(50),
    })
    .strict(),
]);
export type AssessmentAnswer = z.infer<typeof answerSchema>;
export type ChoiceAnswer = Extract<AssessmentAnswer, { type: "choice" }>;
const definitions = [
  ...SOUND_ITEMS.map((q) => ({ id: q.id, type: "choice", task: "sounds" })),
  ...READING_ITEMS.map((q) => ({ id: q.id, type: "oral", task: "reading" })),
  ...MEANING_ITEMS.map((q) => ({ id: q.id, type: "choice", task: "reading" })),
  { id: "naming-grid", type: "naming", task: "naming" },
  ...DICTATION_ITEMS.map((q) => ({
    id: q.id,
    type: "dictation",
    task: "dictation",
  })),
];
export const submissionSchema = z
  .object({
    version: z.literal(2),
    answers: z.array(answerSchema).max(definitions.length),
    eyeTracking: z
      .object({
        observedMs: z.number().finite().min(0).max(600_000),
        trackedMs: z.number().finite().min(0).max(600_000),
        motion: irisMotionSchema.optional(),
      })
      .strict()
      .refine((v) => v.trackedMs <= v.observedMs)
      .refine((v) => !v.motion || v.motion.validMs <= v.trackedMs + 1)
      .optional(),
    readingSession: readingSessionSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    value.answers.forEach((answer, index) => {
      const definition = definitions.find((q) => q.id === answer.itemId);
      if (
        !definition ||
        definition.type !== answer.type ||
        ids.has(answer.itemId)
      )
        ctx.addIssue({
          code: "custom",
          path: ["answers", index],
          message:
            "Butir tidak dikenal, berulang, atau jenis jawaban tidak sesuai.",
        });
      ids.add(answer.itemId);
      if (answer.type === "choice" && answer.option !== null) {
        const options =
          SOUND_ITEMS.find((q) => q.id === answer.itemId)?.options ??
          MEANING_ITEMS.find((q) => q.id === answer.itemId)?.options;
        if (!options || answer.option >= options.length)
          ctx.addIssue({
            code: "custom",
            path: ["answers", index],
            message: "Pilihan jawaban tidak tersedia.",
          });
      }
      if (
        answer.type === "naming" &&
        new Set(answer.errors).size !== answer.errors.length
      )
        ctx.addIssue({
          code: "custom",
          path: ["answers", index],
          message: "Posisi kesalahan berulang.",
        });
    });
    if (value.readingSession) {
      const session = value.readingSession;
      const observed = new Set(
        value.answers
          .filter(
            (a) =>
              a.type === "choice" &&
              a.option !== null &&
              a.durationMs !== null &&
              a.durationMs > 0,
          )
          .map((a) => a.itemId),
      );
      if (
        session.responseTimes.some((r) => !observed.has(r.itemId)) ||
        (session.status === "completed" && session.responseTimes.length !== 2)
      )
        ctx.addIssue({
          code: "custom",
          path: ["readingSession"],
          message: "Catatan waktu harus sesuai jawaban yang diberikan.",
        });
    }
  });
export type AssessmentSubmission = z.infer<typeof submissionSchema>;
export const assessmentRecordSchema = z
  .object({
    id: z.uuid(),
    completedAt: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value).toISOString()),
    submission: submissionSchema,
  })
  .strict();
export type AssessmentRecord = z.infer<typeof assessmentRecordSchema>;
export const normalizeSpelling = (text: string) =>
  text.normalize("NFC").trim().toLocaleLowerCase("id-ID");

export type TaskSummary = {
  key: TaskKey;
  title: string;
  correct: number;
  assessed: number;
  total: number;
  assisted: number;
  interruptions: number;
  durationMs: number | null;
  status: "complete" | "partial" | "unassessed";
};
export function buildAssessment(raw: unknown): TaskSummary[] {
  const submission = submissionSchema.parse(raw);
  return TASKS.map((task) => {
    const items = definitions.filter((d) => d.task === task.key);
    let correct = 0,
      assessed = 0,
      assisted = 0,
      interruptions = 0;
    const durations: number[] = [];
    for (const item of items) {
      const answer = submission.answers.find((a) => a.itemId === item.id);
      if (!answer) continue;
      interruptions += answer.interruptions;
      // A missing/zero duration never proves that a response was observed.
      if (answer.durationMs === null || answer.durationMs <= 0) continue;
      let count = 0,
        right = 0;
      if (answer.type === "choice" && answer.option !== null) {
        const question =
          SOUND_ITEMS.find((q) => q.id === item.id) ??
          MEANING_ITEMS.find((q) => q.id === item.id);
        if (task.key !== "sounds" || answer.audioPlays > 0) {
          count = 1;
          right = Number(question?.correct === answer.option);
        }
      } else if (answer.type === "oral" && answer.verdict !== "unassessed") {
        count = 1;
        right = Number(answer.verdict === "correct");
      } else if (
        answer.type === "dictation" &&
        answer.text?.trim() &&
        answer.audioPlays > 0
      ) {
        count = 1;
        right = Number(
          normalizeSpelling(answer.text) ===
            DICTATION_ITEMS.find((q) => q.id === item.id)?.word,
        );
      } else if (
        answer.type === "naming" &&
        answer.reviewed &&
        answer.familiar
      ) {
        count = NAMING_GRID.length;
        right = count - answer.errors.length;
      }
      assessed += count;
      correct += right;
      if (count) durations.push(answer.durationMs);
      if (count && answer.assisted) assisted += count;
    }
    const total = task.key === "naming" ? NAMING_GRID.length : items.length;
    return {
      key: task.key,
      title: task.title,
      correct,
      assessed,
      total,
      assisted,
      interruptions,
      durationMs: durations.length
        ? durations.reduce((a, b) => a + b, 0)
        : null,
      status:
        assessed === total ? "complete" : assessed ? "partial" : "unassessed",
    };
  });
}
