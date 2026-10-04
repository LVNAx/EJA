import { type Point, type Stroke } from "./templates";

export { writingCharacters, writingTemplates } from "./templates";
export type { Point, Stroke } from "./templates";

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sampleStroke(stroke: Stroke): Stroke {
  if (stroke.length < 2) return stroke;
  const points: Stroke = [stroke[0]];
  for (let index = 1; index < stroke.length; index++) {
    const a = stroke[index - 1];
    const b = stroke[index];
    const steps = Math.max(1, Math.ceil(distance(a, b) / 4));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return points;
}

function nearestDistance(point: Point, path: Stroke): number {
  let nearest = Infinity;
  for (const target of path)
    nearest = Math.min(nearest, distance(point, target));
  return nearest;
}

function pathLength(strokes: Stroke[]): number {
  return strokes.reduce(
    (total, stroke) =>
      total +
      stroke.reduce(
        (length, point, index) =>
          length + (index ? distance(stroke[index - 1], point) : 0),
        0,
      ),
    0,
  );
}

function closeness(distanceFromGuide: number, tolerance: number): number {
  // Jarak kecil tetap dihargai, tetapi tidak otomatis dihitung sempurna.
  return Math.max(0, 1 - distanceFromGuide / (tolerance * 1.5));
}

export type TraceResult = {
  coverage: number;
  proximity: number;
  outsidePenalty: number;
  score: number;
};

export function evaluateTrace(
  template: Stroke[],
  drawn: Stroke[],
  tolerance = 16,
): TraceResult {
  const targets = template.flatMap(sampleStroke);
  const allDrawn = drawn.flatMap(sampleStroke);
  if (!targets.length || !allDrawn.length)
    return { coverage: 0, proximity: 0, outsidePenalty: 0, score: 0 };

  const sampled =
    allDrawn.length > 2500
      ? allDrawn.filter(
          (_, index) => index % Math.ceil(allDrawn.length / 2500) === 0,
        )
      : allDrawn;
  const coverage =
    targets.filter((point) => nearestDistance(point, sampled) <= tolerance)
      .length / targets.length;
  const targetDistances = targets.map((point) =>
    nearestDistance(point, sampled),
  );
  const distances = sampled.map((point) => nearestDistance(point, targets));
  const guideCloseness =
    targetDistances.reduce(
      (sum, value) => sum + closeness(value, tolerance),
      0,
    ) / targets.length;
  const proximity =
    distances.reduce((sum, value) => sum + closeness(value, tolerance), 0) /
    distances.length;
  const outsidePenalty =
    distances.reduce(
      (sum, value) => sum + Math.min(1, Math.max(0, value - tolerance) / 65),
      0,
    ) / distances.length;
  const missingStrokeShare =
    Math.max(0, template.length - drawn.length) / template.length;
  const guideLength = pathLength(template);
  const extraLengthShare = guideLength
    ? Math.max(0, pathLength(drawn) / guideLength - 1.1)
    : 0;
  const repeatPenalty = Math.min(0.25, extraLengthShare * 0.3);
  const score = Math.round(
    100 *
      Math.max(
        0,
        Math.min(
          1,
          0.1 * coverage +
            0.45 * guideCloseness +
            0.45 * proximity -
            0.15 * outsidePenalty -
            0.24 * missingStrokeShare -
            repeatPenalty,
        ),
      ),
  );
  return { coverage, proximity, outsidePenalty, score };
}
