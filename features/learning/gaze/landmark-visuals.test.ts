import { describe, expect, it, vi } from "vitest";
import { drawEye, drawLandmarks, EYES, eyeCrop } from "./landmark-visuals";
import type { Landmark } from "./gaze-model";

function face(): Landmark[] {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  for (const [side, center] of [
    ["left", 0.7],
    ["right", 0.2],
  ] as const) {
    EYES[side].contour.forEach((index, i) => {
      points[index] = {
        x: center + Math.cos((i * Math.PI) / 8) * 0.05,
        y: 0.4 + Math.sin((i * Math.PI) / 8) * 0.02,
      };
    });
    points[EYES[side].center] = { x: center, y: 0.4 };
  }
  return points;
}
function canvas() {
  const context = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
  };
  return {
    element: {
      width: 640,
      height: 480,
      getContext: () => context,
    } as unknown as HTMLCanvasElement,
    context,
  };
}

describe("visualisasi titik wajah", () => {
  it("mengambil pembesaran mata dari sisi anatomi yang sesuai, tetap di dalam gambar", () => {
    const points = face();
    const left = eyeCrop(points, "left", 640, 480)!;
    const right = eyeCrop(points, "right", 640, 480)!;
    expect(left.x).toBeGreaterThan(right.x);
    for (const crop of [left, right]) {
      expect(crop.x).toBeGreaterThanOrEqual(0);
      expect(crop.y).toBeGreaterThanOrEqual(0);
      expect(crop.x + crop.width).toBeLessThanOrEqual(640);
      expect(crop.y + crop.height).toBeLessThanOrEqual(480);
    }
    expect(eyeCrop([], "left", 640, 480)).toBeNull();
    expect(eyeCrop(points, "left", 0, 0)).toBeNull();
  });
  it("menggunakan koordinat frame sumber; lapisan kosong dibersihkan agar titik lama hilang", () => {
    const { element, context } = canvas();
    drawLandmarks(element, [{ x: 0.2, y: 0.4 }], 640, 480, {
      points: true,
      eyes: false,
      contour: false,
    });
    expect(context.arc).toHaveBeenCalledWith(
      128,
      192,
      expect.any(Number),
      0,
      Math.PI * 2,
    );
    context.arc.mockClear();
    drawLandmarks(element, [], 640, 480, {
      points: true,
      eyes: true,
      contour: true,
    });
    expect(context.clearRect).toHaveBeenLastCalledWith(0, 0, 640, 480);
    expect(context.arc).not.toHaveBeenCalled();
  });
  it("opsi penanda mati tetap memperlihatkan gambar pembesaran tanpa menggambar garis mata", () => {
    const { element, context } = canvas();
    drawEye(
      element,
      { videoWidth: 640, videoHeight: 480, readyState: 2 } as HTMLVideoElement,
      face(),
      "left",
      false,
    );
    expect(context.drawImage).toHaveBeenCalledOnce();
    expect(context.stroke).not.toHaveBeenCalled();
  });
  it("tidak menggambar dari video yang belum siap atau data titik tidak valid", () => {
    const { element, context } = canvas();
    drawEye(
      element,
      { videoWidth: 640, videoHeight: 480, readyState: 0 } as HTMLVideoElement,
      face(),
      "left",
    );
    expect(context.drawImage).not.toHaveBeenCalled();
    drawLandmarks(element, [{ x: NaN, y: Infinity }], 640, 480, {
      points: true,
      eyes: true,
      contour: true,
    });
    expect(context.arc).not.toHaveBeenCalled();
  });
});
