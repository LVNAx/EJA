"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  createCameraTracker,
  type Tracker,
  type TrackerFactory,
} from "./camera-tracker";
import {
  aggregateFeatures,
  CALIBRATION_TARGETS,
  fitGazeModel,
  GAZE_LIMITS,
  predictGaze,
  type CalibrationRow,
  type GazeModel,
  type Landmark,
  type ScreenPoint,
  type ValidationPoint,
} from "./gaze-model";
import type { GazeSample } from "./reading-summary";
import { cameraMessage } from "./camera-error";
import { EyeTrackingPreview } from "./eye-tracking-preview";
import {
  analyzeReadingRegions,
  readingStudySchema,
  STUDY_PASSAGES,
  studyRoundResult,
  validateReadingRegions,
  type ReadingRegion,
  type ReadingStudy,
  type RegionValidation,
  type StudyObservation,
  type StudyRound,
} from "./reading-study";
import { saveReadingStudy, useReadingStudies } from "./study-store";
import { ReadingStudyReport } from "./reading-study-report";
import "./reading-study.css";

type Phase =
  | "idle"
  | "loading"
  | "position"
  | "calibration"
  | "check"
  | "ready"
  | "reading"
  | "questions"
  | "review"
  | "between"
  | "result"
  | "interrupted";
const MODAL: Phase[] = [
  "calibration",
  "check",
  "ready",
  "reading",
  "questions",
  "review",
  "between",
];
type Capture = {
  at: number;
  target: ScreenPoint;
  features: number[][];
  predictions: ScreenPoint[];
};
export function ReadingStudyFlow({
  childId,
  guidedPractice = false,
  createTracker = createCameraTracker,
}: {
  childId: string;
  guidedPractice?: boolean;
  createTracker?: TrackerFactory;
}) {
  const history = useReadingStudies(childId);
  const [phase, setPhase] = useState<Phase>("idle"),
    phaseRef = useRef<Phase>("idle");
  const [consent, setConsent] = useState(false),
    [face, setFace] = useState(false),
    [message, setMessage] = useState("");
  const [roundIndex, setRoundIndex] = useState(guidedPractice ? 1 : 0),
    [pointIndex, setPointIndex] = useState(0),
    [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState(0),
    [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  const [oral, setOral] = useState<StudyRound["oral"]>([
      "unassessed",
      "unassessed",
      "unassessed",
    ]),
    [assisted, setAssisted] = useState(false);
  const [activeLine, setActiveLine] = useState(0),
    [seconds, setSeconds] = useState(0);
  const [report, setReport] = useState<ReadingStudy | null>(null),
    [persisted, setPersisted] = useState(true);
  const video = useRef<HTMLVideoElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const lineElements = useRef<(HTMLParagraphElement | null)[]>([]),
    previousFocus = useRef<HTMLElement | null>(null);
  const tracker = useRef<Tracker | null>(null),
    controller = useRef<AbortController | null>(null),
    generation = useRef(0);
  const landmarks = useRef<Landmark[]>([]),
    lastFrame = useRef(-Infinity),
    lastFace = useRef(-Infinity);
  const capture = useRef<Capture | null>(null),
    captureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calibration = useRef<CalibrationRow[]>([]),
    checks = useRef<ValidationPoint[]>([]),
    model = useRef<GazeModel | null>(null);
  const validation = useRef<RegionValidation | null>(null),
    regions = useRef<ReadingRegion[]>([]);
  const viewport = useRef({ width: 0, height: 0 }),
    samples = useRef<GazeSample[]>([]),
    readingAt = useRef(0);
  const observation = useRef<StudyObservation | null>(null),
    rounds = useRef<StudyRound[]>([]),
    reviewed = useRef(false);
  const passage = STUDY_PASSAGES[roundIndex];
  const move = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const release = useCallback(() => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    tracker.current?.stop();
    tracker.current = null;
    if (captureTimer.current) clearTimeout(captureTimer.current);
    captureTimer.current = null;
    capture.current = null;
    landmarks.current = [];
    lastFrame.current = -Infinity;
  }, []);
  const invalidate = useCallback(() => {
    model.current = null;
    validation.current = null;
    checks.current = [];
    calibration.current = [];
    samples.current = [];
  }, []);
  const interrupt = useCallback(
    (reason: string) => {
      release();
      invalidate();
      setFace(false);
      setBusy(false);
      setMessage(reason);
      const p = phaseRef.current;
      if (
        p === "reading" ||
        p === "calibration" ||
        p === "check" ||
        p === "loading" ||
        p === "position" ||
        p === "ready"
      )
        move("interrupted");
    },
    [release, invalidate, move],
  );
  useEffect(
    () => () => {
      release();
      invalidate();
    },
    [release, invalidate],
  );
  const modal = MODAL.includes(phase);
  useEffect(() => {
    if (modal && !dialog.current?.open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      dialog.current?.showModal();
    }
    if (!modal && dialog.current?.open) {
      dialog.current.close();
      previousFocus.current?.focus();
    }
    if (phase === "result" || phase === "interrupted") heading.current?.focus();
    if (["questions", "review", "ready", "between"].includes(phase))
      dialog.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [modal, phase, question]);
  useEffect(() => {
    if (phase === "calibration" || phase === "check")
      dialog.current
        ?.querySelector<HTMLButtonElement>('button[aria-label^="Titik"]')
        ?.focus({ preventScroll: true });
  }, [phase, pointIndex]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && tracker.current)
        interrupt(
          "Halaman ditinggalkan. Kamera dihentikan; bacaan yang sedang berjalan perlu diulang.",
        );
      else if (document.hidden && phaseRef.current === "reading")
        interrupt(
          "Bacaan terputus karena halaman ditinggalkan. Ulangi bacaan ini.",
        );
    };
    const resize = () => {
      if (
        MODAL.includes(phaseRef.current) &&
        (Math.abs(innerWidth - viewport.current.width) > 12 ||
          Math.abs(innerHeight - viewport.current.height) > 12)
      )
        interrupt(
          "Ukuran layar berubah. Pemetaan perlu diulang agar posisi bacaan sesuai.",
        );
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("resize", resize);
    const pageHide = () => {
      if (phaseRef.current !== "idle" && phaseRef.current !== "result")
        interrupt(
          "Halaman ditutup atau ditinggalkan. Bacaan aktif perlu diulang.",
        );
      else release();
    };
    window.addEventListener("pagehide", pageHide);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pagehide", pageHide);
    };
  }, [interrupt, release]);
  const readRegions = () =>
    lineElements.current.map((el) => {
      const r = el!.getBoundingClientRect();
      return {
        x: r.x / innerWidth,
        y: r.y / innerHeight,
        width: r.width / innerWidth,
        height: r.height / innerHeight,
      };
    });
  useLayoutEffect(() => {
    if (
      (phase === "check" || phase === "reading") &&
      lineElements.current.filter(Boolean).length === 3
    ) {
      const measured = readRegions();
      if (
        phase === "reading" &&
        validation.current?.usable &&
        measured.some(
          (r, i) =>
            Math.abs(r.y - regions.current[i].y) > 0.005 ||
            Math.abs(r.height - regions.current[i].height) > 0.005 ||
            Math.abs(r.x - regions.current[i].x) > 0.005 ||
            Math.abs(r.width - regions.current[i].width) > 0.005,
        )
      )
        validation.current = null;
      if (
        lineElements.current.some(
          (el) => el && el.scrollHeight > el.clientHeight + 2,
        )
      )
        validation.current = null;
      regions.current = measured;
    }
  }, [phase, roundIndex]);
  const finishReading = useCallback(() => {
    if (phaseRef.current !== "reading") return;
    observation.current = analyzeReadingRegions(
      samples.current,
      performance.now() - readingAt.current,
      regions.current,
      validation.current,
    );
    samples.current = [];
    setQuestion(0);
    setAnswers([null, null]);
    move("questions");
  }, [move]);
  useEffect(() => {
    if (!["position", ...MODAL].includes(phase)) return;
    const timer = setInterval(() => {
      if (performance.now() - lastFace.current > 600) setFace(false);
      if (phaseRef.current === "reading") {
        const elapsed = performance.now() - readingAt.current;
        setSeconds(Math.floor(elapsed / 1000));
        if (elapsed >= GAZE_LIMITS.maxReadingMs) finishReading();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [phase, finishReading]);
  const startCamera = async () => {
    if (!consent || !video.current || phaseRef.current === "loading") return;
    release();
    invalidate();
    setMessage("");
    setFace(false);
    move("loading");
    const token = generation.current,
      abort = new AbortController();
    controller.current = abort;
    try {
      const instance = await createTracker(
        video.current,
        (features, at) => {
          if (token !== generation.current) return;
          if (features) lastFace.current = at;
          setFace(!!features);
          const point =
            features && model.current
              ? predictGaze(model.current, features)
              : null;
          const batch = capture.current;
          if (batch && at >= batch.at + GAZE_LIMITS.settlingMs && features) {
            batch.features.push(features);
            if (point) batch.predictions.push(point);
          }
          if (phaseRef.current === "reading")
            samples.current.push({
              t: at - readingAt.current,
              point,
              eyesTracked: !!features,
            });
        },
        (error) => {
          if (token === generation.current) interrupt(cameraMessage(error));
        },
        abort.signal,
        (points, at) => {
          if (token === generation.current) {
            landmarks.current = points;
            lastFrame.current = at;
          }
        },
      );
      if (token !== generation.current) {
        instance.stop();
        return;
      }
      tracker.current = instance;
      move("position");
    } catch (error) {
      if (token === generation.current) {
        release();
        move("idle");
        setMessage(cameraMessage(error));
      }
    }
  };
  const startCalibration = () => {
    invalidate();
    viewport.current = { width: innerWidth, height: innerHeight };
    setPointIndex(0);
    setBusy(false);
    setMessage("");
    move("calibration");
  };
  const collect = (button: HTMLButtonElement) => {
    if (capture.current) return;
    const r = button.getBoundingClientRect();
    const batch: Capture = {
      at: performance.now(),
      target: {
        x: (r.x + r.width / 2) / innerWidth,
        y: (r.y + r.height / 2) / innerHeight,
      },
      features: [],
      predictions: [],
    };
    capture.current = batch;
    setBusy(true);
    setMessage("");
    captureTimer.current = setTimeout(() => {
      capture.current = null;
      captureTimer.current = null;
      setBusy(false);
      const features = aggregateFeatures(batch.features);
      if (!features) {
        setMessage(
          "Mata belum cukup terlihat. Periksa cahaya, lalu coba titik ini lagi.",
        );
        return;
      }
      if (phaseRef.current === "calibration") {
        calibration.current.push({ features, target: batch.target });
        if (calibration.current.length < 9) {
          setPointIndex(calibration.current.length);
          return;
        }
        model.current = fitGazeModel(calibration.current);
        if (!model.current) {
          setMessage(
            "Posisi mata belum cukup terbaca. Ulangi kalibrasi atau lanjut tanpa pola mata.",
          );
          move("position");
          return;
        }
        checks.current = [];
        setPointIndex(0);
        move("check");
      } else if (phaseRef.current === "check") {
        checks.current.push({
          target: batch.target,
          predictions: batch.predictions,
        });
        if (checks.current.length < 6) {
          setPointIndex(checks.current.length);
          return;
        }
        validation.current = validateReadingRegions(
          checks.current,
          regions.current,
        );
        setMessage(validation.current.reason);
        move("ready");
      }
    }, GAZE_LIMITS.captureMs);
  };
  const noCamera = () => {
    release();
    invalidate();
    setMessage("");
    viewport.current = { width: innerWidth, height: innerHeight };
    move("ready");
  };
  const startReading = () => {
    samples.current = [];
    observation.current = null;
    readingAt.current = performance.now();
    reviewed.current = false;
    setActiveLine(0);
    setSeconds(0);
    setOral(["unassessed", "unassessed", "unassessed"]);
    setAssisted(false);
    viewport.current = { width: innerWidth, height: innerHeight };
    move("reading");
  };
  const finishSession = () => {
    if (!rounds.current.length) return;
    const value = readingStudySchema.parse({
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      version: 1,
      mode: guidedPractice ? "guided-practice" : "comparison",
      rounds: rounds.current,
    });
    setPersisted(saveReadingStudy(childId, value));
    setReport(value);
    release();
    invalidate();
    move("result");
  };
  const completeRound = () => {
    if (reviewed.current || !observation.current) return;
    reviewed.current = true;
    rounds.current.push({
      passageId: passage.id,
      observation: observation.current,
      answers,
      oral,
      assisted,
    });
    if (roundIndex === 0 && !guidedPractice) move("between");
    else finishSession();
  };
  const reset = () => {
    release();
    invalidate();
    rounds.current = [];
    setRoundIndex(guidedPractice ? 1 : 0);
    setReport(null);
    setMessage("");
    setBusy(false);
    move("idle");
  };
  const target = CALIBRATION_TARGETS[pointIndex];
  return (
    <section className="reading-study" aria-label="Eksperimen membaca terarah">
      <video ref={video} hidden autoPlay muted playsInline />
      {phase === "idle" || phase === "loading" ? (
        <div className="camera-panel">
          <h2>
            {guidedPractice
              ? "Latihan dengan panduan bagian"
              : "Coba dua cara membaca"}
          </h2>
          <p>
            {guidedPractice
              ? "Baca dengan panduan satu bagian, lalu jawab dua pertanyaan."
              : "Bacaan biasa → dua pertanyaan → bacaan dengan panduan bagian."}
          </p>
          <p className="study-note">
            Kamera opsional. Analisis antarbagian memerlukan 9 titik kalibrasi
            dan 6 titik pengecekan pada posisi bacaan.
          </p>
          <label className="camera-consent">
            <input
              type="checkbox"
              checked={consent}
              disabled={phase === "loading"}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Saya mendapat izin orang tua atau pendamping untuk mencoba kamera.
          </label>
          <div className="camera-actions">
            <button
              className="progress-button"
              disabled={!consent || phase === "loading"}
              onClick={() => void startCamera()}
            >
              {phase === "loading" ? "Menyiapkan kamera…" : "Aktifkan kamera"}
            </button>
            <button className="camera-assessment-link" onClick={noCamera}>
              Latihan tanpa kamera
            </button>
            {phase === "loading" && (
              <button
                className="progress-link"
                onClick={() => {
                  release();
                  move("idle");
                }}
              >
                Batalkan kamera
              </button>
            )}
          </div>
          <p className="study-note">
            Video dan posisi pandangan tidak disimpan atau diunggah. Ringkasan
            hasil tersimpan di browser per anak.
          </p>
          {history.length > 0 && (
            <button
              className="progress-link"
              onClick={() => {
                setReport(history[0]);
                move("result");
              }}
            >
              Lihat hasil terakhir
            </button>
          )}
        </div>
      ) : null}
      {phase === "position" && (
        <div className="camera-panel">
          <h2>Posisikan wajah</h2>
          <EyeTrackingPreview
            source={video}
            landmarks={landmarks}
            lastFrame={lastFrame}
          />
          <p role="status">
            {face
              ? "Mata terlihat. Jaga posisi kepala nyaman."
              : "Hadap ke kamera dan periksa cahaya."}
          </p>
          <div className="camera-actions">
            <button
              className="progress-button"
              disabled={!face}
              onClick={startCalibration}
            >
              Kalibrasi pandangan
            </button>
            <button className="camera-assessment-link" onClick={noCamera}>
              Lanjut tanpa pola mata
            </button>
            <button className="progress-link" onClick={reset}>
              Hentikan
            </button>
          </div>
        </div>
      )}
      {phase === "interrupted" && (
        <div className="camera-panel">
          <h2 ref={heading} tabIndex={-1}>
            Sesi perlu dilanjutkan ulang
          </h2>
          <p>{message}</p>
          <div className="camera-actions">
            <button
              className="progress-button"
              onClick={() => {
                setMessage("");
                move("idle");
              }}
            >
              Atur kamera lagi
            </button>
            <button className="camera-assessment-link" onClick={noCamera}>
              Ulangi bacaan tanpa kamera
            </button>
          </div>
        </div>
      )}
      {message && !modal && phase !== "interrupted" && (
        <p role="status" className="camera-message">
          {message}
        </p>
      )}
      <dialog
        ref={dialog}
        className="camera-dialog study-dialog"
        aria-label="Latihan pola membaca"
        onCancel={(e) => {
          e.preventDefault();
          if (phaseRef.current === "between") setRoundIndex(1);
          interrupt(
            "Sesi dihentikan. Bacaan yang belum selesai perlu diulang.",
          );
          if (
            phaseRef.current === "questions" ||
            phaseRef.current === "review" ||
            phaseRef.current === "between"
          )
            move("interrupted");
        }}
      >
        {phase === "calibration" && (
          <div className="camera-calibration">
            <div className="camera-calibration-heading">
              <h2>Kalibrasi · {pointIndex + 1}/9</h2>
              <p>Lihat titiknya, tekan, lalu tetap lihat sebentar.</p>
            </div>
            <button
              className={`camera-target ${busy ? "camera-target-busy" : ""}`}
              style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}
              aria-label={`Titik kalibrasi ${pointIndex + 1}`}
              aria-disabled={busy}
              onClick={(e) => collect(e.currentTarget)}
            >
              {pointIndex + 1}
            </button>
            <p role="status" className="camera-calibration-status">
              {busy
                ? "Tetap lihat titik…"
                : message || "Jaga posisi kepala tetap nyaman."}
            </p>
            <button className="progress-link camera-stop" onClick={noCamera}>
              Lewati dan latihan tanpa kamera
            </button>
          </div>
        )}
        {(phase === "check" || phase === "reading") && (
          <div className="study-stage">
            <header>
              <h2>
                {phase === "check"
                  ? `Pengecekan bagian · ${pointIndex + 1}/6`
                  : passage.guided
                    ? "Baca dengan panduan bagian"
                    : "Baca dengan nyaman"}
              </h2>
              <span>
                {phase === "reading"
                  ? `${seconds} detik`
                  : "Lihat dan tekan titik"}
              </span>
            </header>
            <div
              className={`study-passage ${phase === "check" ? "study-check" : ""}`}
              aria-label="Bacaan tiga bagian"
            >
              {passage.lines.map((line, i) => (
                <p
                  ref={(el) => {
                    lineElements.current[i] = el;
                  }}
                  key={i}
                  data-reading-region={i}
                  className={
                    phase === "reading" && passage.guided
                      ? activeLine === i
                        ? "study-line-active"
                        : "study-line-other"
                      : ""
                  }
                >
                  <span className="study-line-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>
                    {phase === "check" ? "Lihat titik pada bagian ini" : line}
                  </span>
                  {phase === "check" && Math.floor(pointIndex / 2) === i && (
                    <button
                      className={`camera-target ${busy ? "camera-target-busy" : ""}`}
                      style={{
                        left: pointIndex % 2 ? "68%" : "32%",
                        top: "50%",
                      }}
                      aria-label={`Titik pengecekan ${pointIndex + 1}`}
                      aria-disabled={busy}
                      onClick={(e) => collect(e.currentTarget)}
                    >
                      {pointIndex + 1}
                    </button>
                  )}
                </p>
              ))}
            </div>
            <footer>
              {phase === "check" ? (
                <>
                  <p role="status">
                    {busy
                      ? "Tetap lihat titik…"
                      : message || "Pengecekan ini tidak ikut melatih model."}
                  </p>
                  <button className="progress-link" onClick={noCamera}>
                    Lewati tanpa pola mata
                  </button>
                </>
              ) : (
                <>
                  {passage.guided && (
                    <div className="study-guide-controls">
                      <button
                        disabled={activeLine === 0}
                        onClick={() => setActiveLine((v) => v - 1)}
                      >
                        ← Bagian sebelumnya
                      </button>
                      <span>{activeLine + 1}/3</span>
                      <button
                        disabled={activeLine === 2}
                        onClick={() => setActiveLine((v) => v + 1)}
                      >
                        Bagian berikutnya →
                      </button>
                    </div>
                  )}
                  <div className="camera-actions">
                    <button className="progress-button" onClick={finishReading}>
                      Selesai membaca
                    </button>
                    <button
                      className="progress-link"
                      onClick={() =>
                        interrupt(
                          "Bacaan dihentikan. Kamu boleh mengulang saat siap.",
                        )
                      }
                    >
                      Berhenti
                    </button>
                    <small>
                      {tracker.current
                        ? face
                          ? "Mata terlihat"
                          : "Mata belum terlihat"
                        : "Tanpa kamera"}
                    </small>
                  </div>
                </>
              )}
            </footer>
          </div>
        )}
        {phase === "ready" && (
          <div className="camera-dialog-panel">
            <h2 tabIndex={-1}>Siap membaca?</h2>
            <p>
              {validation.current?.usable
                ? "Pengecekan dapat membedakan tiga bagian. Posisi yang meragukan akan dilewati."
                : "Jawaban tetap bisa dinilai. Pola mata belum akan ditampilkan."}
            </p>
            {message && <p className="study-note">{message}</p>}
            <p>
              {passage.guided
                ? "Gunakan tombol bagian sebelumnya / berikutnya sebagai panduan."
                : "Baca tiga bagian dengan nyaman, lalu jawab dua pertanyaan."}
            </p>
            <div className="camera-actions">
              <button className="progress-button" onClick={startReading}>
                Mulai baca
              </button>
              {tracker.current && !validation.current?.usable && (
                <button
                  className="camera-assessment-link"
                  onClick={startCalibration}
                >
                  Ulangi kalibrasi
                </button>
              )}
            </div>
          </div>
        )}
        {phase === "questions" && (
          <div className="camera-dialog-panel study-question">
            <p>Pemahaman · {question + 1}/2</p>
            <h2 tabIndex={-1}>{passage.questions[question].prompt}</h2>
            <div className="study-options">
              {passage.questions[question].options.map((option, i) => (
                <button
                  key={option}
                  onClick={() => {
                    setAnswers((values) =>
                      values.map((v, n) => (n === question ? i : v)),
                    );
                    if (question === 0) setQuestion(1);
                    else move("review");
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              className="progress-link"
              onClick={() => {
                if (question === 0) setQuestion(1);
                else move("review");
              }}
            >
              Lewati pertanyaan
            </button>
          </div>
        )}
        {phase === "review" && (
          <div className="camera-dialog-panel study-review">
            <h2 tabIndex={-1}>Catatan pendamping</h2>
            <p>
              Jika mendengar bacaan anak, tandai setiap bagian. Boleh dibiarkan
              belum dinilai.
            </p>
            {passage.lines.map((line, i) => (
              <label key={line}>
                <span>{line}</span>
                <select
                  value={oral[i]}
                  onChange={(e) =>
                    setOral((values) =>
                      values.map((v, n) =>
                        n === i
                          ? (e.target.value as StudyRound["oral"][number])
                          : v,
                      ),
                    )
                  }
                >
                  <option value="unassessed">Belum dinilai</option>
                  <option value="correct">Dibaca sesuai</option>
                  <option value="incorrect">Perlu diulang</option>
                </select>
              </label>
            ))}
            <label className="camera-consent">
              <input
                type="checkbox"
                checked={assisted}
                onChange={(e) => setAssisted(e.target.checked)}
              />
              Pendamping membantu membaca atau menjawab.
            </label>
            <button className="progress-button" onClick={completeRound}>
              Simpan bagian ini
            </button>
          </div>
        )}
        {phase === "between" && (
          <div className="camera-dialog-panel">
            <h2 tabIndex={-1}>Coba dengan panduan bagian</h2>
            <p>
              Bacaan pertama: {studyRoundResult(rounds.current[0]).correct} dari{" "}
              {studyRoundResult(rounds.current[0]).assessed} jawaban sesuai.
              Berikutnya gunakan penanda satu bagian.
            </p>
            <div className="camera-actions">
              <button
                className="progress-button"
                onClick={() => {
                  setRoundIndex(1);
                  setMessage("");
                  move("ready");
                }}
              >
                Lanjut bacaan kedua
              </button>
              <button
                className="camera-assessment-link"
                onClick={finishSession}
              >
                Selesai dulu
              </button>
            </div>
          </div>
        )}
        {modal && phase !== "calibration" && tracker.current && (
          <button
            className="study-camera-stop"
            onClick={() => {
              release();
              invalidate();
              setFace(false);
              if (phaseRef.current === "check") move("ready");
            }}
          >
            Matikan kamera
          </button>
        )}
      </dialog>
      {phase === "result" && report && (
        <div className="camera-panel">
          <h2 ref={heading} tabIndex={-1}>
            Catatan sesi membaca
          </h2>
          <ReadingStudyReport record={report} childId={childId} />
          <p className="study-note" role="status">
            {persisted
              ? "Ringkasan tersimpan pada browser ini. Video dan titik pandangan sudah dibuang."
              : "Penyimpanan browser tidak tersedia. Ringkasan hanya tersedia selama halaman terbuka."}
          </p>
          <button className="camera-assessment-link" onClick={reset}>
            Ulangi eksperimen
          </button>
        </div>
      )}
    </section>
  );
}
