import { describe, expect, it } from "vitest";
import type { ParentNotification } from "@/lib/dashboard/types";
import { composeEmail, planEmails, type SentRecord } from "./plan";

const NOW = Date.UTC(2026, 9, 15, 3, 0, 0);
const DAY = 86_400_000;
const note = (over: Partial<ParentNotification> = {}): ParentNotification => ({ id: "inactive:c1:2026-10-09", childId: "c1", kind: "inactive", title: "Rizky sudah 6 hari tidak membuka EJA", ...over });
const sent = (daysAgo: number, over: Partial<SentRecord> = {}): SentRecord => ({ childId: "c1", kind: "inactive", notificationId: "inactive:c1:2026-10-05", sentAt: new Date(NOW - daysAgo * DAY).toISOString(), ...over });

describe("planEmails", () => {
  it("mengirim notifikasi baru bila belum pernah dikirim", () => {
    expect(planEmails([note()], [], NOW)).toHaveLength(1);
  });

  it("peristiwa yang sama tidak pernah dikirim ulang", () => {
    expect(planEmails([note()], [sent(10, { notificationId: "inactive:c1:2026-10-09" })], NOW)).toHaveLength(0);
  });

  it("jenis sama untuk anak sama: tidak dikirim dalam 3 hari, boleh setelahnya", () => {
    expect(planEmails([note()], [sent(2)], NOW)).toHaveLength(0);
    expect(planEmails([note()], [sent(3)], NOW)).toHaveLength(1);
  });

  it("batas per anak dan per jenis: anak lain atau jenis lain tidak terblokir", () => {
    expect(planEmails([note({ childId: "c2", id: "inactive:c2:2026-10-09" })], [sent(1)], NOW)).toHaveLength(1);
    expect(planEmails([note({ kind: "quiz-drop", id: "quiz-drop:c1:2026-10-12" })], [sent(1)], NOW)).toHaveLength(1);
  });
});

describe("composeEmail", () => {
  it("tidak memuat tingkat risiko atau skor, dan menyertakan disclaimer serta tautan dasbor", () => {
    const { subject, text } = composeEmail([note(), note({ id: "screening:1", kind: "screening-complete", title: "Hasil skrining Rizky sudah tersedia" })], "https://eja.example/dashboard");
    expect(subject).toBe("2 pembaruan dari EJA");
    expect(text).toContain("https://eja.example/dashboard");
    expect(text).toContain("bukan alat diagnosis");
    expect(text.toLowerCase()).not.toMatch(/risiko (rendah|sedang|tinggi)|skor/);
  });

  it("satu notifikasi memakai judulnya sebagai subjek", () => {
    expect(composeEmail([note()], "https://x/dashboard").subject).toBe("Rizky sudah 6 hari tidak membuka EJA");
  });
});
