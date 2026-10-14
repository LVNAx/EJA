// Indonesian test words. Regenerate with node scripts/generate-indonesian-audio.mjs.
const words = [
  "belajar",
  "bola",
  "duri",
  "kaki",
  "kucing",
  "langsung",
  "meja",
  "membaca",
  "pagi",
  "pepaya",
  "perjalanan",
  "pertama",
  "roti",
  "sapi",
  "sekolah",
  "tahu",
] as const;
export function recordedWordAudio(text: string): string | null {
  const word = text.trim().toLocaleLowerCase("id-ID");
  return words.some((entry) => entry === word) ? `/audio/id/${word}.wav` : null;
}
