import { afterEach, describe, expect, it, vi } from "vitest";
import { safeNext, signUnlock, verifyUnlock } from "./unlock";

const U1 = "11111111-1111-1111-1111-111111111111";
const U2 = "22222222-2222-2222-2222-222222222222";
const NOW = 1_800_000_000_000;

afterEach(() => vi.unstubAllEnvs());

describe("cookie buka-kunci", () => {
  it("token valid untuk pengguna yang sama sebelum kedaluwarsa", async () => {
    const t = await signUnlock(U1, NOW);
    expect(await verifyUnlock(t, U1, NOW + 1000)).toBe(true);
  });

  it("ditolak setelah kedaluwarsa", async () => {
    const t = await signUnlock(U1, NOW, 60_000);
    expect(await verifyUnlock(t, U1, NOW + 60_001)).toBe(false);
  });

  it("ditolak untuk pengguna lain (tidak bisa dipakai lintas akun)", async () => {
    const t = await signUnlock(U1, NOW);
    expect(await verifyUnlock(t, U2, NOW + 1000)).toBe(false);
  });

  it("ditolak bila dipalsukan: masa berlaku diperpanjang atau tanda tangan diganti", async () => {
    const t = (await signUnlock(U1, NOW, 60_000))!;
    const [uid, exp, sig] = t.split(".");
    expect(await verifyUnlock(`${uid}.${Number(exp) + 9_999_999}.${sig}`, U1, NOW + 1000)).toBe(false);
    expect(await verifyUnlock(`${uid}.${exp}.${"0".repeat(sig.length)}`, U1, NOW + 1000)).toBe(false);
    expect(await verifyUnlock("sampah", U1, NOW)).toBe(false);
    expect(await verifyUnlock(undefined, U1, NOW)).toBe(false);
  });

  it("ditolak bila secret berbeda", async () => {
    vi.stubEnv("PARENT_UNLOCK_SECRET", "secret-aaaaaaaaaaaaaaaa");
    const t = await signUnlock(U1, NOW);
    vi.stubEnv("PARENT_UNLOCK_SECRET", "secret-bbbbbbbbbbbbbbbb");
    expect(await verifyUnlock(t, U1, NOW + 1000)).toBe(false);
  });

  it("produksi tanpa secret: gagal tertutup (tidak pernah memberi akses)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PARENT_UNLOCK_SECRET", "");
    expect(await signUnlock(U1, NOW)).toBeNull();
    expect(await verifyUnlock("apa.pun.saja", U1, NOW)).toBe(false);
  });
});

describe("safeNext", () => {
  it("hanya menerima jalur di dalam situs", () => {
    expect(safeNext("/dashboard/child/1")).toBe("/dashboard/child/1");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});
