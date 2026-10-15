"use client";

import { useSyncExternalStore } from "react";

export type FontPreference = "standard" | "opendyslexic";
const STORAGE_KEY = "eja-font-preference";
const listeners = new Set<() => void>();
let preference: FontPreference | undefined;

function readPreference(): FontPreference {
  if (preference) return preference;
  try {
    preference =
      window.localStorage.getItem(STORAGE_KEY) === "opendyslexic"
        ? "opendyslexic"
        : "standard";
  } catch {
    preference = "standard";
  }
  return preference;
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  preference = undefined;
  document.documentElement.dataset.readingFont = readPreference();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

export function setFontPreference(value: FontPreference) {
  preference = value;
  document.documentElement.dataset.readingFont = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The choice still works for this visit when browser storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function useFontPreference() {
  return useSyncExternalStore(
    subscribe,
    readPreference,
    () => "standard" as const,
  );
}
