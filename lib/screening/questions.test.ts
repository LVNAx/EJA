import { describe, expect, it } from "vitest";
import {
  phonologicalQuestions,
  spellingQuestions,
  rapidNamingQuestions,
} from "./questions";

const clean = (text: string) => text.toLocaleLowerCase("id-ID").trim();

describe("kesesuaian kata yang dibacakan dengan pilihan tes", () => {
  it("setiap soal bunyi awal memiliki tepat satu nama gambar yang sesuai", () => {
    for (const question of phonologicalQuestions) {
      const matches = question.options
        .map((option, index) =>
          clean(option.label)[0] === clean(question.audio)[0] ? index : -1,
        )
        .filter((index) => index >= 0);
      expect(matches, question.audio).toEqual([question.correct]);
      expect(clean(question.word)).toBe(clean(question.audio));
    }
  });
  it("nama pilihan sesuai gambar yang digunakan", () => {
    const names: Record<string, string> = {
      kura: "kura-kura",
      kupu: "kupu-kupu",
      eskrim: "es krim",
    };
    for (const question of phonologicalQuestions)
      for (const option of question.options)
        expect(clean(option.label)).toBe(names[option.art] ?? option.art);
  });
  it("setiap soal ejaan menyertakan tepat satu tulisan sesuai audio", () => {
    for (const question of spellingQuestions) {
      expect(
        question.options.filter(
          (option) => clean(option) === clean(question.audio),
        ),
      ).toHaveLength(1);
      expect(clean(question.options[question.correct])).toBe(
        clean(question.audio),
      );
    }
  });
  it("setiap pilihan huruf unik dan jawaban sesuai huruf sasaran", () => {
    for (const question of rapidNamingQuestions) {
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options[question.correct]).toBe(question.letter);
    }
  });
});
