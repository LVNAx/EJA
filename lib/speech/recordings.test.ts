import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  phonologicalQuestions,
  spellingQuestions,
} from "@/lib/screening/questions";
import { recordedWordAudio } from "./recordings";

describe("audio kata tes Bahasa Indonesia", () => {
  it("setiap kata soal memiliki berkas audio WAV yang dapat dibaca", () => {
    for (const question of [...phonologicalQuestions, ...spellingQuestions]) {
      const src = recordedWordAudio(question.audio);
      expect(src, question.audio).toBeTruthy();
      const file = readFileSync(path.join(process.cwd(), "public", src!));
      expect(file.subarray(0, 4).toString()).toBe("RIFF");
      expect(file.subarray(8, 12).toString()).toBe("WAVE");
      expect(file.length).toBeGreaterThan(5000);
    }
  });
});
