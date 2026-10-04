"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";
import { UNLOCK_COOKIE, safeNext, signUnlock, unlockCookieOptions } from "./unlock";

export interface FormState {
  error?: string;
  info?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOT_CONFIGURED: FormState = { error: "Autentikasi belum aktif: Supabase belum dikonfigurasi di server ini." };

async function grantUnlock(userId: string): Promise<boolean> {
  const token = await signUnlock(userId);
  if (!token) return false;
  cookies().set(UNLOCK_COOKIE, token, unlockCookieOptions());
  return true;
}

const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string).trim() : "");

/** FR-01, FR-03: email unik, sandi minimal 8 karakter, persetujuan wajib dan waktunya dicatat. */
export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const name = str(form, "name");
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const consent = form.get("consent") === "on";

  if (name.length < 2) return { error: "Isi nama Anda." };
  if (!EMAIL_RE.test(email)) return { error: "Alamat email belum benar." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (!consent) return { error: "Anda perlu menyetujui kebijakan privasi dan persetujuan orang tua untuk melanjutkan." };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, consent_at: new Date().toISOString(), consent_scope: "privasi+persetujuan-orang-tua" } },
  });

  const exists = data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
  if (exists || error?.message.toLowerCase().includes("already registered")) return { error: "Email ini sudah terdaftar. Silakan masuk." };
  if (error) return { error: "Pendaftaran belum berhasil. Coba lagi sebentar lagi." };

  // Konfirmasi email dimatikan: sesi langsung ada. Bila dinyalakan, minta orang tua memeriksa email.
  if (data.session && data.user) {
    if (!(await grantUnlock(data.user.id))) return { error: "Konfigurasi server belum lengkap (PARENT_UNLOCK_SECRET)." };
    redirect(ROUTES.dashboard);
  }
  return { info: "Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke email Anda. Buka tautan itu, lalu masuk." };
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(str(form, "next"));
  if (!EMAIL_RE.test(email) || !password) return { error: "Isi email dan kata sandi." };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error?.message.toLowerCase().includes("not confirmed")) return { error: "Email belum dikonfirmasi. Buka tautan konfirmasi di email Anda." };
    // Pesan sama untuk email tidak ada dan sandi salah, agar tidak membocorkan siapa yang terdaftar.
    return { error: "Email atau kata sandi salah." };
  }
  if (!(await grantUnlock(data.user.id))) return { error: "Konfigurasi server belum lengkap (PARENT_UNLOCK_SECRET)." };
  redirect(next);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) await createClient().auth.signOut();
  cookies().delete(UNLOCK_COOKIE);
  redirect("/");
}

/** Orang tua memasukkan ulang kata sandi untuk membuka dasbor setelah perangkat dipakai anak. */
export async function unlockDashboard(_prev: FormState, form: FormData): Promise<FormState> {
  const next = safeNext(str(form, "next"));
  if (!isSupabaseConfigured()) redirect(next);

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) redirect(ROUTES.login);

  const password = String(form.get("password") ?? "");
  if (!password) return { error: "Isi kata sandi Anda." };
  const { error } = await supabase.auth.signInWithPassword({ email: data.user.email, password });
  if (error) return { error: "Kata sandi salah." };

  if (!(await grantUnlock(data.user.id))) return { error: "Konfigurasi server belum lengkap (PARENT_UNLOCK_SECRET)." };
  redirect(next);
}

/**
 * Orang tua menyerahkan perangkat ke anak: cabut buka-kunci dasbor lalu arahkan ke area anak.
 * Setelah ini, membuka /dashboard meminta kata sandi orang tua lagi.
 */
export async function lockForChild(childId: string, kind: "screening" | "home"): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect(ROUTES.login);
    // RLS: hanya anak milik orang tua ini yang terbaca.
    const { data: child } = await supabase.from("children").select("id").eq("id", childId).maybeSingle();
    if (!child) redirect(ROUTES.dashboard);
    cookies().delete(UNLOCK_COOKIE);
  }
  redirect(kind === "screening" ? ROUTES.screening(childId) : ROUTES.childHome(childId));
}
