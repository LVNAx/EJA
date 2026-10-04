import { describe, expect, it } from "vitest";
import {
  evaluateTrace,
  writingCharacters,
  writingTemplates,
  type Stroke,
} from "./tracing";

describe("evaluasi jalur tulisan", () => {
  const template = writingTemplates.A;

  it("menyediakan jalur valid untuk A–Z, a–z, dan 0–9", () => {
    expect(writingCharacters).toHaveLength(62);
    for (const character of writingCharacters) {
      const strokes = writingTemplates[character];
      expect(strokes?.length).toBeGreaterThan(0);
      for (const stroke of strokes) {
        expect(stroke.length).toBeGreaterThan(10);
        for (const point of stroke) {
          expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(
            true,
          );
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(300);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(300);
        }
      }
    }
  });

  it("memberi nol untuk kanvas kosong", () => {
    expect(evaluateTrace(template, []).score).toBe(0);
  });

  it("mengenali goresan yang mengikuti contoh", () => {
    const near = template.map((stroke) =>
      stroke.map((point) => ({ x: point.x + 2, y: point.y + 2 })),
    );
    const result = evaluateTrace(template, near);
    expect(result.coverage).toBeGreaterThan(0.9);
    expect(result.score).toBeGreaterThan(80);
  });

  it("memberi nilai penuh hanya untuk jalur yang tepat", () => {
    expect(evaluateTrace(writingTemplates.a, writingTemplates.a).score).toBe(
      100,
    );
  });

  it("menilai bentuk yang dekat tetapi menyambung dua goresan sekitar 70-an", () => {
    const guide = writingTemplates.a;
    const near = guide.map((stroke) =>
      stroke.map((point) => ({ x: point.x + 3, y: point.y + 4 })),
    );
    const joined = [near.flat()];
    const nearScore = evaluateTrace(guide, near).score;
    const joinedScore = evaluateTrace(guide, joined).score;
    expect(nearScore).toBeGreaterThan(80);
    expect(joinedScore).toBeGreaterThanOrEqual(65);
    expect(joinedScore).toBeLessThanOrEqual(80);
    expect(joinedScore).toBeLessThan(nearScore);
  });

  it("mengurangi nilai saat jalur yang sama dicoret berulang", () => {
    const guide = writingTemplates.a;
    const repeated = [...guide, ...guide];
    expect(evaluateTrace(guide, repeated).score).toBeLessThan(85);
  });

  it("mengurangi nilai coretan di seluruh kanvas", () => {
    const scribble: Stroke[] = Array.from({ length: 12 }, (_, index) => [
      { x: 5, y: 10 + index * 24 },
      { x: 295, y: 10 + index * 24 },
    ]);
    const result = evaluateTrace(template, scribble);
    expect(result.outsidePenalty).toBeGreaterThan(0.2);
    expect(result.score).toBeLessThan(50);
  });
});
