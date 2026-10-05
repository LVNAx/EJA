import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHILD_COOKIE, signChildSession } from "./child-session";
import { UNLOCK_COOKIE, signUnlock } from "./unlock";

// Menguji keputusan middleware dengan sesi Supabase yang di-mock: siapa yang boleh membuka /dashboard.
const state: { user: { id: string } | null; refresh: boolean } = { user: null, refresh: false };
vi.mock("@/lib/supabase/middleware", () => ({ updateSession: async () => ({ response: () => { const r = NextResponse.next(); if (state.refresh) {r.cookies.set("sb-refreshed", "new-session");r.headers.set("cache-control", "private, no-store");} return r; }, user: state.user }) }));

const { middleware } = await import("../../middleware");

const U = "11111111-1111-1111-1111-111111111111";
const req = (path: string, cookie?: string) => new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });
const location = (r: Response) => (r.headers.get("location") ? new URL(r.headers.get("location")!).pathname + new URL(r.headers.get("location")!).search : null);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  state.user = null;
  state.refresh = false;
});
afterEach(() => vi.unstubAllEnvs());

describe("middleware: kunci dasbor orang tua", () => {
  it("tanpa Supabase (mode demo) tidak menjaga apa pun", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const r = await middleware(req("/dashboard"));
    expect(r.headers.get("location")).toBeNull();
  });

  it("belum login: /dashboard diarahkan ke /login dengan ?next", async () => {
    const r = await middleware(req("/dashboard/child/abc"));
    expect(location(r)).toBe("/login?next=%2Fdashboard%2Fchild%2Fabc");
  });

  it("sudah login tetapi tanpa cookie buka-kunci (mis. perangkat dipegang anak): diarahkan ke /unlock", async () => {
    state.user = { id: U };
    const r = await middleware(req("/dashboard"));
    expect(location(r)).toBe("/unlock?next=%2Fdashboard");
  });

  it("cookie dipalsukan, kedaluwarsa, atau milik akun lain: tetap ke /unlock", async () => {
    state.user = { id: U };
    expect(location(await middleware(req("/dashboard", `${UNLOCK_COOKIE}=${U}.9999999999999.${"a".repeat(64)}`)))).toBe("/unlock?next=%2Fdashboard");
    const expired = await signUnlock(U, Date.now() - 10 * 60_000, 60_000);
    expect(location(await middleware(req("/dashboard", `${UNLOCK_COOKIE}=${expired}`)))).toBe("/unlock?next=%2Fdashboard");
    const other = await signUnlock("22222222-2222-2222-2222-222222222222");
    expect(location(await middleware(req("/dashboard", `${UNLOCK_COOKIE}=${other}`)))).toBe("/unlock?next=%2Fdashboard");
  });

  it("cookie sah: lolos dan masa berlakunya diperpanjang", async () => {
    state.user = { id: U };
    const token = await signUnlock(U);
    const r = await middleware(req("/dashboard/compare", `${UNLOCK_COOKIE}=${token}`));
    expect(r.headers.get("location")).toBeNull();
    expect(r.headers.get("set-cookie")).toContain(UNLOCK_COOKIE);
    expect(r.headers.get("set-cookie")?.toLowerCase()).toContain("httponly");
  });

  it("redirect mempertahankan refresh cookies dan no-store", async () => {
    state.user = { id: U };
    state.refresh = true;
    const r = await middleware(req("/dashboard"));
    expect(r.headers.get("set-cookie")).toContain("sb-refreshed");
    expect(r.headers.get("cache-control")).toBe("private, no-store");
  });

  it("area anak membutuhkan PIN dan tidak mengizinkan pindah profil", async () => {
    state.user = { id: U };
    const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    expect(location(await middleware(req(`/child/${id}`)))).toContain("/masuk-anak?");
    const token = await signChildSession(U, id);
    expect(location(await middleware(req(`/child/${id}/belajar`, `${CHILD_COOKIE}=${token}`)))).toBeNull();
    expect(location(await middleware(req(`/screening/${id}`, `${CHILD_COOKIE}=${token}`)))).toBeNull();
    expect(location(await middleware(req("/child/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", `${CHILD_COOKIE}=${token}`)))).toContain("/masuk-anak?");
    expect(location(await middleware(req("/screening/demo")))).toBeNull();
  });

  it("sudah login: /login dan /daftar diarahkan ke dasbor", async () => {
    state.user = { id: U };
    expect(location(await middleware(req("/login")))).toBe("/masuk-anak");
    expect(location(await middleware(req("/daftar")))).toBe("/masuk-anak");
  });
});
