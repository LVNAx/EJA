import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeReadingRegions, type ReadingStudy } from "./reading-study";
const values = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  },
});
beforeEach(() => {
  values.clear();
  vi.resetModules();
});
const record = (i: number): ReadingStudy => ({
  id: `12345678-1234-4234-8234-${String(i).padStart(12, "0")}`,
  completedAt: new Date(Date.UTC(2026, 9, 15, 1, i)).toISOString(),
  version: 1,
  mode: "guided-practice",
  rounds: [
    {
      passageId: "bola",
      observation: analyzeReadingRegions([], 6000, [], null),
      answers: [null, null],
      oral: ["unassessed", "unassessed", "unassessed"],
      assisted: false,
    },
  ],
});
describe("ringkasan eksperimen lokal", () => {
  it("memisahkan anak, memperbarui sesi yang sama, dan tidak menyimpan sampel posisi", async () => {
    const store = await import("./study-store");
    store.saveReadingStudy("a", record(0));
    store.saveReadingStudy("a", record(0));
    store.saveReadingStudy("b", record(1));
    expect(JSON.parse(values.get("eja-reading-studies-v1:a")!)).toEqual([
      record(0),
    ]);
    expect(JSON.parse(values.get("eja-reading-studies-v1:b")!)).toEqual([
      record(1),
    ]);
    expect(values.get("eja-reading-studies-v1:a")).not.toMatch(
      /landmarks|samples|predictions/,
    );
  });
  it("menyimpan paling banyak sepuluh sesi terbaru tanpa mengubah latihan atau tes", async () => {
    const store = await import("./study-store");
    values.set("eja-progress-v2:a", "original");
    for (let i = 11; i >= 0; i--) store.saveReadingStudy("a", record(i));
    const saved = JSON.parse(values.get("eja-reading-studies-v1:a")!);
    expect(saved).toHaveLength(10);
    expect(saved[0].id).toBe(record(11).id);
    expect(values.get("eja-progress-v2:a")).toBe("original");
  });
  it("menolak data tidak sah sebelum menyimpan", async () => {
    const store = await import("./study-store");
    expect(() =>
      store.saveReadingStudy("a", {
        ...record(0),
        samples: [1, 2, 3],
      } as ReadingStudy),
    ).toThrow();
    expect(values.size).toBe(0);
  });
});
