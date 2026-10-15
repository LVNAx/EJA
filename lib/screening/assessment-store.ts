"use client";
import { useCallback, useSyncExternalStore } from "react";
import { assessmentRecordSchema, type AssessmentRecord } from "./assessment";

const PREFIX = "eja-assessments-v2:";
const cache = new Map<string, AssessmentRecord[]>(),
  listeners = new Set<() => void>();
const EMPTY: AssessmentRecord[] = [];
function snapshot(childId: string) {
  if (!cache.has(childId)) {
    try {
      const raw: unknown = JSON.parse(
        window.localStorage.getItem(PREFIX + childId) ?? "[]",
      );
      cache.set(
        childId,
        Array.isArray(raw)
          ? raw.slice(0, 10).flatMap((value) => {
              const parsed = assessmentRecordSchema.safeParse(value);
              return parsed.success ? [parsed.data] : [];
            })
          : [],
      );
    } catch {
      cache.set(childId, []);
    }
  }
  return cache.get(childId)!;
}
function changed(event: StorageEvent) {
  if (event.key === null) cache.clear();
  else if (event.key.startsWith(PREFIX))
    cache.delete(event.key.slice(PREFIX.length));
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
export function useAssessmentHistory(childId: string) {
  const getSnapshot = useCallback(() => snapshot(childId), [childId]);
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
export function saveLocalAssessment(childId: string, value: AssessmentRecord) {
  const record = assessmentRecordSchema.parse(value);
  const next = [
    record,
    ...snapshot(childId).filter((r) => r.id !== record.id),
  ].slice(0, 10);
  cache.set(childId, next);
  let saved = false;
  try {
    window.localStorage.setItem(PREFIX + childId, JSON.stringify(next));
    saved = true;
  } catch {
    /* The completed session stays visible in memory. */
  }
  listeners.forEach((fn) => fn());
  return saved;
}
export function rememberDemoResult(childId: string, record: AssessmentRecord) {
  try {
    window.sessionStorage.setItem(
      `eja-assessment-result:${childId}`,
      JSON.stringify(record),
    );
    return true;
  } catch {
    return false;
  }
}
