import { describe, expect, it } from "vitest";
import {
  calibrateIrisNoise,
  IrisMotionCollector,
  irisMotionSchema,
  irisQuality,
} from "./iris-motion";
const f = (x = 0.1, nose = 0.5) => [x, 0.1, x, 0.1, nose, 0.5, 0.3, 0];
const baseline = () =>
  calibrateIrisNoise(
    Array.from({ length: 21 }, (_, i) => f(0.1 + (i % 2) * 0.001)),
  )!;
describe("pengamatan perubahan iris relatif", () => {
  it("memerlukan referensi yang cukup dan menolak referensi yang sangat bergerak", () => {
    expect(calibrateIrisNoise([f()])).toBeNull();
    expect(
      calibrateIrisNoise(
        Array.from({ length: 20 }, (_, i) => f(i % 2 ? 1 : 0)),
      ),
    ).toBeNull();
    expect(baseline()).toMatchObject({ samples: 21, threshold: 0.04 });
  });
  it("getaran kecil tidak menjadi pergeseran posisi", () => {
    const c = new IrisMotionCollector(baseline());
    for (let t = 0; t <= 6000; t += 100)
      c.push(f(0.1 + Math.sin(t) * 0.005), t, t);
    expect(c.snapshot().shifts).toBe(0);
    expect(
      irisQuality({ observedMs: 6000, trackedMs: 6000, motion: c.snapshot() })
        .usable,
    ).toBe(true);
  });
  it("menghitung posisi baru yang bertahan, tidak setiap frame atau satu lonjakan", () => {
    const c = new IrisMotionCollector(baseline());
    for (let t = 0; t <= 6000; t += 100)
      c.push(
        f(t === 1000 ? 0.7 : t >= 3000 ? 0.02 : t >= 2000 ? 0.25 : 0.1),
        t,
        t,
      );
    expect(c.snapshot().shifts).toBe(2);
    expect(
      c
        .snapshot()
        .windows.map((w) => w.shifts)
        .reduce((a, b) => a + b, 0),
    ).toBe(2);
    expect(irisMotionSchema.safeParse(c.snapshot()).success).toBe(true);
  });
  it("memisahkan perubahan kepala besar dan celah sinyal dari perpindahan iris", () => {
    const c = new IrisMotionCollector(baseline());
    for (let t = 0; t <= 6000; t += 100)
      c.push(f(t < 3000 ? 0.1 : 0.5, t < 3000 ? 0.5 : 0.7), t, t);
    expect(c.snapshot().shifts).toBe(0);
    expect(c.snapshot().headRejectedMs).toBe(100);
    const gap = new IrisMotionCollector(baseline());
    gap.push(f(0.1), 0, 0);
    gap.push(null, 100, 100);
    for (let t = 200; t < 1000; t += 100) gap.push(f(0.5), t, t);
    expect(gap.snapshot().shifts).toBe(0);
  });
  it("jeda frame panjang dan pengamatan pendek tidak menghasilkan hasil yang layak", () => {
    const c = new IrisMotionCollector(baseline());
    c.push(f(), 0, 0);
    c.push(f(0.5), 5000, 5000);
    expect(c.snapshot().validMs).toBe(0);
    expect(
      irisQuality({ observedMs: 6000, trackedMs: 500, motion: c.snapshot() })
        .usable,
    ).toBe(false);
    expect(irisQuality({ observedMs: 1000, trackedMs: 1000 }).usable).toBe(
      false,
    );
  });
  it("membagi waktu pada batas jendela dan menolak ringkasan yang diubah", () => {
    const c = new IrisMotionCollector(baseline());
    c.push(f(), 4900, 4900);
    c.push(f(), 5100, 5100);
    expect(c.snapshot().windows.map((w) => w.validMs)).toEqual([100, 100]);
    expect(
      irisMotionSchema.safeParse({ ...c.snapshot(), shifts: 99 }).success,
    ).toBe(false);
  });
  it("tidak menambah sampel gerak di luar batas jam tes", () => {
    const c = new IrisMotionCollector(baseline());
    for (let t = 0; t <= 6000; t += 100) c.push(f(), t, Math.min(t, 5000));
    expect(c.snapshot().validMs).toBe(5000);
    expect(c.snapshot().windows).toHaveLength(1);
    expect(irisMotionSchema.safeParse(c.snapshot()).success).toBe(true);
  });
  it("posisi yang terus meloncat tanpa bertahan tidak dihitung sebagai posisi stabil", () => {
    const c = new IrisMotionCollector(baseline());
    c.push(f(), 0, 0);
    for (let t = 100; t <= 6000; t += 100)
      c.push(f(t % 200 ? 0.5 : -0.5), t, t);
    expect(c.snapshot().shifts).toBe(0);
  });
});
