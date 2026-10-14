import { matchesReading } from "./data";
import { describe, expect, it } from "vitest";
import { normalizeSpeech, readingItems, spokenSyllables } from "./data";

describe("latihan membaca", () => {
  it("membandingkan transkripsi tanpa kapital dan tanda baca", () => {
    expect(normalizeSpeech("Satu kue, dibagi menjadi empat bagian!")).toBe(
      normalizeSpeech("satu kue dibagi menjadi empat bagian"),
    );
  });

  it("menyediakan suku kata manual untuk sebagian kata", () => {
    const pecahan = readingItems.find((item) => item.id === "pecahan")!;
    expect(spokenSyllables(pecahan.words).map((part) => part.text)).toEqual([
      "pe",
      "ca",
      "han",
    ]);
  });

  it("setiap kata dan kalimat punya urutan suku kata sesuai teks", () => {
    for (const item of readingItems) {
      expect(
        normalizeSpeech(item.words.map((word) => word.text).join(" ")),
      ).toBe(normalizeSpeech(item.text));
      for (const word of item.words) {
        expect(normalizeSpeech(word.syllables.join(""))).toBe(
          normalizeSpeech(word.text),
        );
      }
    }
  });
});

describe("ucapan per suku kata", () => {
  it("menerima kata utuh dan suku kata dengan jeda", () => {
    const item = readingItems.find((entry) => entry.id === "pecahan")!;
    expect(matchesReading("pecahan", item)).toBe(true);
    expect(matchesReading("PE - CA - HAN.", item)).toBe(true);
    expect(matchesReading("pecah", item)).toBe(false);
    expect(matchesReading("", item)).toBe(false);
  });
  it("mempertahankan batas kata pada kalimat", () => {
    const item = readingItems.find((entry) => entry.id === "kue-empat")!;
    expect(
      matchesReading("sa tu kue di ba gi menjadi em pat bagian", item),
    ).toBe(true);
    expect(matchesReading("satukuedibagimenjadiempatbagian", item)).toBe(false);
  });
});
