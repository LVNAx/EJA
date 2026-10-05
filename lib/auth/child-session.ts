import { signUnlock, verifyUnlock, unlockCookieOptions } from "./unlock";

export const CHILD_COOKIE = "eja_child_session";
export const CHILD_TTL_MS = 8 * 60 * 60 * 1000;
export const isChildId = (id: string): boolean => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);

export function signChildSession(parentId: string, childId: string, now = Date.now()) {
  return signUnlock(`child:${parentId}:${childId}`, now, CHILD_TTL_MS);
}
export function verifyChildSession(token: string | undefined, parentId: string, childId: string, now = Date.now()) {
  return verifyUnlock(token, `child:${parentId}:${childId}`, now);
}
export const childCookieOptions = () => unlockCookieOptions(CHILD_TTL_MS);

export function childLoginHref(childId?: string, next?: string) {
  const query = new URLSearchParams();
  if (childId) query.set("child", childId);
  if (next) query.set("next", next);
  return `/masuk-anak${query.size ? `?${query.toString()}` : ""}`;
}

// PIN hanya boleh mengarahkan anak ke profilnya sendiri, bukan ke dasbor/akun lain.
export function childNext(next: string | null | undefined, childId: string) {
  const home = `/child/${encodeURIComponent(childId)}`;
  if (!next || next.includes("\\") || /[\u0000-\u0020]/.test(next)) return home;
  try {
    const url = new URL(next, "https://eja.invalid");
    const path = decodeURIComponent(url.pathname);
    const child = `/child/${childId}`;
    const screening = `/screening/${childId}`;
    if (url.origin === "https://eja.invalid" && (path === child || path.startsWith(`${child}/`) || path === screening)) return url.pathname + url.search;
  } catch { /* Tujuan tidak valid menggunakan beranda anak. */ }
  return home;
}
