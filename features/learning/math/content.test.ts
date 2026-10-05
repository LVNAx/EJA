import { describe, expect, it } from "vitest";
import {
  chunkSchema,
  lessonSchema,
  lessons,
  quizSchema,
  visualSchema,
} from "./content";

describe("konten Matematika", () => {
  it("semua materi lokal memenuhi schema", () => {
    expect(lessons).toHaveLength(2);
    lessons.forEach((lesson) =>
      expect(lessonSchema.safeParse(lesson).success).toBe(true),
    );
  });
  it("menolak pecahan yang bagian terpilihnya berlebih", () => {
    expect(
      visualSchema.safeParse({ type: "fraction", parts: 4, selected: 5 })
        .success,
    ).toBe(false);
  });
  it("menolak jawaban kuis di luar pilihan", () => {
    expect(
      quizSchema.safeParse({
        question: "Berapa?",
        options: ["1", "2"],
        answerIndex: 3,
        explanation: "Coba lagi",
      }).success,
    ).toBe(false);
  });
  it("menolak langkah kuis tanpa pertanyaan", () => {
    expect(
      chunkSchema.safeParse({
        id: "x",
        type: "quiz",
        title: "Kuis",
        text: "Coba jawab.",
        visual: { type: "fraction", parts: 2, selected: 1 },
      }).success,
    ).toBe(false);
  });
});
