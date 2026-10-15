import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentRecord } from "./assessment";

const values = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  },
  sessionStorage: { setItem: (k: string, v: string) => values.set(k, v) },
});
beforeEach(() => {
  values.clear();
  vi.resetModules();
});
const record = (id: string): AssessmentRecord => ({
  id,
  completedAt: "2026-10-15T09:00:00.000Z",
  submission: { version: 2, answers: [] },
});
const ids = Array.from(
  { length: 12 },
  (_, i) => `12345678-1234-4234-8234-${String(i).padStart(12, "0")}`,
);

describe("catatan tes lokal", () => {
  it("memisahkan profil dan tidak menggandakan sesi saat simpan ulang", async () => {
    const store = await import("./assessment-store");
    store.saveLocalAssessment("anak-a", record(ids[0]));
    store.saveLocalAssessment("anak-a", record(ids[0]));
    store.saveLocalAssessment("anak-b", record(ids[1]));
    expect(JSON.parse(values.get("eja-assessments-v2:anak-a")!)).toEqual([
      record(ids[0]),
    ]);
    expect(JSON.parse(values.get("eja-assessments-v2:anak-b")!)).toEqual([
      record(ids[1]),
    ]);
  });
  it("membatasi riwayat ke sepuluh sesi terbaru tanpa menyentuh catatan belajar", async () => {
    values.set("eja-progress-v2:anak-a", "existing progress");
    const store = await import("./assessment-store");
    for (const id of ids) store.saveLocalAssessment("anak-a", record(id));
    const saved = JSON.parse(values.get("eja-assessments-v2:anak-a")!);
    expect(saved).toHaveLength(10);
    expect(saved[0].id).toBe(ids[11]);
    expect(values.get("eja-progress-v2:anak-a")).toBe("existing progress");
  });
  it("menolak data rusak sebelum menulis riwayat", async () => {
    const store = await import("./assessment-store");
    expect(() =>
      store.saveLocalAssessment("anak-a", {
        ...record(ids[0]),
        submission: { version: 2, answers: [], riskLevel: "low" },
      } as AssessmentRecord),
    ).toThrow();
    expect(values.has("eja-assessments-v2:anak-a")).toBe(false);
  });
});
