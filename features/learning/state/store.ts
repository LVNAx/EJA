"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { lessonById } from "../math/content";
import { awardOnce, localDateKey, nextStreak } from "./progress";

const settingsSchema = z.object({
  textSize: z.enum(["normal", "large"]),
  fontFamily: z.enum(["standard", "opendyslexic"]).default("standard"),
  audioRate: z.number().min(0.7).max(1.1),
  rewardSound: z.boolean(),
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

const stateSchema = z.object({
  version: z.literal(2),
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

function storageKey(): string {
  if (typeof window === "undefined") return `${STORAGE_PREFIX}server`;
  const childId = /^\/child\/([^/]+)(?:\/|$)/.exec(
    window.location.pathname,
  )?.[1];
  return `${STORAGE_PREFIX}${childId ?? "demo"}`;
}

export const initialState: AppState = {
  version: 2,
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
  },
  badges: [],
};

let current: AppState | null = null;
let currentKey: string | null = null;
const listeners = new Set<() => void>();

function migrate(raw: unknown): AppState {
  const parsed = stateSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

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
  return {
    ...old,
    version: 2,
    activePractices: { reading: null, writing: null },
    sessions,
  };
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

function snapshot(): AppState {
  const key = storageKey();
  if (!current || currentKey !== key) {
    current = load(key);
    currentKey = key;
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: AppState): void {
  current = next;
  currentKey = storageKey();
  try {
    window.localStorage.setItem(currentKey, JSON.stringify(next));
  } catch {
    // Keep the current session usable when browser storage is unavailable.
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

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, snapshot, () => initialState);
}

export function updateSettings(settings: Partial<Settings>): void {
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
      completed: false,
    };
  });
  return id;
}

export function completeQuiz(lessonId: string, chunkId: string): void {
  const state = snapshot();
  const sessionId = state.lessons[lessonId]?.activeSessionId;
  if (
    !sessionId ||
    !state.sessions[sessionId] ||
    state.sessions[sessionId].completedAt
  )
    return;
  change((draft) => award(draft, sessionId, `quiz:${lessonId}:${chunkId}`, 20));
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
    state.sessions[sessionId].completedAt
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
  advanceLesson(lessonId, chunkId, lessonById(lessonId)?.chunks.length ?? 1);
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
    award(draft, sessionId, `practice:${sessionId}:${session.activityId}`, 15);
    draft.sessions[sessionId].learned = learned;
    draft.sessions[sessionId].completedAt = new Date().toISOString();
    draft.activePractices[kind] = null;
    completeDay(draft);
  });
  return sessionId;
}

export function resetProgress(): void {
  current = initialState;
  try {
    window.localStorage.removeItem(storageKey());
  } catch {
    /* Memory reset still works. */
  }
  listeners.forEach((listener) => listener());
}
