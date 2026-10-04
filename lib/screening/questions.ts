import type { IllustrationName } from "@/components/screening/Illustration";
import { SCREENING_CONFIG } from "./config";

export interface PickOption {
  art: IllustrationName;
  label: string;
}

export interface PhonologicalQuestion {
  word: string;
  audio: string;
  options: PickOption[];
  correct: number;
}

export interface SpellingQuestion {
  audio: string;
  options: string[];
  correct: number;
}

// Tiap soal: tepat satu pilihan yang bunyi awalnya sama dengan kata yang diputar.
export const phonologicalQuestions: PhonologicalQuestion[] = [
  { word: "BOLA", audio: "bola", correct: 0, options: [{ art: "balon", label: "BALON" }, { art: "ikan", label: "IKAN" }, { art: "apel", label: "APEL" }, { art: "kucing", label: "KUCING" }] },
  { word: "MEJA", audio: "meja", correct: 1, options: [{ art: "apel", label: "APEL" }, { art: "musik", label: "MUSIK" }, { art: "ikan", label: "IKAN" }, { art: "rumah", label: "RUMAH" }] },
  { word: "KAKI", audio: "kaki", correct: 0, options: [{ art: "kucing", label: "KUCING" }, { art: "daun", label: "DAUN" }, { art: "gitar", label: "GITAR" }, { art: "rumah", label: "RUMAH" }] },
  { word: "PAGI", audio: "pagi", correct: 2, options: [{ art: "ikan", label: "IKAN" }, { art: "bunga", label: "BUNGA" }, { art: "pesta", label: "PESTA" }, { art: "tomat", label: "TOMAT" }] },
  { word: "SAPI", audio: "sapi", correct: 2, options: [{ art: "bulan", label: "MALAM" }, { art: "balon", label: "BALON" }, { art: "singa", label: "SINGA" }, { art: "roket", label: "ROKET" }] },
  { word: "TAHU", audio: "tahu", correct: 0, options: [{ art: "tomat", label: "TOMAT" }, { art: "kura", label: "KURA-KURA" }, { art: "drama", label: "DRAMA" }, { art: "kupu", label: "KUPU-KUPU" }] },
  { word: "DURI", audio: "duri", correct: 0, options: [{ art: "dadu", label: "DADU" }, { art: "mawar", label: "MAWAR" }, { art: "kereta", label: "KERETA" }, { art: "pantai", label: "PANTAI" }] },
  { word: "ROTI", audio: "roti", correct: 2, options: [{ art: "bunga", label: "BUNGA" }, { art: "gitar", label: "GITAR" }, { art: "roda", label: "RODA" }, { art: "eskrim", label: "ES KRIM" }] },
];

export const rapidNamingLetters = ["A", "M", "B", "S", "D", "T", "P", "K", "R", "N", "L", "G"] as const;
export const RAPID_NAMING_MAX_MS = SCREENING_CONFIG.rapidNaming.maxMs;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export interface RapidNamingQuestion {
  letter: string;
  options: string[];
  correct: number;
}

// Pilihan deterministik (tanpa random) supaya aman dari hydration mismatch.
export const rapidNamingQuestions: RapidNamingQuestion[] = rapidNamingLetters.map((letter, i) => {
  const base = ALPHABET.indexOf(letter);
  const distractors = [7, 13, 19].map((step) => ALPHABET[(base + step + i) % 26]).filter((c) => c !== letter);
  const unique = Array.from(new Set(distractors));
  while (unique.length < 3) unique.push(ALPHABET[(base + unique.length + 3) % 26]);
  const options = unique.slice(0, 3);
  const correct = i % 4;
  options.splice(correct, 0, letter);
  return { letter, options, correct };
});

export const spellingQuestions: SpellingQuestion[] = [
  { audio: "kucing", options: ["KUCING", "KUSING", "KUSENG", "KUCIENG"], correct: 0 },
  { audio: "pepaya", options: ["PEPAIA", "PEPAYA", "PAPAIA", "PEPAYAH"], correct: 1 },
  { audio: "sekolah", options: ["SEKOLAH", "SAKOLAH", "SEKOLOH", "SIKOLAH"], correct: 0 },
  { audio: "belajar", options: ["BLAKAR", "BELIJAR", "BELAJAR", "BELAJER"], correct: 2 },
  { audio: "langsung", options: ["LANSUNG", "LANGSUNG", "LANGSONG", "LANGSOONG"], correct: 1 },
  { audio: "pertama", options: ["PERTAMA", "PRATAMA", "PERTEMA", "PARTAMA"], correct: 0 },
  { audio: "membaca", options: ["MAMBACA", "MEMBACA", "MIMBACA", "MEMABACA"], correct: 1 },
  { audio: "perjalanan", options: ["PERJELENAN", "PERJELANAN", "PERJALANAN", "PERJALENON"], correct: 2 },
];

export const FLASH_MS = 800;

// Tiap level punya dua urutan: kalau salah di urutan pertama, anak dapat satu kesempatan lagi
// dengan urutan lain di panjang yang sama. Dua salah berturut-turut = berhenti.
export const digitLevels: number[][][] = [
  [[4, 7, 2], [6, 1, 9]],
  [[8, 1, 5, 9], [2, 7, 4, 6]],
  [[3, 6, 2, 8, 4], [9, 4, 1, 7, 5]],
  [[9, 1, 7, 3, 5, 2], [5, 8, 3, 6, 1, 4]],
  [[4, 8, 2, 6, 1, 7, 3], [7, 2, 9, 4, 8, 1, 5]],
];
