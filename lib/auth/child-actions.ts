"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { requireParentUnlock } from "./guard";
import type { FormState } from "./actions";
import { UNLOCK_COOKIE } from "./unlock";
import { CHILD_COOKIE, childCookieOptions, childNext, isChildId, signChildSession } from "./child-session";

const resultSchema = z.object({ ok: z.boolean(), status: z.enum(["ok", "invalid", "locked"]), retry_after_seconds: z.number().optional() });

export async function enterChild(_prev: FormState, form: FormData): Promise<FormState> {
  const childId = String(form.get("childId") ?? "");
  const pin = String(form.get("pin") ?? "");
  const next = childNext(String(form.get("next") ?? ""), childId);
  if (!isSupabaseConfigured()) return { error: "PIN belum aktif dalam mode demo." };
  if (!isChildId(childId) || !/^\d{4}$/.test(pin)) return { error: "Pilih avatar dan isi PIN 4 angka." };
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=%2Fmasuk-anak");
  const { data, error } = await supabase.rpc("verify_child_pin", { p_child_id: childId, p_pin: pin });
  const result = resultSchema.safeParse(data);
  if (error || !result.success) return { error: "PIN belum dapat diperiksa. Coba lagi sebentar." };
  if (!result.data.ok) return { error: result.data.status === "locked" ? `Terlalu banyak percobaan. Tunggu ${Math.max(1, Math.ceil((result.data.retry_after_seconds ?? 900) / 60))} menit.` : "PIN belum cocok. Coba lagi." };
  const token = await signChildSession(auth.user.id, childId);
  if (!token) return { error: "Konfigurasi sesi server belum lengkap." };
  cookies().set(CHILD_COOKIE, token, childCookieOptions());
  cookies().delete(UNLOCK_COOKIE);
  redirect(next);
}

export async function leaveChild(): Promise<void> {
  cookies().delete(CHILD_COOKIE);
  redirect("/masuk-anak");
}

export async function resetChildPin(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: "PIN belum aktif dalam mode demo." };
  const childId = String(form.get("childId") ?? "");
  const pin = String(form.get("pin") ?? "");
  if (!isChildId(childId) || !/^\d{4}$/.test(pin)) return { error: "PIN harus 4 angka." };
  if (pin !== String(form.get("pinConfirm") ?? "")) return { error: "Konfirmasi PIN tidak sama." };
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  await requireParentUnlock(auth.user.id);
  const { data, error } = await supabase.rpc("set_child_pin", { p_child_id: childId, p_pin: pin });
  if (error || data !== true) return { error: "PIN belum dapat diganti." };
  cookies().delete(CHILD_COOKIE);
  return { info: "PIN baru tersimpan. Anak dapat masuk kembali." };
}
