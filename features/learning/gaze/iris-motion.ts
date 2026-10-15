import { z } from "zod";

const ms = z.number().finite().min(0).max(600_000);
export const irisMotionSchema = z
  .object({
    baselineSamples: z.number().int().min(10).max(1000),
    threshold: z.number().finite().min(0.04).max(2),
    shifts: z.number().int().min(0).max(3000),
    validMs: ms,
    headRejectedMs: ms,
    samples: z.number().int().min(0).max(10000),
    windows: z
      .array(
        z
          .object({
            second: z.number().int().min(0).max(595).multipleOf(5),
            shifts: z.number().int().min(0).max(100),
            validMs: z.number().finite().min(0).max(5000),
          })
          .strict(),
      )
      .max(120),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.windows.some((w, i) => i > 0 && w.second <= v.windows[i - 1].second) ||
      v.windows.reduce((s, w) => s + w.shifts, 0) !== v.shifts ||
      Math.abs(v.windows.reduce((s, w) => s + w.validMs, 0) - v.validMs) > 0.1
    )
      ctx.addIssue({
        code: "custom",
        message: "Ringkasan pergerakan iris tidak konsisten.",
      });
  });
export type IrisMotion = z.infer<typeof irisMotionSchema>;
export type IrisBaseline = { samples: number; threshold: number };
const iris = (f: number[]) => [(f[0] + f[2]) / 2, (f[1] + f[3]) / 2];
const distance = (a: number[], b: number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);
const valid = (f: number[] | null): f is number[] =>
  !!f && f.length === 8 && f.every(Number.isFinite);
/** Personal still-target reference. Threshold is an engineering deadband in eye-width units. */
export function calibrateIrisNoise(frames: number[][]): IrisBaseline | null {
  if (frames.length < 10 || frames.some((f) => !valid(f))) return null;
  const movements = frames
    .slice(1)
    .map((f, i) => distance(iris(f), iris(frames[i])))
    .sort((a, b) => a - b);
  const threshold = Math.max(
    0.04,
    4 * (movements[Math.ceil(movements.length * 0.95) - 1] ?? 0),
  );
  return threshold <= 0.3 ? { samples: frames.length, threshold } : null;
}

/** Counts sustained coarse shifts, not physiological saccades or reading regressions. */
export class IrisMotionCollector {
  private previous: { f: number[]; at: number; elapsedMs: number } | null =
    null;
  private anchor: number[] | null = null;
  private candidate: { at: number; frames: number; point: number[] } | null =
    null;
  private shifts = 0;
  private validMs = 0;
  private headRejectedMs = 0;
  private samples = 0;
  private windows = new Map<
    number,
    { second: number; shifts: number; validMs: number }
  >();
  constructor(private baseline: IrisBaseline) {}
  pause() {
    this.previous = null;
    this.anchor = null;
    this.candidate = null;
  }
  push(f: number[] | null, at: number, elapsedMs: number) {
    if (!Number.isFinite(at) || !Number.isFinite(elapsedMs) || elapsedMs < 0)
      return;
    if (!valid(f)) {
      this.pause();
      return;
    }
    this.samples++;
    const previous = this.previous;
    this.previous = { f: [...f], at, elapsedMs };
    if (!previous) {
      this.anchor = iris(f);
      return;
    }
    const dt = at - previous.at;
    if (dt <= 0 || dt > 250) {
      this.anchor = iris(f);
      this.candidate = null;
      return;
    }
    const observedDt = Math.min(
      dt,
      Math.max(0, elapsedMs - previous.elapsedMs),
    );
    if (observedDt <= 0) return;
    const headMoved =
      Math.hypot(f[4] - previous.f[4], f[5] - previous.f[5]) > 0.025 ||
      Math.abs(f[6] / previous.f[6] - 1) > 0.08 ||
      Math.abs(f[7] - previous.f[7]) > 0.08;
    if (headMoved) {
      this.headRejectedMs += observedDt;
      this.anchor = null;
      this.candidate = null;
      return;
    }
    const right = [f[0] - previous.f[0], f[1] - previous.f[1]],
      left = [f[2] - previous.f[2], f[3] - previous.f[3]];
    if (right[0] * left[0] + right[1] * left[1] < -0.0004) {
      this.anchor = null;
      this.candidate = null;
      return;
    }
    // Split time across window boundaries rather than assigning a whole interval to its end.
    let remaining = observedDt,
      cursor = Math.max(0, elapsedMs - observedDt);
    while (remaining > 0) {
      const second = Math.floor(cursor / 5000) * 5;
      if (second > 595) break;
      const part = Math.min(remaining, (second + 5) * 1000 - cursor);
      if (part <= 0) break;
      const w = this.windows.get(second) ?? { second, shifts: 0, validMs: 0 };
      w.validMs += part;
      this.windows.set(second, w);
      this.validMs += part;
      cursor += part;
      remaining -= part;
    }
    const point = iris(f);
    if (!this.anchor) {
      this.anchor = point;
      return;
    }
    if (distance(point, this.anchor) <= this.baseline.threshold) {
      this.candidate = null;
      return;
    }
    if (
      !this.candidate ||
      distance(point, this.candidate.point) > this.baseline.threshold / 2
    )
      this.candidate = { at, frames: 0, point };
    this.candidate.frames++;
    if (at - this.candidate.at >= 200 && this.candidate.frames >= 3) {
      const second = Math.floor(elapsedMs / 5000) * 5;
      if (second <= 595) {
        const w = this.windows.get(second) ?? { second, shifts: 0, validMs: 0 };
        w.shifts++;
        this.windows.set(second, w);
        this.shifts++;
      }
      this.anchor = point;
      this.candidate = null;
    }
  }
  snapshot(): IrisMotion {
    return {
      baselineSamples: this.baseline.samples,
      threshold: this.baseline.threshold,
      shifts: this.shifts,
      validMs: this.validMs,
      headRejectedMs: this.headRejectedMs,
      samples: this.samples,
      windows: [...this.windows.values()]
        .sort((a, b) => a.second - b.second)
        .map((w) => ({ ...w })),
    };
  }
}

export function irisQuality(eyes: {
  observedMs: number;
  trackedMs: number;
  motion?: IrisMotion;
}) {
  const m = eyes.motion;
  if (!m)
    return {
      usable: false,
      reason:
        "Referensi iris belum tersedia. Perubahan posisi belum dapat dinilai.",
    };
  if (eyes.observedMs < 5000 || m.samples < 20)
    return {
      usable: false,
      reason:
        "Pengamatan terlalu singkat atau frame terlalu sedikit untuk merangkum perubahan iris.",
    };
  if (
    eyes.trackedMs / eyes.observedMs < 0.65 ||
    m.validMs / eyes.observedMs < 0.5
  )
    return {
      usable: false,
      reason:
        "Terlalu banyak sinyal hilang, jeda kamera, atau gerakan kepala. Perubahan iris belum dapat dinilai.",
    };
  return {
    usable: true,
    reason:
      "Perubahan posisi iris yang bertahan sedikitnya 200 ms, dibandingkan referensi diam anak. Belum memiliki batas normal atau berlebihan.",
  };
}
