"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  createCameraTracker,
  type Tracker,
  type TrackerFactory,
} from "@/features/learning/gaze/camera-tracker";
import { EyeTrackingPreview } from "@/features/learning/gaze/eye-tracking-preview";
import { cameraMessage } from "@/features/learning/gaze/camera-error";
import type { Landmark } from "@/features/learning/gaze/gaze-model";
import {
  calibrateIrisNoise,
  IrisMotionCollector,
  type IrisMotion,
  type IrisBaseline,
} from "@/features/learning/gaze/iris-motion";
import "@/features/learning/gaze/experiment.css";

export type EyeObservation = {
  observedMs: number;
  trackedMs: number;
  motion?: IrisMotion;
};
export type ReadingTrackerHandle = {
  finish: () => EyeObservation;
  reset: () => void;
};
export const ReadingTracker = forwardRef<
  ReadingTrackerHandle,
  {
    active: boolean;
    onObservation: (stats: EyeObservation) => void;
    onLoading: (loading: boolean) => void;
    autoStart?: boolean;
    createTracker?: TrackerFactory;
    elapsedMs?: () => number;
  }
>(function ReadingTracker(
  {
    active,
    onObservation,
    onLoading,
    autoStart = false,
    createTracker = createCameraTracker,
    elapsedMs,
  },
  ref,
) {
  const [phase, setPhase] = useState<"off" | "loading" | "baseline" | "live">(
    "off",
  );
  const [eyes, setEyes] = useState(false),
    [message, setMessage] = useState("");
  const phaseRef = useRef(phase),
    activeRef = useRef(active);
  activeRef.current = active;
  const video = useRef<HTMLVideoElement>(null),
    points = useRef<Landmark[]>([]),
    lastFrame = useRef(-Infinity);
  const controller = useRef<AbortController | null>(null),
    tracker = useRef<Tracker | null>(null),
    generation = useRef(0);
  const statistics = useRef({ observedMs: 0, trackedMs: 0 });
  const started = useRef<number | null>(null),
    previous = useRef<{ at: number; seen: boolean } | null>(null);
  const baseline = useRef<{ at: number; frames: number[][] } | null>(null),
    motion = useRef<IrisMotionCollector | null>(null);
  const reference = useRef<IrisBaseline | null>(null);
  const callbacks = useRef({ onObservation, onLoading, elapsedMs });
  callbacks.current = { onObservation, onLoading, elapsedMs };
  const snapshot = useCallback(
    () => ({
      ...statistics.current,
      ...(motion.current ? { motion: motion.current.snapshot() } : {}),
    }),
    [],
  );
  const flush = useCallback(() => {
    if (started.current !== null) {
      statistics.current.observedMs += Math.max(
        0,
        performance.now() - started.current,
      );
      started.current = null;
    }
    previous.current = null;
    motion.current?.pause();
    statistics.current.trackedMs = Math.min(
      statistics.current.trackedMs,
      statistics.current.observedMs,
    );
    callbacks.current.onObservation(snapshot());
  }, [snapshot]);
  const release = useCallback(() => {
    flush();
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    tracker.current?.stop();
    tracker.current = null;
    points.current = [];
    lastFrame.current = -Infinity;
    baseline.current = null;
  }, [flush]);
  const stop = useCallback(() => {
    release();
    phaseRef.current = "off";
    setPhase("off");
    setEyes(false);
    callbacks.current.onLoading(false);
  }, [release]);
  useImperativeHandle(
    ref,
    () => ({
      finish: () => {
        stop();
        return snapshot();
      },
      reset: () => {
        flush();
        statistics.current = { observedMs: 0, trackedMs: 0 };
        motion.current = reference.current
          ? new IrisMotionCollector(reference.current)
          : null;
        callbacks.current.onObservation(snapshot());
      },
    }),
    [stop, snapshot, flush],
  );
  useEffect(
    () => () => {
      release();
      phaseRef.current = "off";
    },
    [release],
  );
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
  useEffect(() => {
    if (phase !== "baseline") return;
    const timer = setTimeout(() => {
      baseline.current = null;
      phaseRef.current = "live";
      setPhase("live");
      callbacks.current.onLoading(false);
      setMessage(
        "Referensi diam belum cukup. Jawaban tetap bisa dikerjakan; perubahan iris belum akan dinilai.",
      );
    }, 10_000);
    return () => clearTimeout(timer);
  }, [phase]);
  const start = useCallback(async () => {
    if (!video.current || phaseRef.current !== "off") return;
    release();
    setMessage("");
    motion.current = null;
    reference.current = null;
    phaseRef.current = "loading";
    setPhase("loading");
    callbacks.current.onLoading(true);
    const token = generation.current,
      abort = new AbortController();
    controller.current = abort;
    try {
      const instance = await createTracker(
        video.current,
        (features, at) => {
          if (token !== generation.current) return;
          setEyes(!!features);
          if (phaseRef.current === "baseline") {
            if (!features) {
              baseline.current = null;
              return;
            }
            baseline.current ??= { at, frames: [] };
            baseline.current.frames.push(features);
            if (at - baseline.current.at >= 2000) {
              reference.current = calibrateIrisNoise(baseline.current.frames);
              motion.current = reference.current
                ? new IrisMotionCollector(reference.current)
                : null;
              baseline.current = null;
              phaseRef.current = "live";
              setPhase("live");
              callbacks.current.onLoading(false);
              if (!reference.current)
                setMessage(
                  "Referensi iris belum stabil. Jawaban tetap bisa dinilai.",
                );
            }
            return;
          }
          if (started.current !== null && activeRef.current) {
            const prev = previous.current;
            if (prev && prev.seen && features)
              statistics.current.trackedMs += Math.min(
                250,
                Math.max(0, at - prev.at),
              );
            previous.current = { at, seen: !!features };
            motion.current?.push(
              features,
              at,
              callbacks.current.elapsedMs?.() ??
                statistics.current.observedMs +
                  Math.max(0, at - started.current),
            );
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
      phaseRef.current = "baseline";
      setPhase("baseline");
    } catch (error) {
      if (token === generation.current) {
        stop();
        setMessage(cameraMessage(error));
      }
    }
  }, [createTracker, release, stop]);
  useEffect(() => {
    if (autoStart) void start();
  }, [autoStart, start]);
  return (
    <div className="assessment-camera">
      <video ref={video} hidden muted playsInline autoPlay />
      <div>
        <span>
          {phase === "live"
            ? eyes
              ? "Mata terdeteksi"
              : "Mata belum terlihat"
            : phase === "baseline"
              ? "Menyiapkan referensi iris"
              : "Kamera membaca"}
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
      {phase === "loading" && (
        <p role="status">Menyiapkan kamera dan pelacak iris…</p>
      )}
      {phase === "baseline" && (
        <div className="assessment-iris-reference">
          <span aria-hidden="true">●</span>
          <p role="status">
            Lihat titik ini selama 2 detik. Jaga kepala tetap nyaman. Waktu tes
            belum berjalan.
          </p>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {(phase === "live" || phase === "baseline") && (
        <details>
          <summary>Lihat titik mata</summary>
          <EyeTrackingPreview
            source={video}
            landmarks={points}
            lastFrame={lastFrame}
          />
          <p>
            Perubahan iris dicatat hanya saat teks dan pertanyaan berwaktu
            tampil. Video tidak direkam.
          </p>
        </details>
      )}
    </div>
  );
});
