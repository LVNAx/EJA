"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCameraTracker,
  type Tracker,
  type TrackerFactory,
} from "./camera-tracker";
import { cameraMessage } from "./camera-error";
import type { Landmark } from "./gaze-model";
import {
  drawEye,
  drawLandmarks,
  type LandmarkOptions,
} from "./landmark-visuals";

type Phase = "idle" | "loading" | "live";
const EMPTY = { points: 0, eyes: false };

export function FaceLandmarkDemo({
  createTracker = createCameraTracker,
}: {
  createTracker?: TrackerFactory;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [metrics, setMetrics] = useState(EMPTY);
  const [ratio, setRatio] = useState("4 / 3");
  const [options, setOptions] = useState<LandmarkOptions>({
    contour: true,
    eyes: true,
    points: false,
  });
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const leftEye = useRef<HTMLCanvasElement>(null);
  const rightEye = useRef<HTMLCanvasElement>(null);
  const cameraView = useRef<HTMLElement>(null);
  const instance = useRef<Tracker | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const points = useRef<Landmark[]>([]);
  const eyes = useRef(false);
  const lastFrame = useRef(-Infinity);
  const displayOptions = useRef(options);

  const paint = useCallback(() => {
    const source = video.current;
    if (!source || !overlay.current) return;
    drawLandmarks(
      overlay.current,
      points.current,
      source.videoWidth || 640,
      source.videoHeight || 480,
      displayOptions.current,
    );
    for (const [side, ref] of [
      ["left", leftEye],
      ["right", rightEye],
    ] as const) {
      if (ref.current)
        drawEye(
          ref.current,
          source,
          points.current,
          side,
          displayOptions.current.eyes,
        );
    }
  }, []);
  const release = useCallback(() => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    instance.current?.stop();
    instance.current = null;
    points.current = [];
    eyes.current = false;
    lastFrame.current = -Infinity;
    paint();
  }, [paint]);
  const stop = useCallback(
    (text = "Kamera sudah dimatikan.") => {
      release();
      setPhase("idle");
      setMetrics(EMPTY);
      setMessage(text);
    },
    [release],
  );

  useEffect(() => () => release(), [release]);
  useEffect(() => {
    if (phase === "live" && window.matchMedia("(max-width: 900px)").matches)
      cameraView.current?.scrollIntoView({ block: "start" });
  }, [phase]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && (controller.current || instance.current))
        stop(
          "Kamera dimatikan karena halaman ditinggalkan. Tekan Aktifkan kamera untuk mencoba lagi.",
        );
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", release);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", release);
    };
  }, [release, stop]);
  useEffect(() => {
    displayOptions.current = options;
    paint();
  }, [options, paint]);
  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => {
      const now = performance.now();
      if (now - lastFrame.current > 1000) {
        points.current = [];
        eyes.current = false;
        paint();
      }
      setMetrics({ points: points.current.length, eyes: eyes.current });
    }, 500);
    return () => clearInterval(timer);
  }, [phase, paint]);

  const start = async () => {
    if (!consent || !video.current || phase !== "idle") return;
    release();
    setMetrics(EMPTY);
    setMessage("");
    setPhase("loading");
    const token = generation.current;
    const abort = new AbortController();
    controller.current = abort;
    try {
      const tracker = await createTracker(
        video.current,
        (features) => {
          if (token === generation.current) eyes.current = !!features;
        },
        (error) => {
          if (token === generation.current) stop(cameraMessage(error));
        },
        abort.signal,
        (landmarks, at) => {
          if (token !== generation.current) return;
          points.current = landmarks;
          lastFrame.current = at;
          paint();
        },
      );
      if (token !== generation.current) {
        tracker.stop();
        return;
      }
      instance.current = tracker;
      setRatio(
        `${video.current!.videoWidth || 640} / ${video.current!.videoHeight || 480}`,
      );
      setPhase("live");
    } catch (error) {
      if (token === generation.current) stop(cameraMessage(error));
    }
  };
  const faceVisible = phase === "live" && metrics.points > 0;
  const toggle = (key: keyof LandmarkOptions) =>
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }));
  return (
    <div className="face-demo-content">
      <section className="face-demo-card face-demo-start">
        <h2>Mulai demo</h2>
        <p>
          Duduk di depan kamera. Gerakkan kepala atau kedipkan mata untuk
          melihat titik mengikuti wajah.
        </p>
        <label className="face-demo-consent">
          <input
            type="checkbox"
            checked={consent}
            disabled={phase !== "idle"}
            onChange={(e) => setConsent(e.target.checked)}
          />
          Saya sudah mendapat izin orang tua atau pendamping untuk mencoba
          kamera.
        </label>
        <div className="face-demo-actions">
          <button
            className="progress-button"
            disabled={!consent || phase !== "idle"}
            onClick={() => void start()}
          >
            Aktifkan kamera
          </button>
          {phase !== "idle" && (
            <button className="face-demo-stop" onClick={() => stop()}>
              Hentikan kamera
            </button>
          )}
        </div>
        {phase === "loading" && (
          <p role="status">
            Model dimuat saat pertama diaktifkan. Kamu boleh membatalkan kapan
            saja.
          </p>
        )}
        {message && (
          <p className="face-demo-message" role="status">
            {message}
          </p>
        )}
        <p className="face-demo-small">
          Video diproses di perangkat ini. Tidak direkam, disimpan, atau
          diunggah.
        </p>
      </section>
      <div className="face-demo-layout">
        <section ref={cameraView} className="face-demo-view" aria-labelledby="camera-view-title">
          <div className="face-demo-view-heading">
            <h2 id="camera-view-title">Kamera langsung</h2>
            {phase !== "idle" && (
              <button className="face-demo-stop" onClick={() => stop()}>
                Matikan kamera
              </button>
            )}
            <span
              className={`face-demo-badge ${phase === "live" ? "is-live" : ""}`}
            >
              {phase === "loading"
                ? "Menyiapkan"
                : phase === "live"
                  ? "Kamera aktif"
                  : "Kamera mati"}
            </span>
          </div>
          <div className="face-demo-screen" style={{ aspectRatio: ratio }}>
            <video
              ref={video}
              autoPlay
              muted
              playsInline
              aria-label="Pratinjau kamera langsung"
              onResize={() => {
                if (video.current?.videoWidth)
                  setRatio(
                    `${video.current.videoWidth} / ${video.current.videoHeight}`,
                  );
              }}
            />
            <canvas
              ref={overlay}
              className="face-demo-overlay"
              aria-hidden="true"
            />
            {phase !== "live" && (
              <div className="face-demo-placeholder">
                <span aria-hidden="true">◎</span>
                <p>
                  {phase === "loading"
                    ? "Menyiapkan kamera dan model..."
                    : "Aktifkan kamera untuk melihat titik wajah dan mata."}
                </p>
              </div>
            )}
            {phase === "live" && !faceVisible && (
              <p className="face-demo-hint">
                Hadapkan wajah ke kamera dan pastikan cahaya cukup.
              </p>
            )}
          </div>
          <p className="face-demo-status" role="status">
            {phase !== "live"
              ? "Pratinjau belum aktif."
              : faceVisible
                ? `Wajah terdeteksi · ${metrics.points} titik model · ${metrics.eyes ? "Mata terbaca" : "Mata belum terbaca jelas"}`
                : "Wajah belum terdeteksi."}
          </p>
          <div className="face-demo-eye-grid">
            {(
              [
                ["left", "Mata kiri", leftEye],
                ["right", "Mata kanan", rightEye],
              ] as const
            ).map(([side, label, ref]) => (
              <figure key={side}>
                <figcaption>{label}</figcaption>
                <div className="face-demo-eye">
                  <canvas
                    ref={ref}
                    width={300}
                    height={180}
                    aria-hidden="true"
                  />
                  {!faceVisible && <span>Mata belum terlihat</span>}
                </div>
              </figure>
            ))}
          </div>
          <p className="face-demo-small">
            Tampilan dicerminkan seperti cermin. Label kiri dan kanan mengikuti
            sisi tubuh pengguna.
          </p>
        </section>

        <aside
          className="face-demo-controls"
          aria-label="Kontrol dan penjelasan demo"
        >
          <fieldset className="face-demo-card">
            <legend>Tampilkan penanda</legend>
            <label>
              <input
                type="checkbox"
                checked={options.contour}
                onChange={() => toggle("contour")}
              />
              Kontur wajah
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.eyes}
                onChange={() => toggle("eyes")}
              />
              Titik mata dan iris
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.points}
                onChange={() => toggle("points")}
              />
              Semua titik wajah
            </label>
          </fieldset>
          <section className="face-demo-card">
            <h2>Arti penandanya</h2>
            <ul className="face-demo-legend">
              <li>
                <span style={{ background: "#d8b4fe" }} />
                Ungu: kontur wajah.
              </li>
              <li>
                <span style={{ background: "#ffd166" }} />
                Kuning: garis kelopak mata.
              </li>
              <li>
                <span style={{ background: "#5eead4" }} />
                Hijau: iris dan titik tengahnya.
              </li>
            </ul>
            <p className="face-demo-small">
              Pembesaran mata menampilkan detail penanda dari frame yang sama.
            </p>
            <p className="face-demo-small">
              Demo ini memperlihatkan deteksi titik. Titik iris belum
              menunjukkan kata atau posisi layar yang sedang dilihat, dan tidak
              menilai kondisi anak.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
