export type ScreenPoint = { x: number; y: number };
export type Landmark = ScreenPoint & { z?: number };
export type CalibrationRow = { features: number[]; target: ScreenPoint };
export type GazeModel = {
  mean: number[];
  scale: number[];
  x: number[];
  y: number[];
  center: ScreenPoint;
};

export const CALIBRATION_TARGETS: ScreenPoint[] = [
  { x: 0.14, y: 0.18 },
  { x: 0.5, y: 0.18 },
  { x: 0.86, y: 0.18 },
  { x: 0.14, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.86, y: 0.5 },
  { x: 0.14, y: 0.82 },
  { x: 0.5, y: 0.82 },
  { x: 0.86, y: 0.82 },
];
export const VALIDATION_TARGETS: ScreenPoint[] = [
  { x: 0.25, y: 0.3 },
  { x: 0.75, y: 0.3 },
  { x: 0.25, y: 0.7 },
  { x: 0.75, y: 0.7 },
  { x: 0.5, y: 0.42 },
];
export const GAZE_LIMITS = {
  captureMs: 1600,
  settlingMs: 400,
  minPointSamples: 6,
  maxMedianError: 0.12,
  maxP90Error: 0.22,
  minReadingMs: 5000,
  maxReadingMs: 120_000,
  maxSampleGapMs: 250,
  minCoverage: 0.65,
  minOnscreenCoverage: 0.4,
} as const;

/** Iris positions relative to eye corners, plus coarse head position/scale/roll. */
export function eyeFeatures(points: Landmark[]): number[] | null {
  const indices = [468, 473, 33, 133, 159, 145, 263, 362, 386, 374, 1];
  if (
    indices.some(
      (i) =>
        !points[i] ||
        !Number.isFinite(points[i].x) ||
        !Number.isFinite(points[i].y),
    )
  )
    return null;
  const eye = (
    iris: number,
    a: number,
    b: number,
    top: number,
    bottom: number,
  ) => {
    const width = Math.hypot(
      points[a].x - points[b].x,
      points[a].y - points[b].y,
    );
    const height = Math.hypot(
      points[top].x - points[bottom].x,
      points[top].y - points[bottom].y,
    );
    if (width < 0.015 || height / width < 0.1) return null;
    const center = {
      x: (points[a].x + points[b].x) / 2,
      y: (points[a].y + points[b].y) / 2,
    };
    return {
      center,
      x: (points[iris].x - center.x) / width,
      y: (points[iris].y - center.y) / width,
    };
  };
  const right = eye(468, 33, 133, 159, 145);
  const left = eye(473, 263, 362, 386, 374);
  if (!left || !right) return null;
  const span = Math.hypot(
    left.center.x - right.center.x,
    left.center.y - right.center.y,
  );
  if (span < 0.04) return null;
  return [
    right.x,
    right.y,
    left.x,
    left.y,
    points[1].x,
    points[1].y,
    span,
    Math.atan2(left.center.y - right.center.y, left.center.x - right.center.x),
  ];
}

export function median(values: number[]): number {
  if (!values.length) return Infinity;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function aggregateFeatures(frames: number[][]): number[] | null {
  if (
    frames.length < GAZE_LIMITS.minPointSamples ||
    frames.some(
      (row) => row.length !== 8 || row.some((v) => !Number.isFinite(v)),
    )
  )
    return null;
  return frames[0].map((_, i) => median(frames.map((row) => row[i])));
}

function solve(matrix: number[][], rhs: number[]): number[] | null {
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < rhs.length; col++) {
    let pivot = col;
    for (let row = col + 1; row < rhs.length; row++)
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col];
    a[col] = a[col].map((v) => v / divisor);
    for (let row = 0; row < rhs.length; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      a[row] = a[row].map((v, i) => v - factor * a[col][i]);
    }
  }
  const weights = a.map((row) => row.at(-1)!);
  return weights.every(Number.isFinite) ? weights : null;
}

/** Small, per-session standardized ridge regression; validation samples never train it. */
export function fitGazeModel(rows: CalibrationRow[]): GazeModel | null {
  if (
    rows.length !== CALIBRATION_TARGETS.length ||
    rows.some(
      (r) =>
        r.features.length !== 8 || r.features.some((v) => !Number.isFinite(v)),
    )
  )
    return null;
  const mean = rows[0].features.map(
    (_, i) => rows.reduce((sum, r) => sum + r.features[i], 0) / rows.length,
  );
  const rawScale = mean.map((m, i) =>
    Math.sqrt(
      rows.reduce((sum, r) => sum + (r.features[i] - m) ** 2, 0) / rows.length,
    ),
  );
  if (Math.max(...rawScale.slice(0, 4)) < 0.0001) return null;
  const scale = rawScale.map((s) => Math.max(s, 0.0001));
  const xs = rows.map((r) =>
    r.features.map((v, i) => (v - mean[i]) / scale[i]),
  );
  const center = {
    x: rows.reduce((sum, r) => sum + r.target.x, 0) / rows.length,
    y: rows.reduce((sum, r) => sum + r.target.y, 0) / rows.length,
  };
  const gram = mean.map((_, i) =>
    mean.map(
      (__, j) =>
        xs.reduce((sum, x) => sum + x[i] * x[j], 0) / rows.length +
        (i === j ? 0.03 : 0),
    ),
  );
  const weights = (axis: "x" | "y") =>
    solve(
      gram,
      mean.map(
        (_, i) =>
          xs.reduce(
            (sum, x, n) => sum + x[i] * (rows[n].target[axis] - center[axis]),
            0,
          ) / rows.length,
      ),
    );
  const x = weights("x");
  const y = weights("y");
  return x && y ? { mean, scale, center, x, y } : null;
}

export function predictGaze(
  model: GazeModel,
  features: number[],
): ScreenPoint | null {
  if (
    features.length !== model.mean.length ||
    features.some((v) => !Number.isFinite(v))
  )
    return null;
  const row = features.map((v, i) => (v - model.mean[i]) / model.scale[i]);
  const point = {
    x: model.center.x + row.reduce((sum, v, i) => sum + v * model.x[i], 0),
    y: model.center.y + row.reduce((sum, v, i) => sum + v * model.y[i], 0),
  };
  return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
}

export type ValidationPoint = {
  target: ScreenPoint;
  predictions: ScreenPoint[];
};
export type Validation = {
  usable: boolean;
  medianError: number;
  p90Error: number;
};
export function assessValidation(
  checks: ValidationPoint[],
  viewport: { width: number; height: number },
): Validation {
  const errors = checks
    .flatMap(({ target, predictions }) =>
      predictions.map(
        (p) =>
          Math.hypot(
            (p.x - target.x) * viewport.width,
            (p.y - target.y) * viewport.height,
          ) / Math.hypot(viewport.width, viewport.height),
      ),
    )
    .sort((a, b) => a - b);
  const medianError = median(errors);
  const p90Error =
    errors[Math.max(0, Math.ceil(errors.length * 0.9) - 1)] ?? Infinity;
  return {
    medianError,
    p90Error,
    usable:
      checks.length === VALIDATION_TARGETS.length &&
      checks.every(
        (c) => c.predictions.length >= GAZE_LIMITS.minPointSamples,
      ) &&
      errors.every(Number.isFinite) &&
      medianError <= GAZE_LIMITS.maxMedianError &&
      p90Error <= GAZE_LIMITS.maxP90Error,
  };
}
