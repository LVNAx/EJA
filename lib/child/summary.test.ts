import { describe, expect, it } from "vitest";
import { initialState } from "@/features/learning/state/store";
import { childSummary } from "./summary";

describe("ringkasan anak", () => {
  it("tidak menampilkan streak lama sebagai streak aktif", () => {
    const state = { ...initialState, streak: 5, lastActiveDate: "2026-10-01" };
    expect(childSummary(state, new Date(2026, 9, 4)).streak).toBe(0);
    state.lastActiveDate = "2026-10-03";
    expect(childSummary(state, new Date(2026, 9, 4)).streak).toBe(5);
  });
  it("menghitung hari selesai dan hanya melanjutkan sesi aktif", () => {
    const state = structuredClone(initialState);
    const session = { id: "done", kind: "writing" as const, activityId: "A", title: "Menulis A", startedAt: new Date(2026, 9, 3).toISOString(), completedAt: new Date(2026, 9, 4).toISOString(), xpEarned: 15, learned: [] };
    state.sessions.done = session;
    state.sessions.abandoned = { ...session, id: "abandoned", completedAt: null };
    state.sessions.active = { ...session, id: "active", completedAt: null };
    state.activePractices.writing = "active";
    const result = childSummary(state, new Date(2026, 9, 4, 12));
    expect(result.todayCount).toBe(1);
    expect(result.completed).toHaveLength(1);
    expect(result.active?.id).toBe("active");
    expect(result.recent[0].id).toBe("done");
  });
});
