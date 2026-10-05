import { describe, expect, it } from "vitest";
import { childNext, signChildSession, verifyChildSession } from "./child-session";
const P = "11111111-1111-1111-1111-111111111111";
const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
describe("sesi anak", () => {
  it("terikat ke parent, child, tanda tangan dan masa berlaku", async () => {
    const token = (await signChildSession(P, A, 1000))!;
    expect(await verifyChildSession(token, P, A, 1001)).toBe(true);
    expect(await verifyChildSession(token, P, B, 1001)).toBe(false);
    expect(await verifyChildSession(token, B, A, 1001)).toBe(false);
    expect(await verifyChildSession(token + "x", P, A, 1001)).toBe(false);
    expect(await verifyChildSession(token, P, A, 1000 + 8*60*60*1000)).toBe(false);
  });
  it("redirect PIN hanya menuju profil sendiri", () => {
    const home = `/child/${A}`;
    for (const path of ["https://evil.test", "//evil.test", "/dashboard", `/child/${B}`, `/child/${A}other`, `/child/${A}/../../dashboard`, `/child/${A}/%2e%2e/%2e%2e/dashboard`, `/screening/${A}/result`]) expect(childNext(path,A)).toBe(home);
    expect(childNext(`${home}/belajar?x=1`,A)).toBe(`${home}/belajar?x=1`);
    expect(childNext(`/screening/${A}`,A)).toBe(`/screening/${A}`);
  });
});
