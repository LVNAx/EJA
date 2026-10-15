import { z } from "zod";
export const readingSessionSchema = z
  .object({
    limitMs: z.literal(60_000),
    extensionMs: z.number().int().min(0).max(90_000).multipleOf(30_000),
    elapsedMs: z.number().finite().min(0).max(150_000),
    status: z.enum(["completed", "expired", "skipped", "interrupted"]),
    interruptions: z.number().int().min(0).max(100),
    experience: z.enum(["steady", "moving", "unsure", "unanswered"]),
    responseTimes: z
      .array(
        z
          .object({
            itemId: z.enum(["meaning-1", "meaning-2"]),
            atMs: z.number().finite().min(0).max(150_000),
          })
          .strict(),
      )
      .max(2),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.elapsedMs > v.limitMs + v.extensionMs ||
      new Set(v.responseTimes.map((r) => r.itemId)).size !==
        v.responseTimes.length ||
      v.responseTimes.some(
        (r, i) =>
          r.atMs > v.elapsedMs ||
          (i > 0 && r.atMs < v.responseTimes[i - 1].atMs),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Waktu sesi membaca tidak konsisten.",
      });
  });
export type ReadingSession = z.infer<typeof readingSessionSchema>;
