"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCameraTracker,
  type Tracker,
} from "@/features/learning/gaze/camera-tracker";
import { EyeTrackingPreview } from "@/features/learning/gaze/eye-tracking-preview";
import { cameraMessage } from "@/features/learning/gaze/camera-error";
import type { Landmark } from "@/features/learning/gaze/gaze-model";
import "@/features/learning/gaze/experiment.css";

export type EyeObservation = { observedMs: number; trackedMs: number };
export function ReadingTracker({
  active,
  onObservation,
  onLoading,
}: {
  active: boolean;
  onObservation: (stats: EyeObservation) => void;
  onLoading: (loading: boolean) => void;
}) {
  const [phase, setPhase] = useState<"off" | "loading" | "live">("off"),
    [eyes, setEyes] = useState(false),
    [message, setMessage] = useState("");
  const video = useRef<HTMLVideoElement>(null),
    points = useRef<Landmark[]>([]),
    lastFrame = useRef(-Infinity);
  const controller = useRef<AbortController | null>(null),
    tracker = useRef<Tracker | null>(null),
    generation = useRef(0);
  const statistics = useRef({ observedMs: 0, trackedMs: 0 });
  const started = useRef<number | null>(null),
    previous = useRef<number | null>(null);
  const callbacks = useRef({ onObservation, onLoading });
  callbacks.current = { onObservation, onLoading };
  const flush = useCallback(() => {
    if (started.current !== null) {
      statistics.current.observedMs += Math.max(
        0,
        performance.now() - started.current,
      );
      started.current = null;
    }
    previous.current = null;
    callbacks.current.onObservation({
      ...statistics.current,
      trackedMs: Math.min(
        statistics.current.trackedMs,
        statistics.current.observedMs,
      ),
    });
  }, []);
  const release = useCallback(() => {
    flush();
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    tracker.current?.stop();
    tracker.current = null;
    points.current = [];
    lastFrame.current = -Infinity;
  }, [flush]);
  const stop = useCallback(() => {
    release();
    setPhase("off");
    setEyes(false);
    callbacks.current.onLoading(false);
  }, [release]);
  useEffect(() => () => release(), [release]);
  useEffect(() => {
    if (active && phase === "live") {
      started.current = performance.now();
      previous.current = null;
    } else flush();
    return flush;
  }, [active, phase, flush]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
    };
  }, [stop]);
  const start = async () => {
    if (!video.current || phase !== "off") return;
    release();
    setMessage("");
    setPhase("loading");
    callbacks.current.onLoading(true);
    const token = generation.current,
      abort = new AbortController();
    controller.current = abort;
    try {
      const instance = await createCameraTracker(
        video.current,
        (features, at) => {
          if (token !== generation.current) return;
          setEyes(!!features);
          if (started.current !== null) {
            if (previous.current !== null && features)
              statistics.current.trackedMs += Math.min(
                250,
                Math.max(0, at - previous.current),
              );
            previous.current = at;
          }
        },
        (error) => {
          if (token === generation.current) {
            stop();
            setMessage(cameraMessage(error));
          }
        },
        abort.signal,
        (landmarks, at) => {
          if (token === generation.current) {
            points.current = landmarks;
            lastFrame.current = at;
          }
        },
      );
      if (token !== generation.current) {
        instance.stop();
        return;
      }
      tracker.current = instance;
      setPhase("live");
      callbacks.current.onLoading(false);
    } catch (error) {
      if (token === generation.current) {
        stop();
        setMessage(cameraMessage(error));
      }
    }
  };
  return (
    <div className="assessment-camera">
      <video ref={video} hidden muted playsInline autoPlay />
      <div>
        <span>
          {phase === "live"
            ? eyes
              ? "Mata terdeteksi"
              : "Mata belum terlihat"
            : "Tracking mata · opsional"}
        </span>
        {phase === "off" ? (
          <button
            disabled={active}
            className="assessment-skip"
            onClick={() => void start()}
          >
            Aktifkan kamera
          </button>
        ) : (
          <button className="assessment-skip" onClick={stop}>
            {phase === "loading" ? "Batalkan kamera" : "Matikan kamera"}
          </button>
        )}
      </div>
      {phase === "loading" && <p role="status">Menyiapkan kamera…</p>}
      {message && <p role="status">{message}</p>}
      {phase === "live" && (
        <details>
          <summary>Lihat titik mata</summary>
          <EyeTrackingPreview
            source={video}
            landmarks={points}
            lastFrame={lastFrame}
          />
          <p>Kamera mencatat keterbacaan mata, bukan skor kemampuan.</p>
        </details>
      )}
    </div>
  );
}
