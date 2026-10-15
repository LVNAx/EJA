import { GAZE_LIMITS, type ScreenPoint, type Validation } from "./gaze-model";

export type TrackingMode = "calibrated-gaze" | "eye-tracking";
export type GazeSample = {
  t: number;
  point: ScreenPoint | null;
  eyesTracked?: boolean;
};
export const AREA_LABELS = [
  "Atas kiri",
  "Atas tengah",
  "Atas kanan",
  "Tengah kiri",
  "Tengah",
  "Tengah kanan",
  "Bawah kiri",
  "Bawah tengah",
  "Bawah kanan",
];
export type ReadingSummary = {
  mode: TrackingMode;
  durationMs: number;
  coverage: number;
  onscreenCoverage: number;
  usable: boolean;
  reasons: string[];
  areaMs: number[];
  mappedMs: number;
};

/** Time-weighted screen regions; does not estimate word fixations or reading ability. */
export function summarizeReading(
  samples: GazeSample[],
  durationMs: number,
  validation: Validation | null,
  interrupted?: string,
  mode: TrackingMode = "calibrated-gaze",
): ReadingSummary {
  const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const events = samples
    .filter((s) => Number.isFinite(s.t) && s.t >= 0 && s.t <= duration)
    .sort((a, b) => a.t - b.t);
  let trackedMs = 0;
  let mappedMs = 0;
  const areaMs = Array<number>(9).fill(0);
  for (let i = 0; i < events.length; i++) {
    const { point, t } = events[i];
    const validPoint =
      !!point && Number.isFinite(point.x) && Number.isFinite(point.y);
    const interval = Math.max(
      0,
      Math.min(GAZE_LIMITS.maxSampleGapMs, (events[i + 1]?.t ?? duration) - t),
    );
    if (mode === "eye-tracking" ? events[i].eyesTracked === true : validPoint)
      trackedMs += interval;
    if (!validPoint || mode === "eye-tracking") continue;
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) continue;
    const cell =
      Math.min(2, Math.floor(point.y * 3)) * 3 +
      Math.min(2, Math.floor(point.x * 3));
    areaMs[cell] += interval;
    mappedMs += interval;
  }
  const coverage = duration ? trackedMs / duration : 0;
  const onscreenCoverage = duration ? mappedMs / duration : 0;
  const reasons: string[] = [];
  if (interrupted) reasons.push(interrupted);
  if (mode === "calibrated-gaze" && !validation?.usable)
    reasons.push("Pengecekan kalibrasi belum cukup tepat.");
  if (duration < GAZE_LIMITS.minReadingMs)
    reasons.push("Waktu pengamatan terlalu singkat untuk membuat ringkasan.");
  if (coverage < GAZE_LIMITS.minCoverage)
    reasons.push(
      "Wajah atau mata terlalu sering tidak terlacak, atau kamera terlalu lambat.",
    );
  if (
    mode === "calibrated-gaze" &&
    onscreenCoverage < GAZE_LIMITS.minOnscreenCoverage
  )
    reasons.push(
      "Terlalu sedikit perkiraan pandangan yang dapat dipetakan ke layar.",
    );
  const usable = reasons.length === 0;
  return {
    mode,
    durationMs: duration,
    coverage,
    onscreenCoverage,
    usable,
    reasons,
    areaMs: usable ? areaMs : Array<number>(9).fill(0),
    mappedMs: usable ? mappedMs : 0,
  };
}
