"use client";

import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";
import { lessonById } from "../math/content";
import { awardOnce, localDateKey, nextStreak } from "./progress";
import { evidenceSchema, type LearningEvidence } from "./evidence";
import { setFontPreference } from "@/lib/accessibility/font-preference";

const settingsSchema = z.object({
  textSize: z.enum(["normal", "large"]),
  fontFamily: z.enum(["standard", "opendyslexic"]).default("standard"),
  audioRate: z.number().min(0.7).max(1.1),
  rewardSound: z.boolean(),
  reducedMotion: z.boolean().default(true),
});

const lessonProgressSchema = z.object({
  currentStep: z.number().int().nonnegative(),
  activeSessionId: z.string().nullable(),
  completed: z.boolean(),
});

const sessionSchema = z.object({
  id: z.string(),
  kind: z.enum(["math", "reading", "writing"]),
  activityId: z.string(),
  title: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  xpEarned: z.number().nonnegative(),
  learned: z.array(z.string()),
});

export const stateSchema = z.object({
  version: z.literal(2),
  selections: z
    .object({ reading: z.string(), writing: z.string() })
    .default({ reading: "pecahan", writing: "A" }),
  evidence: z.record(z.string(), evidenceSchema).default({}),
  totalXp: z.number().nonnegative(),
  streak: z.number().int().nonnegative(),
  lastActiveDate: z.string().nullable(),
  rewardKeys: z.array(z.string()),
  lessons: z.record(z.string(), lessonProgressSchema),
  activePractices: z.object({
    reading: z.string().nullable(),
    writing: z.string().nullable(),
  }),
  sessions: z.record(z.string(), sessionSchema),
  settings: settingsSchema,
  badges: z.array(z.string()),
});

const legacyStateSchema = z.object({
  version: z.literal(1),
  totalXp: z.number().nonnegative(),
  streak: z.number().int().nonnegative(),
  lastActiveDate: z.string().nullable(),
  rewardKeys: z.array(z.string()),
  lessons: z.record(z.string(), lessonProgressSchema),
  sessions: z.record(
    z.string(),
    z.object({
      id: z.string(),
      lessonId: z.string(),
      startedAt: z.string(),
      completedAt: z.string().nullable(),
      xpEarned: z.number(),
      learned: z.array(z.string()),
    }),
  ),
  settings: settingsSchema,
  badges: z.array(z.string()),
});

export type AppState = z.infer<typeof stateSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type PracticeKind = "reading" | "writing";

const STORAGE_PREFIX = "eja-progress-v2:";

function storageKey(explicitChildId?: string): string {
  if (explicitChildId) return `${STORAGE_PREFIX}${explicitChildId}`;
  if (typeof window === "undefined") return `${STORAGE_PREFIX}server`;
  const childId = /^\/child\/([^/]+)(?:\/|$)/.exec(
    window.location.pathname,
  )?.[1];
  return `${STORAGE_PREFIX}${childId ?? "demo"}`;
}

export const initialState: AppState = {
  version: 2,
  selections: { reading: "pecahan", writing: "A" },
  evidence: {},
  totalXp: 0,
  streak: 0,
  lastActiveDate: null,
  rewardKeys: [],
  lessons: {},
  activePractices: { reading: null, writing: null },
  sessions: {},
  settings: {
    textSize: "normal",
    fontFamily: "standard",
    audioRate: 0.9,
    rewardSound: true,
    reducedMotion: true,
  },
  badges: [],
};

const cache = new Map<string, AppState>();
const storageErrors = new Set<string>();
const listeners = new Set<() => void>();

function migrate(raw: unknown): AppState {
  const parsed = stateSchema.safeParse(raw);
  if (parsed.success) {
    const state = parsed.data;
    // Existing version-2 data predates saved selections. Recover the active item.
    if (raw && typeof raw === "object" && !("selections" in raw)) {
      for (const kind of ["reading", "writing"] as const) {
        const id = state.activePractices[kind];
        const session = id ? state.sessions[id] : null;
        if (session && !session.completedAt)
          state.selections[kind] = session.activityId;
      }
    }
    return state;
  }

  const old = legacyStateSchema.parse(raw);
  const sessions: AppState["sessions"] = {};
  for (const [id, session] of Object.entries(old.sessions)) {
    sessions[id] = {
      id,
      kind: "math",
      activityId: session.lessonId,
      title: lessonById(session.lessonId)?.title ?? "Matematika",
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      xpEarned: session.xpEarned,
      learned: session.learned,
    };
  }
  return stateSchema.parse({
    ...old,
    version: 2,
    activePractices: { reading: null, writing: null },
    sessions,
  });
}

function load(key: string): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? migrate(JSON.parse(raw)) : initialState;
  } catch {
    return initialState;
  }
}

function snapshot(childId?: string): AppState {
  const key = storageKey(childId);
  if (!cache.has(key)) cache.set(key, load(key));
  return cache.get(key)!;
}

function onStorage(event: StorageEvent) {
  if (event.key === null) cache.clear();
  else if (event.key.startsWith(STORAGE_PREFIX)) cache.delete(event.key);
  else return;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined")
    window.addEventListener?.("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined")
      window.removeEventListener?.("storage", onStorage);
  };
}

function commit(next: AppState): void {
  const key = storageKey();
  cache.set(key, next);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
    storageErrors.delete(key);
  } catch {
    storageErrors.add(key);
  }
  listeners.forEach((listener) => listener());
}

function change(mutator: (draft: AppState) => void): void {
  const draft = structuredClone(snapshot());
  mutator(draft);
  commit(draft);
}

function completeDay(draft: AppState): void {
  const today = localDateKey(new Date());
  draft.streak = nextStreak(draft.lastActiveDate, draft.streak, today);
  draft.lastActiveDate = today;
  if (draft.totalXp >= 50 && !draft.badges.includes("Langkah Pertama")) {
    draft.badges.push("Langkah Pertama");
  }
}

function award(
  draft: AppState,
  sessionId: string,
  key: string,
  amount: number,
): void {
  const result = awardOnce(draft.rewardKeys, key, amount);
  draft.rewardKeys = result.keys;
  draft.totalXp += result.gained;
  draft.sessions[sessionId].xpEarned += result.gained;
}

export function useAppState(childId?: string): AppState {
  const getSnapshot = useCallback(() => snapshot(childId), [childId]);
  return useSyncExternalStore(subscribe, getSnapshot, () => initialState);
}

export function useBrowserReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useStorageStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !storageErrors.has(storageKey()),
    () => true,
  );
}

export function selectPractice(kind: PracticeKind, activityId: string): void {
  change((draft) => {
    draft.selections[kind] = activityId;
  });
}

function evidenceFor(draft: AppState, sessionId: string): LearningEvidence {
  return (draft.evidence[sessionId] ??= evidenceSchema.parse({}));
}

export function recordHelp(sessionId: string, kind: "hint" | "audio"): void {
  if (
    !snapshot().sessions[sessionId] ||
    snapshot().sessions[sessionId].completedAt
  )
    return;
  change((draft) => {
    const evidence = evidenceFor(draft, sessionId);
    if (kind === "hint") evidence.hints += 1;
    else evidence.audioPlays += 1;
  });
}

export function recordWritingAttempt(sessionId: string, score: number): void {
  if (
    !snapshot().sessions[sessionId] ||
    snapshot().sessions[sessionId].completedAt ||
    !Number.isFinite(score)
  )
    return;
  change((draft) => {
    const evidence = evidenceFor(draft, sessionId);
    evidence.writingScores = [
      ...evidence.writingScores.slice(-49),
      Math.max(0, Math.min(100, score)),
    ];
  });
}

export function recordReadingAttempt(
  sessionId: string,
  matched: boolean,
): void {
  if (
    !snapshot().sessions[sessionId] ||
    snapshot().sessions[sessionId].completedAt
  )
    return;
  change((draft) => {
    const evidence = evidenceFor(draft, sessionId);
    evidence.readingAttempts += 1;
    if (matched) evidence.readingMatches += 1;
  });
}

export function recordSelfReading(sessionId: string): void {
  if (
    !snapshot().sessions[sessionId] ||
    snapshot().sessions[sessionId].completedAt
  )
    return;
  change((draft) => {
    evidenceFor(draft, sessionId).selfRead = true;
  });
}

export function updateSettings(settings: Partial<Settings>): void {
  if (settings.fontFamily) setFontPreference(settings.fontFamily);
  change((draft) => {
    draft.settings = { ...draft.settings, ...settings };
  });
}

export function ensureLessonSession(lessonId: string): string | null {
  const lesson = lessonById(lessonId);
  if (!lesson) return null;
  const state = snapshot();
  const activeId = state.lessons[lessonId]?.activeSessionId;
  if (
    activeId &&
    state.sessions[activeId] &&
    !state.sessions[activeId].completedAt
  )
    return activeId;

  const id = crypto.randomUUID();
  change((draft) => {
    draft.sessions[id] = {
      id,
      kind: "math",
      activityId: lessonId,
      title: lesson.title,
      startedAt: new Date().toISOString(),
      completedAt: null,
      xpEarned: 0,
      learned: [],
    };
    draft.lessons[lessonId] = {
      currentStep: 0,
      activeSessionId: id,
      completed: draft.lessons[lessonId]?.completed ?? false,
    };
  });
  return id;
}

export function recordQuizAnswer(
  lessonId: string,
  chunkId: string,
  answerIndex: number,
): void {
  const quiz = lessonById(lessonId)?.chunks.find(
    (chunk) => chunk.id === chunkId,
  )?.quiz;
  if (!quiz || answerIndex < 0 || answerIndex >= quiz.options.length) return;
  const state = snapshot();
  const sessionId = state.lessons[lessonId]?.activeSessionId;
  if (
    !sessionId ||
    !state.sessions[sessionId] ||
    state.sessions[sessionId].completedAt
  )
    return;
  change((draft) => {
    const evidence = evidenceFor(draft, sessionId);
    const previous = evidence.quizzes[chunkId];
    if (previous?.solved) return;
    const correct = answerIndex === quiz.answerIndex;
    evidence.quizzes[chunkId] = {
      attempts: (previous?.attempts ?? 0) + 1,
      incorrect: (previous?.incorrect ?? 0) + (correct ? 0 : 1),
      solved: correct,
      firstTryCorrect: previous ? previous.firstTryCorrect : correct,
    };
    if (correct) award(draft, sessionId, `quiz:${lessonId}:${chunkId}`, 20);
  });
}

// Retained for existing callers; actual UI records the chosen answer.
export function completeQuiz(lessonId: string, chunkId: string): void {
  const quiz = lessonById(lessonId)?.chunks.find(
    (chunk) => chunk.id === chunkId,
  )?.quiz;
  if (quiz) recordQuizAnswer(lessonId, chunkId, quiz.answerIndex);
}

export function advanceLesson(
  lessonId: string,
  chunkId: string,
  nextStep: number,
): void {
  const lesson = lessonById(lessonId);
  const state = snapshot();
  const sessionId = state.lessons[lessonId]?.activeSessionId;
  const chunk = lesson?.chunks.find((item) => item.id === chunkId);
  if (
    !lesson ||
    !chunk ||
    !sessionId ||
    !state.sessions[sessionId] ||
    state.sessions[sessionId].completedAt ||
    (chunk.quiz && !state.evidence[sessionId]?.quizzes[chunkId]?.solved)
  )
    return;
  change((draft) => {
    award(draft, sessionId, `chunk:${lessonId}:${chunkId}`, 10);
    if (!draft.sessions[sessionId].learned.includes(chunk.title))
      draft.sessions[sessionId].learned.push(chunk.title);
    draft.lessons[lessonId].currentStep = Math.min(
      nextStep,
      lesson.chunks.length - 1,
    );
  });
}

export function goToLessonStep(lessonId: string, step: number): void {
  const lesson = lessonById(lessonId);
  const activeId = snapshot().lessons[lessonId]?.activeSessionId;
  if (!lesson || !activeId || step < 0 || step >= lesson.chunks.length) return;
  change((draft) => {
    draft.lessons[lessonId].currentStep = step;
  });
}

export function finishLesson(lessonId: string, chunkId: string): string | null {
  const state = snapshot();
  const sessionId = state.lessons[lessonId]?.activeSessionId;
  if (
    !sessionId ||
    !state.sessions[sessionId] ||
    state.sessions[sessionId].completedAt
  )
    return null;
  const lesson = lessonById(lessonId);
  if (
    !lesson ||
    lesson.chunks.some(
      (chunk) =>
        chunk.quiz && !state.evidence[sessionId]?.quizzes[chunk.id]?.solved,
    )
  )
    return null;
  advanceLesson(lessonId, chunkId, lesson.chunks.length);
  change((draft) => {
    draft.sessions[sessionId].completedAt = new Date().toISOString();
    draft.lessons[lessonId].completed = true;
    draft.lessons[lessonId].activeSessionId = null;
    completeDay(draft);
  });
  return sessionId;
}

export function ensurePracticeSession(
  kind: PracticeKind,
  activityId: string,
  title: string,
): string {
  const state = snapshot();
  const activeId = state.activePractices[kind];
  const active = activeId ? state.sessions[activeId] : null;
  if (active && active.activityId === activityId && !active.completedAt)
    return active.id;

  const id = crypto.randomUUID();
  change((draft) => {
    if (
      activeId &&
      draft.sessions[activeId] &&
      !draft.sessions[activeId].completedAt
    ) {
      const observed = draft.evidence[activeId];
      if (
        !observed ||
        (!observed.hints &&
          !observed.audioPlays &&
          !observed.readingAttempts &&
          !observed.writingScores.length)
      )
        delete draft.sessions[activeId];
    }
    draft.sessions[id] = {
      id,
      kind,
      activityId,
      title,
      startedAt: new Date().toISOString(),
      completedAt: null,
      xpEarned: 0,
      learned: [],
    };
    draft.activePractices[kind] = id;
  });
  return id;
}

export function finishPractice(
  sessionId: string,
  learned: string[],
): string | null {
  const session = snapshot().sessions[sessionId];
  if (!session || session.kind === "math" || session.completedAt) return null;
  const kind: PracticeKind = session.kind;
  if (snapshot().activePractices[kind] !== sessionId) return null;

  change((draft) => {
    const evidence = draft.evidence[sessionId];
    const checked =
      kind === "writing"
        ? (evidence?.writingScores.at(-1) ?? 0) >= 70
        : (evidence?.readingMatches ?? 0) > 0;
    const dailyKey = `practice:${kind}:${session.activityId}:${localDateKey(new Date())}`;
    award(draft, sessionId, `${dailyKey}:effort`, 5);
    if (checked) award(draft, sessionId, `${dailyKey}:achievement`, 10);
    draft.sessions[sessionId].learned = learned;
    draft.sessions[sessionId].completedAt = new Date().toISOString();
    draft.activePractices[kind] = null;
    completeDay(draft);
  });
  return sessionId;
}

export function resetProgress(): void {
  const key = storageKey();
  cache.set(key, structuredClone(initialState));
  storageErrors.delete(key);
  try {
    window.localStorage.removeItem(storageKey());
  } catch {
    /* Memory reset still works. */
  }
  listeners.forEach((listener) => listener());
}
