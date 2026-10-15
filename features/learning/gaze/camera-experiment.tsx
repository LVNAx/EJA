"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cameraMessage } from "./camera-error";
import {
  createCameraTracker,
  type Tracker,
  type TrackerFactory,
} from "./camera-tracker";
import {
  aggregateFeatures,
  assessValidation,
  CALIBRATION_TARGETS,
  fitGazeModel,
  GAZE_LIMITS,
  predictGaze,
  VALIDATION_TARGETS,
  type CalibrationRow,
  type GazeModel,
  type ScreenPoint,
  type Validation,
  type ValidationPoint,
  type Landmark,
} from "./gaze-model";
import { EyeTrackingPreview } from "./eye-tracking-preview";
import {
  AREA_LABELS,
  summarizeReading,
  type GazeSample,
  type ReadingSummary,
  type TrackingMode,
} from "./reading-summary";

type Phase =
  | "idle"
  | "loading"
  | "position"
  | "calibration"
  | "validation"
  | "check-failed"
  | "ready"
  | "reading"
  | "result";
type Capture = {
  at: number;
  features: number[][];
  predictions: ScreenPoint[];
  target: ScreenPoint;
};
const MODAL_PHASES: Phase[] = [
  "calibration",
  "validation",
  "check-failed",
  "ready",
  "reading",
];
const PASSAGE = [
  "Bola Bima berwarna biru.",
  "Bima bermain bola di taman.",
  "Setelah bermain, Bima pulang.",
];

/** Tracker injection permits hardware-independent lifecycle tests; the app uses the real tracker. */
export function CameraExperiment({
  createTracker = createCameraTracker,
  assessmentHref = "/screening/demo",
}: {
  createTracker?: TrackerFactory;
  assessmentHref?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [faceVisible, setFaceVisible] = useState(false);
  const [pointIndex, setPointIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<ReadingSummary | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const tracker = useRef<Tracker | null>(null);
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const capture = useRef<Capture | null>(null);
  const captureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calibration = useRef<CalibrationRow[]>([]);
  const checks = useRef<ValidationPoint[]>([]);
  const model = useRef<GazeModel | null>(null);
  const validation = useRef<Validation | null>(null);
  const viewport = useRef({ width: 0, height: 0 });
  const samples = useRef<GazeSample[]>([]);
  const readingAt = useRef(0);
  const lastFaceAt = useRef(-Infinity);
  const landmarks = useRef<Landmark[]>([]);
  const lastLandmarksAt = useRef(-Infinity);
  const readingMode = useRef<TrackingMode>("eye-tracking");
  const move = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const stopHardware = useCallback(() => {
    generation.current++;
    abort.current?.abort();
    abort.current = null;
    tracker.current?.stop();
    tracker.current = null;
    if (captureTimer.current) clearTimeout(captureTimer.current);
    captureTimer.current = null;
    capture.current = null;
    calibration.current = [];
    checks.current = [];
    model.current = null;
    samples.current = [];
    validation.current = null;
    landmarks.current = [];
    lastLandmarksAt.current = -Infinity;
  }, []);
  const finishReading = useCallback(
    (reason?: string) => {
      if (phaseRef.current !== "reading") return;
      const summary = summarizeReading(
        samples.current,
        performance.now() - readingAt.current,
        validation.current,
        reason,
        readingMode.current,
      );
      move("result");
      stopHardware();
      setResult(summary);
      setCapturing(false);
    },
    [move, stopHardware],
  );
  const cancel = useCallback(() => {
    if (phaseRef.current === "reading")
      finishReading("Pengamatan dihentikan sebelum sesi selesai.");
    else {
      move("idle");
      stopHardware();
      setCapturing(false);
      setMessage(
        "Kamera sudah dihentikan. Kamu boleh mencoba lagi kapan saja.",
      );
    }
  }, [finishReading, move, stopHardware]);

  useEffect(() => () => stopHardware(), [stopHardware]);
  useEffect(() => {
    const onChange = () => {
      const current = phaseRef.current;
      if (current === "idle" || current === "result") return;
      const resized =
        MODAL_PHASES.includes(current) &&
        !(current === "reading" && readingMode.current === "eye-tracking") &&
        (Math.abs(window.innerWidth - viewport.current.width) > 12 ||
          Math.abs(window.innerHeight - viewport.current.height) > 12);
      if (!document.hidden && !resized) return;
      const reason = document.hidden
        ? "Halaman ditinggalkan saat kamera aktif."
        : "Ukuran layar berubah. Kalibrasi perlu diulang.";
      if (current === "reading") finishReading(reason);
      else {
        move("idle");
        stopHardware();
        setCapturing(false);
        setMessage(`${reason} Kamera sudah dimatikan.`);
      }
    };
    document.addEventListener("visibilitychange", onChange);
    window.addEventListener("resize", onChange);
    const onPageHide = () => stopHardware();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [finishReading, move, stopHardware]);
  const modal = MODAL_PHASES.includes(phase);
  useEffect(() => {
    if (modal && !dialog.current?.open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      dialog.current?.showModal();
    }
    if (!modal && dialog.current?.open) {
      dialog.current.close();
      previousFocus.current?.focus();
    }
    if (phase === "result") resultHeading.current?.focus();
  }, [modal, phase]);
  useEffect(() => {
    if (!["position", ...MODAL_PHASES].includes(phase)) return;
    const interval = setInterval(() => {
      if (performance.now() - lastFaceAt.current > 600) setFaceVisible(false);
      if (phaseRef.current === "reading") {
        const elapsed = performance.now() - readingAt.current;
        setSeconds(Math.floor(elapsed / 1000));
        if (elapsed >= GAZE_LIMITS.maxReadingMs) finishReading();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, finishReading]);

  const startCamera = async () => {
    if (!consent || !video.current || phaseRef.current === "loading") return;
    stopHardware();
    setResult(null);
    setMessage("");
    setFaceVisible(false);
    setCapturing(false);
    move("loading");
    const token = generation.current;
    const controller = new AbortController();
    abort.current = controller;
    try {
      const instance = await createTracker(
        video.current,
        (features, at) => {
          if (token !== generation.current) return;
          if (features) lastFaceAt.current = at;
          setFaceVisible(!!features);
          const point =
            features && model.current
              ? predictGaze(model.current, features)
              : null;
          const collecting = capture.current;
          if (
            collecting &&
            at >= collecting.at + GAZE_LIMITS.settlingMs &&
            features
          ) {
            collecting.features.push(features);
            if (point) collecting.predictions.push(point);
          }
          if (phaseRef.current === "reading")
            samples.current.push({
              t: at - readingAt.current,
              point,
              eyesTracked: !!features,
            });
        },
        (error) => {
          if (token !== generation.current) return;
          if (phaseRef.current === "reading")
            finishReading("Kamera terputus saat membaca.");
          else {
            move("idle");
            stopHardware();
            setMessage(cameraMessage(error));
            setCapturing(false);
          }
        },
        controller.signal,
        (points, at) => {
          if (token !== generation.current) return;
          landmarks.current = points;
          lastLandmarksAt.current = at;
        },
      );
      if (token !== generation.current) {
        instance.stop();
        return;
      }
      tracker.current = instance;
      move("position");
    } catch (error) {
      if (token !== generation.current) return;
      move("idle");
      stopHardware();
      setMessage(cameraMessage(error));
    }
  };
  const startCalibration = () => {
    calibration.current = [];
    checks.current = [];
    model.current = null;
    validation.current = null;
    viewport.current = { width: window.innerWidth, height: window.innerHeight };
    setPointIndex(0);
    setMessage("");
    setCapturing(false);
    move("calibration");
  };
  const collectPoint = (button: HTMLButtonElement) => {
    if (capture.current) return;
    const rect = button.getBoundingClientRect();
    const target = {
      x: (rect.x + rect.width / 2) / viewport.current.width,
      y: (rect.y + rect.height / 2) / viewport.current.height,
    };
    const batch: Capture = {
      at: performance.now(),
      features: [],
      predictions: [],
      target,
    };
    capture.current = batch;
    setCapturing(true);
    setMessage("");
    captureTimer.current = setTimeout(() => {
      capture.current = null;
      captureTimer.current = null;
      setCapturing(false);
      const features = aggregateFeatures(batch.features);
      if (!features) {
        setMessage(
          "Mata belum cukup terlihat. Atur cahaya dan posisi, lalu tekan titik yang sama lagi.",
        );
        return;
      }
      if (phaseRef.current === "calibration") {
        calibration.current.push({ features, target });
        if (calibration.current.length < CALIBRATION_TARGETS.length) {
          setPointIndex(calibration.current.length);
          return;
        }
        model.current = fitGazeModel(calibration.current);
        if (!model.current) {
          setMessage(
            "Perubahan posisi mata belum cukup terbaca. Coba atur posisi lalu kalibrasi lagi.",
          );
          move("check-failed");
          return;
        }
        setPointIndex(0);
        move("validation");
      } else if (phaseRef.current === "validation") {
        checks.current.push({ target, predictions: batch.predictions });
        if (checks.current.length < VALIDATION_TARGETS.length) {
          setPointIndex(checks.current.length);
          return;
        }
        validation.current = assessValidation(checks.current, viewport.current);
        move(validation.current.usable ? "ready" : "check-failed");
      }
    }, GAZE_LIMITS.captureMs);
  };
  const startReading = () => {
    if (!tracker.current || !faceVisible) return;
    readingMode.current =
      validation.current?.usable && model.current
        ? "calibrated-gaze"
        : "eye-tracking";
    viewport.current = { width: window.innerWidth, height: window.innerHeight };
    samples.current = [];
    readingAt.current = performance.now();
    setSeconds(0);
    move("reading");
  };
  const currentTarget = (
    phase === "validation" ? VALIDATION_TARGETS : CALIBRATION_TARGETS
  )[pointIndex];
  const cameraActive = phase !== "idle" && phase !== "result";
  return (
    <section className="camera-experiment" aria-label="Eksperimen Pola Membaca">
      {(phase === "idle" || phase === "loading") && (
        <div className="camera-panel">
          <h2>Coba dengan pendamping</h2>
          <ol>
            <li>Duduk nyaman, dengan cahaya di depan wajah.</li>
            <li>Pastikan titik mata dan iris mengikuti matamu di pratinjau.</li>
            <li>
              Langsung baca tiga kalimat. Kalibrasi area layar bersifat pilihan.
            </li>
          </ol>
          <p>
            Kamera diproses di browser ini. Video tidak direkam atau diunggah.
            Model melacak mata dan iris. Peta area layar hanya tersedia jika
            kalibrasi lolos pengecekan. Tidak menilai risiko disleksia.
          </p>
          <label className="camera-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={phase === "loading"}
            />
            Saya sudah mendapat izin orang tua atau pendamping untuk mencoba
            kamera.
          </label>
          <button
            className="progress-button"
            disabled={!consent || phase === "loading"}
            onClick={() => void startCamera()}
          >
            Aktifkan kamera
          </button>
          {phase === "loading" && (
            <>
              <p role="status">
                Menyiapkan kamera dan model pelacakan. Pada pembukaan pertama,
                proses ini bisa memerlukan waktu.
              </p>
              <button className="progress-link" onClick={cancel}>
                Batalkan dan matikan kamera
              </button>
            </>
          )}
        </div>
      )}
      <video
        ref={video}
        muted
        playsInline
        autoPlay
        className="camera-preview"
        aria-label="Pratinjau kamera"
        hidden
      />
      {phase === "position" && (
        <div className="camera-panel">
          <h2>Posisikan wajah di tengah kamera</h2>
          <EyeTrackingPreview
            source={video}
            landmarks={landmarks}
            lastFrame={lastLandmarksAt}
          />
          <p role="status">
            {faceVisible
              ? "Wajah dan mata terlihat. Jaga posisi kepala tetap nyaman."
              : "Wajah atau mata belum terlihat jelas. Hadap ke kamera dan periksa cahaya."}
          </p>
          <div className="camera-actions">
            <button
              className="progress-button"
              disabled={!faceVisible}
              onClick={startReading}
            >
              Mulai membaca
            </button>
            <button
              className="progress-link"
              disabled={!faceVisible}
              onClick={startCalibration}
            >
              Kalibrasi area layar (opsional)
            </button>
            <button className="progress-link" onClick={cancel}>
              Hentikan kamera
            </button>
          </div>
          <p>
            Pelacakan mata bisa langsung digunakan tanpa kalibrasi. Kalibrasi
            hanya untuk mencoba peta perkiraan area layar.
          </p>
        </div>
      )}
      {message && !modal && (
        <p role="status" className="camera-message">
          {message}
        </p>
      )}
      {!cameraActive && <p className="camera-off">Kamera tidak aktif.</p>}

      <dialog
        ref={dialog}
        className="camera-dialog"
        aria-label="Pengamatan pola membaca"
        onCancel={(e) => {
          e.preventDefault();
          cancel();
        }}
      >
        {(phase === "calibration" || phase === "validation") && (
          <div className="camera-calibration">
            <div className="camera-calibration-heading">
              <h2>
                {phase === "calibration" ? "Kalibrasi" : "Pengecekan"} ·{" "}
                {pointIndex + 1}/{phase === "calibration" ? 9 : 5}
              </h2>
              <p>Lihat titiknya, lalu tekan.</p>
            </div>
            <button
              className={`camera-target ${capturing ? "camera-target-busy" : ""}`}
              autoFocus
              style={{
                left: `${currentTarget.x * 100}%`,
                top: `${currentTarget.y * 100}%`,
              }}
              aria-label={`Titik ${phase === "calibration" ? "kalibrasi" : "pengecekan"} ${pointIndex + 1}`}
              aria-disabled={capturing}
              onClick={(e) => collectPoint(e.currentTarget)}
            >
              {pointIndex + 1}
            </button>
            <p className="camera-calibration-status" role="status">
              {capturing
                ? "Tetap lihat titiknya sebentar..."
                : message ||
                  (faceVisible
                    ? "Mata terlihat. Siap mencoba titik ini."
                    : "Mata belum terlihat jelas.")}
            </p>
            <button className="progress-link camera-stop" onClick={cancel}>
              Hentikan kamera
            </button>
          </div>
        )}
        {phase === "check-failed" && (
          <div className="camera-dialog-panel">
            <h2>Peta area layar belum siap</h2>
            <p>
              {message ||
                "Pengecekan kalibrasi belum cukup stabil untuk memperkirakan area pandangan."}
            </p>
            <p>
              Atur cahaya atau posisi duduk, lalu coba lagi. Kamu juga boleh
              melanjutkan membaca dengan pelacakan mata tanpa peta area layar.
            </p>
            <div className="camera-actions">
              <button
                className="progress-button"
                disabled={!faceVisible}
                onClick={startReading}
              >
                Lanjut membaca dengan pelacakan mata
              </button>
              <button
                autoFocus
                className="progress-link"
                onClick={() => {
                  setMessage("");
                  move("position");
                }}
              >
                Atur posisi lagi
              </button>
              <button className="progress-link" onClick={cancel}>
                Hentikan kamera
              </button>
            </div>
          </div>
        )}
        {phase === "ready" && (
          <div className="camera-dialog-panel">
            <h2>Siap membaca?</h2>
            <p>
              Pengecekan cukup untuk mencoba area layar yang besar. Perkiraan
              ini belum dapat menunjukkan kata yang sedang dilihat.
            </p>
            <p>
              Baca tiga kalimat berikut dengan nyaman. Tidak perlu terburu-buru.
              Setelah selesai, tekan Selesai membaca.
            </p>
            <div className="camera-actions">
              <button
                autoFocus
                className="progress-button"
                onClick={startReading}
                disabled={!faceVisible}
              >
                Mulai membaca
              </button>
              <button className="progress-link" onClick={cancel}>
                Hentikan kamera
              </button>
            </div>
          </div>
        )}
        {phase === "reading" && (
          <div className="camera-reading-stage">
            <header>
              <h2>Baca pelan-pelan</h2>
              <span aria-label="Waktu membaca">{seconds} detik</span>
            </header>
            <div className="camera-passage" aria-label="Bacaan pendek">
              {PASSAGE.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <aside
              className="camera-reading-tracker"
              aria-label="Status pelacakan mata"
            >
              <EyeTrackingPreview
                source={video}
                landmarks={landmarks}
                lastFrame={lastLandmarksAt}
              />
              <p>
                {readingMode.current === "calibrated-gaze"
                  ? "Pelacakan mata + perkiraan area layar"
                  : "Pelacakan mata dan iris langsung"}
              </p>
            </aside>
            <div className="camera-reading-controls">
              {seconds < 5 && (
                <p>
                  Ringkasan pelacakan memerlukan sedikitnya 5 detik pengamatan.
                  Baca dengan nyaman; kamu tetap boleh berhenti kapan saja.
                </p>
              )}
              <p role="status">
                {faceVisible
                  ? "Mata dan iris sedang terlacak. Baca dengan nyaman."
                  : "Mata belum terlacak. Kamu tetap boleh melanjutkan membaca."}
              </p>
              <div className="camera-actions">
                <button
                  autoFocus
                  className="progress-button"
                  onClick={() => finishReading()}
                >
                  Selesai membaca
                </button>
                <button className="progress-link" onClick={cancel}>
                  Hentikan kamera
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>

      {phase === "result" && result && (
        <div className="camera-panel camera-results">
          <h2 ref={resultHeading} tabIndex={-1}>
            Catatan kamera
          </h2>
          <p>Kamera tidak menilai jawaban membaca atau risiko disleksia.</p>
          <dl className="camera-metrics">
            <div>
              <dt>Lama sesi</dt>
              <dd>{Math.round(result.durationMs / 1000)} detik</dd>
            </div>
            <div>
              <dt>
                {result.mode === "eye-tracking"
                  ? "Mata terdeteksi"
                  : "Cakupan perkiraan pandangan"}
              </dt>
              <dd>{Math.round(result.coverage * 100)}% waktu</dd>
            </div>
          </dl>
          {!result.usable ? (
            <>
              <ul>
                {result.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p>
                {result.mode === "eye-tracking"
                  ? "Pengamatan belum cukup. Durasi dan keterbacaan mata tetap tercatat."
                  : "Peta layar belum ditampilkan karena data belum cukup baik."}
              </p>
            </>
          ) : result.mode === "eye-tracking" ? (
            <p>
              Persentase di atas menunjukkan berapa lama mata terbaca oleh
              kamera. Peta layar hanya tersedia setelah kalibrasi yang sesuai.
            </p>
          ) : (
            <>
              <h3>Perkiraan area pandangan pada layar</h3>
              <p>
                Warna lebih pekat menunjukkan lebih banyak waktu terpetakan di
                area itu. Area ini bukan posisi kata atau ukuran perhatian anak.
              </p>
              <div className="camera-heatmap" aria-hidden="true">
                {result.areaMs.map((ms, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: `rgba(168,85,247,${0.06 + (0.7 * ms) / Math.max(1, ...result.areaMs)})`,
                    }}
                  >
                    <span>{AREA_LABELS[index]}</span>
                    <strong>{Math.round((ms / result.mappedMs) * 100)}%</strong>
                  </div>
                ))}
              </div>
              <details>
                <summary>Lihat sebaran dalam tabel</summary>
                <table>
                  <caption>Bagian waktu yang dapat dipetakan ke layar</caption>
                  <thead>
                    <tr>
                      <th scope="col">Area layar</th>
                      <th scope="col">Bagian waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.areaMs.map((ms, index) => (
                      <tr key={index}>
                        <th scope="row">{AREA_LABELS[index]}</th>
                        <td>{Math.round((ms / result.mappedMs) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
          <p>
            Untuk mencatat jawaban dan kemampuan anak, lanjutkan ke tes
            kemampuan.
          </p>
          <div className="camera-actions">
            <a className="progress-button" href={assessmentHref}>
              Mulai tes kemampuan
            </a>
            <button
              className="camera-assessment-link"
              onClick={() => {
                setResult(null);
                setMessage("");
                move("idle");
              }}
            >
              Ulangi kamera
            </button>
          </div>
          <small>Catatan kamera hilang saat halaman dimuat ulang.</small>
        </div>
      )}
    </section>
  );
}
