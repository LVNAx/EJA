"use client";
import { useCallback, useSyncExternalStore } from "react";
import { readingStudySchema, type ReadingStudy } from "./reading-study";

const PREFIX = "eja-reading-studies-v1:";
const cache = new Map<string, ReadingStudy[]>(),
  listeners = new Set<() => void>();
const EMPTY: ReadingStudy[] = [];
function snapshot(childId: string) {
  if (!cache.has(childId)) {
    try {
      const raw: unknown = JSON.parse(
        window.localStorage.getItem(PREFIX + childId) ?? "[]",
      );
      cache.set(
        childId,
        Array.isArray(raw)
          ? raw.slice(0, 10).flatMap((v) => {
              const p = readingStudySchema.safeParse(v);
              return p.success ? [p.data] : [];
            })
          : [],
      );
    } catch {
      cache.set(childId, []);
    }
  }
  return cache.get(childId)!;
}
function changed(e: StorageEvent) {
  if (e.key === null) cache.clear();
  else if (e.key.startsWith(PREFIX)) cache.delete(e.key.slice(PREFIX.length));
  else return;
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  if (!listeners.size) window.addEventListener("storage", changed);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (!listeners.size) window.removeEventListener("storage", changed);
  };
}
export function useReadingStudies(childId: string) {
  const getSnapshot = useCallback(() => snapshot(childId), [childId]);
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
export function saveReadingStudy(childId: string, value: ReadingStudy) {
  const record = readingStudySchema.parse(value);
  const records = [
    record,
    ...snapshot(childId).filter((r) => r.id !== record.id),
  ]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 10);
  cache.set(childId, records);
  let saved = false;
  try {
    window.localStorage.setItem(PREFIX + childId, JSON.stringify(records));
    saved = true;
  } catch {
    /* Memory remains available for this page. */
  }
  listeners.forEach((fn) => fn());
  return saved;
}
