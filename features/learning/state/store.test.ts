import { beforeEach, describe, expect, it, vi } from "vitest";

const values = new Map<string, string>();
vi.stubGlobal("window", {
  location: { pathname: "/child/demo-rizky/belajar" },
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

beforeEach(() => {
  values.clear();
  window.location.pathname = "/child/demo-rizky/belajar";
  vi.resetModules();
});

describe("sesi belajar lokal", () => {
  it("memigrasikan sesi Matematika lama tanpa menghapus XP", async () => {
    const oldState = {
      version: 1,
      totalXp: 10,
      streak: 1,
      lastActiveDate: "2026-10-04",
      rewardKeys: ["chunk:pecahan-dasar:utuh"],
      lessons: {
        "pecahan-dasar": {
          currentStep: 1,
          activeSessionId: "lama",
          completed: false,
        },
      },
      sessions: {
        lama: {
          id: "lama",
          lessonId: "pecahan-dasar",
          startedAt: "2026-10-04T00:00:00.000Z",
          completedAt: null,
          xpEarned: 10,
          learned: ["Satu benda utuh"],
        },
      },
      settings: { textSize: "normal", audioRate: 0.9, rewardSound: true },
      badges: [],
    };
    values.set("eja-progress-v2:demo-rizky", JSON.stringify(oldState));
    const store = await import("./store");
    store.updateSettings({ textSize: "large" });
    const saved = JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}");
    expect(saved.version).toBe(2);
    expect(saved.totalXp).toBe(10);
    expect(saved.sessions.lama.kind).toBe("math");
    expect(saved.settings.fontFamily).toBe("standard");
    expect(saved.settings.textSize).toBe("large");
  });

  it("menyimpan XP sesi nyata dan mencegah reward ganda", async () => {
    const store = await import("./store");
    const sessionId = store.ensureLessonSession("pecahan-dasar");
    expect(sessionId).toBeTruthy();
    store.advanceLesson("pecahan-dasar", "utuh", 1);
    store.advanceLesson("pecahan-dasar", "utuh", 1);
    store.completeQuiz("pecahan-dasar", "kuis");
    store.completeQuiz("pecahan-dasar", "kuis");
    expect(store.finishLesson("pecahan-dasar", "kuis")).toBe(sessionId);
    expect(store.finishLesson("pecahan-dasar", "kuis")).toBeNull();
    const saved = JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}");
    expect(saved.totalXp).toBe(40);
    expect(saved.sessions[sessionId!].xpEarned).toBe(40);
    expect(saved.sessions[sessionId!].completedAt).toBeTruthy();
    const secondId = store.ensureLessonSession("pecahan-dasar");
    expect(secondId).not.toBe(sessionId);
    store.advanceLesson("pecahan-dasar", "utuh", 1);
    expect(JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}").totalXp).toBe(40);
  });

  it("memberi reward membaca dan menulis sekali per sesi", async () => {
    const store = await import("./store");
    const reading = store.ensurePracticeSession(
      "reading",
      "pecahan",
      "Membaca pecahan",
    );
    expect(store.finishPractice(reading, ["Membaca kata pecahan"])).toBe(
      reading,
    );
    expect(store.finishPractice(reading, ["Membaca kata pecahan"])).toBeNull();
    const writing = store.ensurePracticeSession("writing", "A", "Menulis A");
    expect(store.finishPractice(writing, ["Menelusuri A"])).toBe(writing);
    const saved = JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}");
    expect(saved.totalXp).toBe(30);
    expect(saved.sessions[reading].xpEarned).toBe(15);
    expect(saved.sessions[writing].xpEarned).toBe(15);
    expect(saved.streak).toBe(1);
    const another = store.ensurePracticeSession(
      "reading",
      "pecahan",
      "Membaca pecahan",
    );
    expect(another).not.toBe(reading);
    store.finishPractice(another, ["Membaca kata pecahan"]);
    expect(JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}").totalXp).toBe(45);
  });

  it("memisahkan progres tiap anak pada browser yang sama", async () => {
    const store = await import("./store");
    store.ensurePracticeSession("writing", "A", "Menulis A");
    expect(values.has("eja-progress-v2:demo-rizky")).toBe(true);

    window.location.pathname = "/child/demo-nadia/belajar";
    store.ensurePracticeSession("writing", "B", "Menulis B");
    const nadia = JSON.parse(values.get("eja-progress-v2:demo-nadia") ?? "{}");
    expect(nadia.activePractices.writing).toBeTruthy();
    expect(Object.values(nadia.sessions)).toHaveLength(1);
    expect(values.get("eja-progress-v2:demo-rizky")).not.toBe(
      values.get("eja-progress-v2:demo-nadia"),
    );
  });
  it("berbagi progres dashboard dengan modul belajar tanpa mencampur anak", async () => {
    const store = await import("./store");
    const id = store.ensurePracticeSession("writing", "A", "Menulis A");
    store.finishPractice(id, ["Menulis A"]);
    window.location.pathname = "/child/demo-rizky";
    store.updateSettings({ textSize: "large" });
    const rizky = JSON.parse(values.get("eja-progress-v2:demo-rizky")!);
    expect(rizky.totalXp).toBe(15);
    expect(rizky.sessions[id].completedAt).toBeTruthy();
    expect(values.has("eja-progress-v2:demo")).toBe(false);
    window.location.pathname = "/child/demo-nadia";
    store.updateSettings({ audioRate: 0.7 });
    const nadia = JSON.parse(values.get("eja-progress-v2:demo-nadia")!);
    expect(nadia.totalXp).toBe(0);
    expect(nadia.sessions).toEqual({});
    window.location.pathname = "/child/demo-rizky/belajar";
    store.updateSettings({ rewardSound: false });
    expect(JSON.parse(values.get("eja-progress-v2:demo-rizky")!).settings.textSize).toBe("large");
  });

});
