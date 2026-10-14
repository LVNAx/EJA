// Run on macOS with the Indonesian Damayanti voice installed.
// Fixed test stimuli are checked against the question bank by recordings.test.ts.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bank = readFileSync(
  path.join(root, "lib/screening/questions.ts"),
  "utf8",
);
const words = [
  ...new Set([...bank.matchAll(/audio: "([^"]+)"/g)].map((match) => match[1])),
].sort();
const dir = path.join(root, "public/audio/id");
mkdirSync(dir, { recursive: true });
for (const word of words)
  execFileSync("say", [
    "-v",
    "Damayanti",
    "-r",
    "150",
    "--file-format=WAVE",
    "--data-format=LEI16@22050",
    "-o",
    path.join(dir, `${word}.wav`),
    word,
  ]);
writeFileSync(
  path.join(root, "lib/speech/recordings.ts"),
  `// Indonesian test words. Regenerate with node scripts/generate-indonesian-audio.mjs.\nconst words = ${JSON.stringify(words)} as const;\nexport function recordedWordAudio(text: string): string | null {\n  const word = text.trim().toLocaleLowerCase("id-ID");\n  return words.some((entry) => entry === word) ? \`/audio/id/\${word}.wav\` : null;\n}\n`,
);
console.log(`${words.length} Indonesian test recordings generated.`);
