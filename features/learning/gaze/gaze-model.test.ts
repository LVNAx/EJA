import { describe, expect, it } from "vitest";
import {
  aggregateFeatures,
  assessValidation,
  CALIBRATION_TARGETS,
  eyeFeatures,
  fitGazeModel,
  predictGaze,
  VALIDATION_TARGETS,
  type Landmark,
} from "./gaze-model";
import { summarizeReading } from "./reading-summary";

const features = (x: number, y: number) => [x, y, x, y, 0.5, 0.5, 0.3, 0];
const rows = CALIBRATION_TARGETS.map((target) => ({
  target,
  features: features(target.x, target.y),
}));
const viewport = { width: 1200, height: 800 };
const goodValidation = { usable: true, medianError: 0.01, p90Error: 0.02 };
const reading = (point: { x: number; y: number } | null) =>
  Array.from({ length: 60 }, (_, i) => ({ t: i * 100, point }));

describe("kalibrasi pandangan", () => {
  it("memetakan fitur ke posisi baru tanpa dilatih pada titik pengecekan", () => {
    const model = fitGazeModel(rows)!;
    expect(model).not.toBeNull();
    const before = JSON.stringify(model);
    const checks = VALIDATION_TARGETS.map((target) => ({
      target,
      predictions: Array.from(
        { length: 8 },
        () => predictGaze(model, features(target.x, target.y))!,
      ),
    }));
    expect(assessValidation(checks, viewport).usable).toBe(true);
    expect(JSON.stringify(model)).toBe(before);
    for (const check of checks) {
      expect(check.predictions[0].x).toBeCloseTo(check.target.x, 2);
      expect(check.predictions[0].y).toBeCloseTo(check.target.y, 2);
    }
  });
  it("menolak kalibrasi tanpa variasi, tidak lengkap, atau tidak finite", () => {
    expect(fitGazeModel(rows.slice(0, 8))).toBeNull();
    expect(
      fitGazeModel(rows.map((r) => ({ ...r, features: features(0.5, 0.5) }))),
    ).toBeNull();
    expect(
      fitGazeModel(rows.map((r) => ({ ...r, features: features(NaN, 0.5) }))),
    ).toBeNull();
    expect(
      aggregateFeatures(Array.from({ length: 5 }, () => features(0.5, 0.5))),
    ).toBeNull();
    expect(
      aggregateFeatures(
        Array.from({ length: 7 }, (_, i) => features(i === 6 ? 99 : 0.5, 0.5)),
      )![0],
    ).toBe(0.5);
  });
  it("menolak prediksi pusat yang konstan serta titik pengecekan yang kekurangan sampel", () => {
    const constant = VALIDATION_TARGETS.map((target) => ({
      target,
      predictions: Array.from({ length: 8 }, () => ({ x: 0.5, y: 0.5 })),
    }));
    expect(assessValidation(constant, viewport).usable).toBe(false);
    const few = VALIDATION_TARGETS.map((target) => ({
      target,
      predictions: Array.from({ length: 5 }, () => target),
    }));
    expect(assessValidation(few, viewport).usable).toBe(false);
    expect(assessValidation([], viewport).usable).toBe(false);
  });
  it("tidak menjepit prediksi di luar layar seolah tetap melihat layar", () => {
    const model = fitGazeModel(rows)!;
    expect(predictGaze(model, features(2, 2))!.x).toBeGreaterThan(1);
    expect(predictGaze(model, [NaN])).toBeNull();
  });
  it("mengekstrak iris relatif terhadap mata dan menolak mata tertutup atau terlalu kecil", () => {
    const points: Landmark[] = Array.from({ length: 478 }, () => ({
      x: 0.5,
      y: 0.5,
    }));
    Object.assign(points[33], { x: 0.3, y: 0.4 });
    Object.assign(points[133], { x: 0.4, y: 0.4 });
    Object.assign(points[263], { x: 0.7, y: 0.4 });
    Object.assign(points[362], { x: 0.6, y: 0.4 });
    Object.assign(points[468], { x: 0.35, y: 0.4 });
    Object.assign(points[473], { x: 0.65, y: 0.4 });
    for (const i of [159, 386]) Object.assign(points[i], { y: 0.38 });
    for (const i of [145, 374]) Object.assign(points[i], { y: 0.42 });
    expect(eyeFeatures(points)).toHaveLength(8);
    expect(eyeFeatures([])).toBeNull();
    points[145] = { ...points[159] };
    expect(eyeFeatures(points)).toBeNull();
  });
});

describe("ringkasan kamera berbobot waktu", () => {
  it("merangkum mata yang terlacak tanpa kalibrasi dan tanpa membuat peta layar", () => {
    const samples = reading(null).map((s) => ({ ...s, eyesTracked: true }));
    const result = summarizeReading(
      samples,
      6000,
      null,
      undefined,
      "eye-tracking",
    );
    expect(result.usable).toBe(true);
    expect(result.mode).toBe("eye-tracking");
    expect(result.coverage).toBe(1);
    expect(result.mappedMs).toBe(0);
    expect(result.areaMs.every((ms) => ms === 0)).toBe(true);
    // Even stale/invalid calibration predictions cannot become a screen map.
    expect(
      summarizeReading(
        samples.map((s) => ({ ...s, point: { x: 0.5, y: 0.5 } })),
        6000,
        { ...goodValidation, usable: false },
        undefined,
        "eye-tracking",
      ).mappedMs,
    ).toBe(0);
  });
  it("tidak menghitung wajah saja atau frame mata yang berhenti sebagai pelacakan mata tersedia", () => {
    for (const samples of [
      reading(null).map((s) => ({ ...s, eyesTracked: false })),
      [{ t: 0, point: null, eyesTracked: true }],
      Array.from({ length: 6 }, (_, i) => ({
        t: i * 1000,
        point: null,
        eyesTracked: true,
      })),
    ]) {
      const result = summarizeReading(
        samples,
        6000,
        null,
        undefined,
        "eye-tracking",
      );
      expect(result.usable).toBe(false);
      expect(result.coverage).toBeLessThan(0.65);
    }
  });
  it("menghasilkan sebaran area besar untuk sesi yang lolos kualitas", () => {
    const result = summarizeReading(
      reading({ x: 0.5, y: 0.5 }),
      6000,
      goodValidation,
    );
    expect(result.usable).toBe(true);
    expect(result.coverage).toBe(1);
    expect(result.areaMs[4]).toBe(6000);
    expect(result.areaMs.reduce((a, b) => a + b, 0)).toBe(result.mappedMs);
    const corner = summarizeReading(
      reading({ x: 1, y: 1 }),
      6000,
      goodValidation,
    );
    expect(corner.areaMs[8]).toBe(6000);
  });
  it("kamera lambat atau sampel yang berhenti tidak dianggap terus melacak", () => {
    const slow = summarizeReading(
      Array.from({ length: 6 }, (_, i) => ({
        t: i * 1000,
        point: { x: 0.5, y: 0.5 },
      })),
      6000,
      goodValidation,
    );
    expect(slow.coverage).toBe(0.25);
    expect(slow.usable).toBe(false);
    expect(slow.areaMs.every((ms) => ms === 0)).toBe(true);
    const stalled = summarizeReading(
      [{ t: 0, point: { x: 0.5, y: 0.5 } }],
      6000,
      goodValidation,
    );
    expect(stalled.coverage).toBeLessThan(0.05);
  });
  it("tidak menampilkan peta untuk data hilang, di luar layar, atau kalibrasi gagal", () => {
    const missing = summarizeReading(reading(null), 6000, goodValidation);
    const outside = summarizeReading(
      reading({ x: 2, y: 0.5 }),
      6000,
      goodValidation,
    );
    const failed = summarizeReading(reading({ x: 0.5, y: 0.5 }), 6000, {
      ...goodValidation,
      usable: false,
    });
    for (const result of [missing, outside, failed]) {
      expect(result.usable).toBe(false);
      expect(result.areaMs.every((ms) => ms === 0)).toBe(true);
      expect(result.mappedMs).toBe(0);
    }
    expect(outside.coverage).toBe(1);
    expect(outside.onscreenCoverage).toBe(0);
  });
  it("menolak sesi terlalu singkat dan sesi terputus meskipun sampelnya baik", () => {
    expect(
      summarizeReading(reading({ x: 0.5, y: 0.5 }), 1000, goodValidation)
        .usable,
    ).toBe(false);
    expect(
      summarizeReading(
        reading({ x: 0.5, y: 0.5 }),
        6000,
        goodValidation,
        "Layar berubah",
      ).usable,
    ).toBe(false);
  });
  it("mengurutkan waktu, mengabaikan data tidak valid, dan tidak menggandakan interval duplikat", () => {
    const events = reading({ x: 0.5, y: 0.5 });
    const result = summarizeReading(
      [...events, ...events, { t: NaN, point: null }].reverse(),
      6000,
      goodValidation,
    );
    expect(result.coverage).toBe(1);
    expect(result.mappedMs).toBe(6000);
    expect(summarizeReading([], NaN, null).coverage).toBe(0);
  });
});
