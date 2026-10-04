"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireParentUnlock } from "@/lib/auth/guard";
import type { FormState } from "@/lib/auth/actions";
import { isAvatar } from "@/lib/avatars";
import { ROUTES } from "@/lib/routes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string).trim() : "");

/** FR-04: profil anak berisi nama, kelas 1-6, sekolah, avatar, dan PIN 4 angka (disimpan sebagai hash bcrypt). */
export async function createChild(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: "Pembuatan profil belum aktif: Supabase belum dikonfigurasi di server ini." };

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(ROUTES.login);
  await requireParentUnlock(auth.user.id, ROUTES.addChild);

  const name = str(form, "name");
  const grade = Number(str(form, "grade"));
  const school = str(form, "school");
  const avatar = str(form, "avatar");
  const pin = str(form, "pin");
  const pinConfirm = str(form, "pinConfirm");

  if (name.length < 1 || name.length > 60) return { error: "Isi nama anak (maksimal 60 huruf)." };
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) return { error: "Pilih kelas 1 sampai 6. Skrining hanya untuk siswa SD kelas 1–6." };
  if (school.length > 120) return { error: "Nama sekolah terlalu panjang." };
  if (!isAvatar(avatar)) return { error: "Pilih salah satu avatar." };
  if (!/^\d{4}$/.test(pin)) return { error: "PIN harus 4 angka." };
  if (pin !== pinConfirm) return { error: "PIN dan konfirmasi PIN tidak sama." };

  const pin_hash = await bcrypt.hash(pin, 10);
  const { data, error } = await supabase.from("children").insert({ parent_id: auth.user.id, name, grade, school: school || null, avatar, pin_hash }).select("id").single();
  if (error || !data) return { error: "Profil belum tersimpan. Coba lagi sebentar lagi." };

  redirect(ROUTES.childDashboard(data.id));
}
