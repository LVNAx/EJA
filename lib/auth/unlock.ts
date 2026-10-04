// Kunci dasbor orang tua (poin "dasbor belum terlindungi dari sesi anak").
//
// Anak masuk di bawah SESI SUPABASE orang tua, jadi sesi saja tidak membedakan orang tua dari anak.
// Karena itu dasbor butuh bukti kedua: cookie "buka-kunci" bertanda tangan HMAC yang diberikan saat orang tua
// login atau memasukkan ulang kata sandi, dan dicabut saat orang tua menyerahkan perangkat ke anak.
// Desain dibalik dengan sengaja: bila anak menghapus cookie lewat devtools, dasbor justru TERKUNCI.
// Memalsukan cookie butuh PARENT_UNLOCK_SECRET. Berkas ini aman untuk Edge (Web Crypto saja).

export const UNLOCK_COOKIE = "eja_parent_unlock";
export const UNLOCK_TTL_MS = 30 * 60 * 1000;

const enc = new TextEncoder();

/** Secret wajib di produksi; di pengembangan ada nilai bawaan supaya `npm run dev` langsung jalan. */
export function unlockSecret(): string | null {
  const s = process.env.PARENT_UNLOCK_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-secret-do-not-use-in-production";
  return null;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Token terikat ke satu pengguna, jadi tidak bisa dipakai lintas akun. */
export async function signUnlock(userId: string, now = Date.now(), ttlMs = UNLOCK_TTL_MS): Promise<string | null> {
  const secret = unlockSecret();
  if (!secret) return null;
  const exp = now + ttlMs;
  return `${userId}.${exp}.${await hmacHex(secret, `${userId}.${exp}`)}`;
}

export async function verifyUnlock(token: string | undefined | null, userId: string, now = Date.now()): Promise<boolean> {
  const secret = unlockSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [uid, expStr, sig] = parts;
  const exp = Number(expStr);
  if (uid !== userId || !Number.isFinite(exp) || exp <= now) return false;
  return safeEqual(sig, await hmacHex(secret, `${uid}.${expStr}`));
}

export const unlockCookieOptions = (maxAgeMs = UNLOCK_TTL_MS) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: Math.floor(maxAgeMs / 1000),
});

/** Hanya izinkan tujuan di dalam situs (cegah open redirect lewat ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
