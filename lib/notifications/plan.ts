import type { NotificationKind, ParentNotification } from "@/lib/dashboard/types";

export interface SentRecord {
  childId: string;
  kind: NotificationKind;
  notificationId: string;
  sentAt: string;
}

/** B.7: email dengan jenis yang sama untuk anak yang sama dikirim maksimal sekali per tiga hari. */
export const MIN_DAYS_BETWEEN_SAME_EMAIL = 3;

/**
 * Memilih notifikasi yang perlu diemail: peristiwa yang sama tidak pernah dikirim ulang, dan jenis yang sama
 * untuk anak yang sama dibatasi sekali per tiga hari. Notifikasi tetap tampil di dasbor apa pun hasilnya.
 */
export function planEmails(notifications: ParentNotification[], sent: SentRecord[], now: number): ParentNotification[] {
  const already = new Set(sent.map((s) => s.notificationId));
  const windowMs = MIN_DAYS_BETWEEN_SAME_EMAIL * 86_400_000;
  const picked: ParentNotification[] = [];

  for (const n of notifications) {
    if (already.has(n.id)) continue;
    const recent = sent.some((s) => s.childId === n.childId && s.kind === n.kind && now - new Date(s.sentAt).getTime() < windowMs);
    if (recent) continue;
    picked.push(n);
  }
  return picked;
}

/** Isi email sengaja minim: tanpa tingkat risiko atau skor. Detail hanya ada di dasbor setelah masuk. */
export function composeEmail(items: ParentNotification[], dashboardUrl: string): { subject: string; text: string } {
  const lines = items.map((n) => `• ${n.title}${n.detail ? `\n  ${n.detail}` : ""}`);
  return {
    subject: items.length === 1 ? items[0].title : `${items.length} pembaruan dari EJA`,
    text: [
      "Halo,",
      "",
      "Ada pembaruan terbaru dari EJA:",
      "",
      ...lines,
      "",
      `Buka dasbor: ${dashboardUrl}`,
      "",
      "EJA adalah alat bantu skrining, bukan alat diagnosis. Hasil di dasbor adalah bahan diskusi dengan psikolog klinis atau dokter anak tumbuh kembang.",
      "Untuk berhenti menerima email ini, matikan opsi email di bagian Notifikasi pada dasbor.",
    ].join("\n"),
  };
}
