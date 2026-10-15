"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadingSession } from "@/lib/screening/reading-session";
export function useReadingWindow(
  onExpire: () => void,
  onInterrupt: () => void,
) {
  const callbacks = useRef({ onExpire, onInterrupt });
  callbacks.current = { onExpire, onInterrupt };
  const started = useRef<number | null>(null),
    used = useRef(0),
    extension = useRef(0),
    interruptions = useRef(0);
  const [remaining, setRemaining] = useState(60),
    [status, setStatus] = useState<
      "ready" | "running" | "expired" | "interrupted" | "completed"
    >("ready");
  const elapsed = useCallback(
    () =>
      Math.min(
        60_000 + extension.current,
        used.current +
          (started.current === null
            ? 0
            : Math.max(0, performance.now() - started.current)),
      ),
    [],
  );
  const pause = useCallback(() => {
    used.current = elapsed();
    started.current = null;
  }, [elapsed]);
  const start = useCallback(() => {
    used.current = 0;
    extension.current = 0;
    started.current = performance.now();
    setRemaining(60);
    setStatus("running");
  }, []);
  const addTime = useCallback(() => {
    if (extension.current >= 90_000) return;
    extension.current += 30_000;
    if (started.current === null) {
      started.current = performance.now();
      setStatus("running");
    }
    setRemaining(Math.ceil((60_000 + extension.current - elapsed()) / 1000));
  }, [elapsed]);
  const finish = useCallback(() => {
    pause();
    setStatus("completed");
  }, [pause]);
  const snapshot = useCallback(
    (
      end: ReadingSession["status"],
      experience: ReadingSession["experience"] = "unanswered",
    ): ReadingSession => ({
      limitMs: 60000,
      extensionMs: extension.current,
      elapsedMs: elapsed(),
      status: end,
      interruptions: interruptions.current,
      experience,
      responseTimes: [],
    }),
    [elapsed],
  );
  useEffect(() => {
    if (status !== "running") return;
    const timer = setInterval(() => {
      const left = 60_000 + extension.current - elapsed();
      setRemaining(Math.ceil(left / 1000));
      if (left <= 0 && started.current !== null) {
        pause();
        setStatus("expired");
        callbacks.current.onExpire();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [status, elapsed, pause]);
  useEffect(() => {
    const hidden = () => {
      if (started.current === null) return;
      if (document.hidden) {
        pause();
        interruptions.current++;
        setStatus("interrupted");
        callbacks.current.onInterrupt();
      }
    };
    const leaving = () => {
      if (started.current !== null) {
        pause();
        interruptions.current++;
        setStatus("interrupted");
        callbacks.current.onInterrupt();
      }
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leaving);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leaving);
    };
  }, [pause]);
  return {
    remaining,
    status,
    start,
    addTime,
    finish,
    snapshot,
    elapsed,
    canExtend: extension.current < 90_000,
  };
}
