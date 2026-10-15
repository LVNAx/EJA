import { phonologicalQuestions } from "./questions";

export const TASKS = [
  {
    key: "sounds",
    title: "Bunyi kata",
    instruction: "Dengar kata. Pilih gambar dengan bunyi awal yang sama.",
    example: "Contoh: susu dan sapu sama-sama dimulai dengan bunyi s.",
  },
  {
    key: "reading",
    title: "Membaca",
    instruction: "Baca teks dan jawab dalam 60 detik. Waktu boleh ditambah.",
    example:
      "Kamera disiapkan sebelum waktu berjalan. Setelah teks, ada enam kata pendek tanpa batas waktu.",
  },
  {
    key: "naming",
    title: "Sebut angka",
    instruction: "Sebut angka dari kiri ke kanan, baris demi baris.",
    example: "Pendamping mencatat waktu dan angka yang keliru disebut.",
  },
  {
    key: "dictation",
    title: "Dikte",
    instruction: "Dengar kata, lalu ketik ejaannya.",
    example: "Tidak ada pilihan jawaban. Gunakan keyboard seperti biasa.",
  },
] as const;
export type TaskKey = (typeof TASKS)[number]["key"];

export const SOUND_ITEMS = phonologicalQuestions
  .slice(0, 6)
  .map((q, i) => ({ ...q, id: `sound-${i + 1}` }));
export const READING_ITEMS = [
  { id: "word-1", text: "buku", kind: "word" },
  { id: "word-2", text: "rumah", kind: "word" },
  { id: "word-3", text: "sekolah", kind: "word" },
  { id: "word-4", text: "bermain", kind: "word" },
  { id: "pseudo-1", text: "nalu", kind: "pseudo" },
  { id: "pseudo-2", text: "pimota", kind: "pseudo" },
] as const;
export const PASSAGE = [
  "Bola Bima berwarna biru.",
  "Bima bermain bola di taman.",
  "Setelah bermain, Bima pulang.",
];
export const MEANING_ITEMS = [
  {
    id: "meaning-1",
    prompt: "Apa warna bola Bima?",
    options: ["Merah", "Biru", "Hijau"],
    correct: 1,
  },
  {
    id: "meaning-2",
    prompt: "Ke mana Bima setelah bermain?",
    options: ["Pulang", "Ke sekolah", "Ke pasar"],
    correct: 0,
  },
] as const;
export const NAMING_GRID = [
  "2",
  "4",
  "6",
  "8",
  "6",
  "2",
  "8",
  "4",
  "8",
  "6",
  "4",
  "2",
];
export const DICTATION_ITEMS = [
  { id: "dictation-1", word: "kucing" },
  { id: "dictation-2", word: "pepaya" },
  { id: "dictation-3", word: "sekolah" },
  { id: "dictation-4", word: "belajar" },
] as const;
