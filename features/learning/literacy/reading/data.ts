export type ReadingWord = { text: string; syllables: string[] };
export type ReadingItem = {
  id: string;
  kind: "kata" | "kalimat";
  text: string;
  words: ReadingWord[];
};

// Semua pemenggalan di bawah ditulis dan diperiksa manual, termasuk kalimat.
export const readingItems: ReadingItem[] = [
  {
    id: "pecahan",
    kind: "kata",
    text: "pecahan",
    words: [{ text: "pecahan", syllables: ["pe", "ca", "han"] }],
  },
  {
    id: "kelompok",
    kind: "kata",
    text: "kelompok",
    words: [{ text: "kelompok", syllables: ["ke", "lom", "pok"] }],
  },
  {
    id: "bagian",
    kind: "kata",
    text: "bagian",
    words: [{ text: "bagian", syllables: ["ba", "gi", "an"] }],
  },
  {
    id: "perkalian",
    kind: "kata",
    text: "perkalian",
    words: [{ text: "perkalian", syllables: ["per", "ka", "li", "an"] }],
  },
  {
    id: "jumlah",
    kind: "kata",
    text: "jumlah",
    words: [{ text: "jumlah", syllables: ["jum", "lah"] }],
  },
  {
    id: "kue-empat",
    kind: "kalimat",
    text: "Satu kue dibagi menjadi empat bagian.",
    words: [
      { text: "Satu", syllables: ["sa", "tu"] },
      { text: "kue", syllables: ["ku", "e"] },
      { text: "dibagi", syllables: ["di", "ba", "gi"] },
      { text: "menjadi", syllables: ["men", "ja", "di"] },
      { text: "empat", syllables: ["em", "pat"] },
      { text: "bagian", syllables: ["ba", "gi", "an"] },
    ],
  },
  {
    id: "bintang-enam",
    kind: "kalimat",
    text: "Ada enam bintang dalam dua kelompok.",
    words: [
      { text: "Ada", syllables: ["a", "da"] },
      { text: "enam", syllables: ["e", "nam"] },
      { text: "bintang", syllables: ["bin", "tang"] },
      { text: "dalam", syllables: ["da", "lam"] },
      { text: "dua", syllables: ["du", "a"] },
      { text: "kelompok", syllables: ["ke", "lom", "pok"] },
    ],
  },
];

export type SpokenSyllable = {
  text: string;
  wordIndex: number;
  lastInWord: boolean;
};

export function spokenSyllables(words: ReadingWord[]): SpokenSyllable[] {
  return words.flatMap((word, wordIndex) =>
    word.syllables.map((text, index) => ({
      text,
      wordIndex,
      lastInWord: index === word.syllables.length - 1,
    })),
  );
}

export function normalizeSpeech(text: string): string {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
