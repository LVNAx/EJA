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
    expect(
      JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}").totalXp,
    ).toBe(40);
  });

  it("memberi reward membaca dan menulis sekali per sesi", async () => {
    const store = await import("./store");
    const reading = store.ensurePracticeSession(
      "reading",
      "pecahan",
      "Membaca pecahan",
    );
    store.recordReadingAttempt(reading, true);
    expect(store.finishPractice(reading, ["Membaca kata pecahan"])).toBe(
      reading,
    );
    expect(store.finishPractice(reading, ["Membaca kata pecahan"])).toBeNull();
    const writing = store.ensurePracticeSession("writing", "A", "Menulis A");
    store.recordWritingAttempt(writing, 85);
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
    expect(
      JSON.parse(values.get("eja-progress-v2:demo-rizky") ?? "{}").totalXp,
    ).toBe(30);
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
    expect(rizky.totalXp).toBe(5);
    expect(rizky.sessions[id].completedAt).toBeTruthy();
    expect(values.has("eja-progress-v2:demo")).toBe(false);
    window.location.pathname = "/child/demo-nadia";
    store.updateSettings({ audioRate: 0.7 });
    const nadia = JSON.parse(values.get("eja-progress-v2:demo-nadia")!);
    expect(nadia.totalXp).toBe(0);
    expect(nadia.sessions).toEqual({});
    window.location.pathname = "/child/demo-rizky/belajar";
    store.updateSettings({ rewardSound: false });
    expect(
      JSON.parse(values.get("eja-progress-v2:demo-rizky")!).settings.textSize,
    ).toBe("large");
  });
});

describe("catatan bantuan dan kelanjutan latihan", () => {
  it("kuis yang belum dijawab tidak dapat dianggap selesai", async () => {
    const store = await import("./store");
    store.ensureLessonSession("pecahan-dasar");
    expect(store.finishLesson("pecahan-dasar", "kuis")).toBeNull();
    store.recordQuizAnswer("pecahan-dasar", "kuis", 1);
    expect(store.finishLesson("pecahan-dasar", "kuis")).toBeNull();
    store.recordHelp(
      Object.keys(
        JSON.parse(values.get("eja-progress-v2:demo-rizky")!).sessions,
      )[0],
      "hint",
    );
    store.recordQuizAnswer("pecahan-dasar", "kuis", 0);
    expect(store.finishLesson("pecahan-dasar", "kuis")).toBeTruthy();
    const state = JSON.parse(values.get("eja-progress-v2:demo-rizky")!);
    const evidence = Object.values(state.evidence)[0] as {
      quizzes: {
        kuis: {
          attempts: number;
          incorrect: number;
          solved: boolean;
          firstTryCorrect: boolean;
        };
      };
      hints: number;
    };
    expect(evidence.quizzes.kuis).toEqual({
      attempts: 2,
      incorrect: 1,
      solved: true,
      firstTryCorrect: false,
    });
    expect(evidence.hints).toBe(1);
  });
  it("mengulang materi tidak menghapus keberhasilan sebelumnya", async () => {
    const store = await import("./store");
    store.ensureLessonSession("pecahan-dasar");
    store.recordQuizAnswer("pecahan-dasar", "kuis", 0);
    store.finishLesson("pecahan-dasar", "kuis");
    store.ensureLessonSession("pecahan-dasar");
    expect(
      JSON.parse(values.get("eja-progress-v2:demo-rizky")!).lessons[
        "pecahan-dasar"
      ].completed,
    ).toBe(true);
  });
  it("memulihkan pilihan huruf dan bacaan pada kunjungan berikutnya", async () => {
    const store = await import("./store");
    store.selectPractice("writing", "z");
    store.selectPractice("reading", "kelompok");
    vi.resetModules();
    const next = await import("./store");
    next.updateSettings({ textSize: "large" });
    expect(
      JSON.parse(values.get("eja-progress-v2:demo-rizky")!).selections,
    ).toEqual({ reading: "kelompok", writing: "z" });
  });
  it("membedakan usaha dari kemiripan tulisan dan mencegah pengumpulan bintang berulang", async () => {
    const store = await import("./store");
    const first = store.ensurePracticeSession("writing", "A", "Menulis A");
    store.recordWritingAttempt(first, 0);
    store.finishPractice(first, ["Mencoba A"]);
    expect(JSON.parse(values.get("eja-progress-v2:demo-rizky")!).totalXp).toBe(
      5,
    );
    const second = store.ensurePracticeSession("writing", "A", "Menulis A");
    store.recordWritingAttempt(second, 85);
    store.finishPractice(second, ["Berlatih A"]);
    expect(JSON.parse(values.get("eja-progress-v2:demo-rizky")!).totalXp).toBe(
      15,
    );
    const third = store.ensurePracticeSession("writing", "A", "Menulis A");
    store.recordWritingAttempt(third, 90);
    store.finishPractice(third, ["Mengulang A"]);
    expect(JSON.parse(values.get("eja-progress-v2:demo-rizky")!).totalXp).toBe(
      15,
    );
  });
});

it("memulihkan pilihan dari sesi aktif pada data versi dua yang lama", async () => {
  const store = await import("./store");
  const id = store.ensurePracticeSession("writing", "B", "Menulis B");
  const old = JSON.parse(values.get("eja-progress-v2:demo-rizky")!);
  delete old.selections;
  delete old.evidence;
  values.set("eja-progress-v2:demo-rizky", JSON.stringify(old));
  vi.resetModules();
  const next = await import("./store");
  next.updateSettings({ textSize: "large" });
  const saved = JSON.parse(values.get("eja-progress-v2:demo-rizky")!);
  expect(saved.selections.writing).toBe("B");
  expect(saved.activePractices.writing).toBe(id);
});
