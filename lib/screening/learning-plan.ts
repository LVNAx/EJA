import {
  buildAssessment,
  type AssessmentRecord,
  type TaskSummary,
} from "./assessment";
import type { TaskKey } from "./protocol";

const PRACTICE: Record<
  TaskKey,
  { label: string; path: string; instruction: string }
> = {
  sounds: {
    label: "Bunyi dan suku kata",
    path: "/latihan/membaca",
    instruction: "Dengarkan satu kata per suku kata, lalu baca bersama.",
  },
  reading: {
    label: "Membaca",
    path: "/latihan/membaca",
    instruction:
      "Coba satu kata pendek. Dengarkan contoh, lalu baca ulang bersama.",
  },
  naming: {
    label: "Mengenal angka",
    path: "/latihan/menulis",
    instruction:
      "Pilih angka 0–9, sebutkan, lalu ikuti bentuknya. Tidak perlu berlomba cepat.",
  },
  dictation: {
    label: "Menulis",
    path: "/latihan/menulis",
    instruction:
      "Dampingi anak mengenali huruf pembentuk kata, lalu latih satu huruf dahulu.",
  },
};

export const answerScore = (task: Pick<TaskSummary, "correct" | "assessed">) =>
  task.assessed ? Math.round((100 * task.correct) / task.assessed) : null;

/** Transparent practice rules, not a classifier or a clinical threshold. */
export function buildAssessmentPlan(record: AssessmentRecord) {
  const tasks = buildAssessment(record.submission);
  const observed = tasks.filter((t) => t.assessed > 0);
  const errors = observed
    .filter((t) => t.correct < t.assessed)
    .sort((a, b) => a.correct / a.assessed - b.correct / b.assessed);
  const chosen =
    errors[0] ??
    observed.find((t) => t.assisted > 0) ??
    tasks.find((t) => t.status !== "complete") ??
    tasks[1];
  const reason = !chosen.assessed
    ? `${chosen.title} belum dinilai. Coba kegiatan ini bersama pendamping dahulu.`
    : chosen.correct < chosen.assessed
      ? `${chosen.title}: ${chosen.assessed - chosen.correct} dari ${chosen.assessed} jawaban belum sesuai. Ulangi dengan contoh lebih kecil.`
      : chosen.assisted
        ? `${chosen.title}: ${chosen.assisted} jawaban masih dibantu. Ulangi contoh serupa, lalu kurangi bantuan jika anak siap.`
        : chosen.status !== "complete"
          ? `${chosen.title}: baru ${chosen.assessed} dari ${chosen.total} butir dinilai. Lengkapi saat anak siap.`
          : "Semua kegiatan sudah dinilai dan jawabannya sesuai. Coba contoh lain untuk melanjutkan latihan.";
  const eyes = record.submission.eyeTracking;
  const coverage =
    eyes && eyes.observedMs > 0 ? eyes.trackedMs / eyes.observedMs : null;
  const camera =
    coverage === null
      ? null
      : {
          coverage: Math.round(coverage * 100),
          observedMs: eyes!.observedMs,
          missingMs: eyes!.observedMs - eyes!.trackedMs,
          // These are observation-quality gates used by the existing demo, not learning norms.
          sufficient: eyes!.observedMs >= 5000 && coverage >= 0.65,
          advice:
            eyes!.observedMs < 5000
              ? "Pengamatan terlalu singkat. Ulangi bila perlu; hasil jawaban tetap dapat dipakai."
              : coverage < 0.65
                ? "Sinyal kamera sering hilang. Periksa cahaya dan posisi kamera sebelum pengamatan berikutnya; ini tidak membuktikan anak kurang fokus."
                : "Sinyal mata cukup terekam untuk catatan sesi. Pilih latihan dari jawaban yang perlu dibantu, bukan dari persentase kamera.",
        };
  const next =
    record.submission.readingSession?.experience === "moving"
      ? {
          key: "reading" as const,
          label: "Membaca dengan panduan",
          path: "/latihan/pola-membaca?latihan=baris",
          instruction:
            "Gunakan penanda satu bagian dan baca pelan-pelan bersama pendamping.",
          reason:
            "Anak menyampaikan tulisan terasa bergerak atau bercampur. Coba panduan bagian untuk mencari cara membaca yang nyaman. Ini laporan anak, bukan kesimpulan kamera.",
        }
      : { key: chosen.key, ...PRACTICE[chosen.key], reason };
  return {
    tasks,
    next,
    camera,
  };
}
