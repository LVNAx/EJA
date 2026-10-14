import type { Point, Stroke } from "./templates";

/** Separate numbered starts when two strokes begin at the same point. */
export function guideLabelPositions(strokes: Stroke[]): Point[] {
  const positions: Point[] = [];
  const offsets = [0, -40, 40, -80, 80];
  for (const stroke of strokes) {
    const start = stroke[0];
    const candidates = offsets.flatMap((dy) =>
      offsets.map((dx) => ({ x: start.x + dx, y: start.y + dy })),
    );
    const free = candidates.find(
      (point) =>
        point.x >= 18 &&
        point.x <= 282 &&
        point.y >= 18 &&
        point.y <= 282 &&
        positions.every(
          (other) => Math.hypot(point.x - other.x, point.y - other.y) >= 36,
        ),
    );
    positions.push(free ?? start);
  }
  return positions;
}
