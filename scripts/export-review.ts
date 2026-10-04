// Mengekspor seluruh teks rekomendasi ke satu berkas Markdown untuk ditinjau psikolog mitra.
// Jalankan: npm run export:review  ->  docs/rekomendasi-untuk-ditinjau.md
import { writeFileSync } from "node:fs";
import path from "node:path";
import { BRING_TO_CONSULT, CAVEAT_APPROACH, CONTENT_REVIEW, DIMENSION_COPY, FACTORS_AFFECTING_RESULT, LEVEL_COPY, PROFESSIONALS } from "../lib/recommendations/content";
import { REFERRAL_GUIDANCE } from "../lib/recommendations/professionals";
import { SCREENING_CONFIG } from "../lib/screening/config";

const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
const out: string[] = [];

out.push("# Teks rekomendasi EJA untuk ditinjau", "");
out.push(`Status saat ini: **${CONTENT_REVIEW.status === "draft" ? "DRAF, belum ditinjau psikolog" : `ditinjau oleh ${CONTENT_REVIEW.reviewedBy} (${CONTENT_REVIEW.reviewedAt})`}**`, "");
out.push("Berkas ini dibuat otomatis dari `lib/recommendations/content.ts`. Untuk mengubah teks, ubah berkas itu, bukan berkas ini.", "");
out.push("## Pertanyaan untuk peninjau", "");
out.push(list([
  "Apakah bahasa tiap tingkat risiko tepat, tidak menakutkan, dan tidak terdengar seperti diagnosis?",
  "Apakah saran untuk orang tua dan guru aman dan masuk akal untuk anak SD kelas 1–6?",
  "Apakah jenis profesional yang disarankan pada tiap tingkat sudah tepat?",
  `Apakah ambang (rendah > ${SCREENING_CONFIG.levelThresholds.low}, sedang > ${SCREENING_CONFIG.levelThresholds.moderate}), batas eskalasi (< ${SCREENING_CONFIG.escalationBelow}), dan skor memori kerja (rentang − ${SCREENING_CONFIG.digitSpan.floor}) / ${SCREENING_CONFIG.digitSpan.range} masuk akal untuk usia ini?`,
]), "");

out.push("## Tingkat risiko", "");
for (const [level, c] of Object.entries(LEVEL_COPY)) {
  out.push(`### ${c.label} (\`${level}\`)`, "", `**Arti:** ${c.meaning}`, "", `**Penenang:** ${c.reassurance}`, "", `**Konsultasi (${c.consultUrgency}):** ${c.consult}`, "", `**Ulang skrining:** ${c.retest}`, "", "**Saran orang tua:**", list(c.parentActions), "", "**Saran guru:**", list(c.teacherActions), "");
}

out.push("## Dimensi", "");
for (const [key, d] of Object.entries(DIMENSION_COPY)) {
  out.push(`### ${d.label} (\`${key}\`, bobot ${Math.round(SCREENING_CONFIG.weights[key as keyof typeof SCREENING_CONFIG.weights] * 100)}%)`, "", `**Yang diukur:** ${d.measures}`, "", `- Baik: ${d.meaning.good}`, `- Perlu dipantau: ${d.meaning.watch}`, `- Perlu perhatian: ${d.meaning.attention}`, "", "**Saran orang tua bila lemah:**", list(d.parentTips), "", "**Saran guru bila lemah:**", list(d.teacherTips), "", `**Pendekatan belajar:** ${d.helpfulApproach}`, "");
}

out.push("## Profesional yang disarankan", "", ...PROFESSIONALS.map((p) => `- **${p.role}** (${p.levels.join(", ")}): ${p.note}`), "", "### Panduan mencari bantuan (bila direktori terverifikasi belum ada)", "", list(REFERRAL_GUIDANCE), "");
out.push("## Lain-lain", "", "**Bawa saat konsultasi:**", list(BRING_TO_CONSULT), "", "**Hal yang dapat memengaruhi hasil:**", list(FACTORS_AFFECTING_RESULT), "", `**Catatan pendekatan belajar:** ${CAVEAT_APPROACH}`, "");

writeFileSync(path.join(__dirname, "..", "docs", "rekomendasi-untuk-ditinjau.md"), out.join("\n"));
console.log("Ditulis: docs/rekomendasi-untuk-ditinjau.md");
