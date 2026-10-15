"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useTestClock() {
  const startedAt = useRef<number | null>(null);
  const invalid = useRef(false);
  const count = useRef(0);
  const [running, setRunning] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const start = useCallback(() => {
    invalid.current = false;
    startedAt.current = performance.now();
    setInterrupted(false);
    setSeconds(0);
    setRunning(true);
  }, []);
  const reset = useCallback(() => {
    startedAt.current = null;
    invalid.current = false;
    count.current = 0;
    setRunning(false);
    setInterrupted(false);
    setSeconds(0);
  }, []);
  const finish = useCallback(() => {
    const ms =
      startedAt.current === null || invalid.current
        ? null
        : Math.max(1, performance.now() - startedAt.current);
    startedAt.current = null;
    setRunning(false);
    return ms !== null && ms <= 600_000 ? ms : null;
  }, []);
  useEffect(() => {
    const hide = () => {
      if (!document.hidden || startedAt.current === null) return;
      startedAt.current = null;
      invalid.current = true;
      count.current++;
      setRunning(false);
      setInterrupted(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      if (startedAt.current !== null)
        setSeconds(Math.floor((performance.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [running]);
  return {
    start,
    finish,
    reset,
    running,
    interrupted,
    seconds,
    interruptions: count,
  };
}
