import { describe, expect, it } from "vitest";
import { awardOnce, nextStreak } from "./progress";

describe("reward", () => {
  it("memberi XP sekali untuk satu kunci aktivitas", () => {
    const first = awardOnce([], "chunk:pecahan:utuh", 10);
    const repeated = awardOnce(first.keys, "chunk:pecahan:utuh", 10);
    expect(first.gained).toBe(10);
    expect(repeated.gained).toBe(0);
    expect(repeated.keys).toEqual(["chunk:pecahan:utuh"]);
  });
});

describe("streak", () => {
  it("menghitung sesi pada hari yang sama sekali saja", () =>
    expect(nextStreak("2026-10-04", 3, "2026-10-04")).toBe(3));
  it("bertambah pada hari berurutan", () =>
    expect(nextStreak("2026-10-04", 3, "2026-10-05")).toBe(4));
  it("mulai lagi setelah hari terlewat", () =>
    expect(nextStreak("2026-10-04", 3, "2026-10-07")).toBe(1));
});
