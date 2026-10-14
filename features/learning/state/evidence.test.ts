import { describe, expect, it } from "vitest";
import { evidenceSchema, evidenceStatus } from "./evidence";

describe("ringkasan pendamping", () => {
  it("tidak menyebut bacaan mandiri sebagai hasil penilaian otomatis", () => {
    expect(
      evidenceStatus("reading", evidenceSchema.parse({ selfRead: true })),
    ).toContain("belum dinilai otomatis");
  });
  it("tetap menyebut bantuan setelah anak menemukan jawaban", () => {
    const evidence = evidenceSchema.parse({
      hints: 1,
      quizzes: {
        q: { attempts: 2, incorrect: 1, solved: true, firstTryCorrect: false },
      },
    });
    expect(evidenceStatus("math", evidence)).toContain("dibantu");
  });
  it("menandai tulisan yang masih jauh dari contoh", () => {
    expect(
      evidenceStatus(
        "writing",
        evidenceSchema.parse({ writingScores: [0, 35] }),
      ),
    ).toContain("Perlu berlatih");
  });
});
