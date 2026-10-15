"use server";
import {
  assessmentRecordSchema,
  buildAssessment,
} from "@/lib/screening/assessment";
import { requireChild } from "@/lib/auth/child-guard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MAX_SCREENINGS_PER_DAY } from "@/lib/screening/config";
import { startOfDayIso } from "@/lib/dashboard/metrics";

export async function saveAssessment(
  childId: string,
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = assessmentRecordSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error:
        "Catatan jawaban tidak lengkap atau tidak sesuai. Ulangi penyimpanan.",
    };
  if (!isSupabaseConfigured())
    return { ok: false, error: "Penyimpanan akun belum tersedia." };
  await requireChild(childId);
  const supabase = createClient();
  // Recompute from item responses, never accept client-supplied scores or risk levels.
  buildAssessment(parsed.data.submission);
  const existing = await supabase
    .from("screening_assessments")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("child_id", childId)
    .maybeSingle();
  if (existing.data) return { ok: true };
  const { count, error: countError } = await supabase
    .from("screening_assessments")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .gte("completed_at", startOfDayIso(Date.now()));
  if (countError)
    return {
      ok: false,
      error:
        "Penyimpanan tes baru belum siap di server. Catatan lokal tetap tersedia.",
    };
  if ((count ?? 0) >= MAX_SCREENINGS_PER_DAY)
    return {
      ok: false,
      error: "Batas sesi hari ini tercapai. Catatan lokal tetap tersedia.",
    };
  const { error } = await supabase
    .from("screening_assessments")
    .insert({
      id: parsed.data.id,
      child_id: childId,
      protocol_version: 2,
      responses: parsed.data.submission,
      completed_at: new Date().toISOString(),
    });
  if (error) {
    if (error.code === "23505") {
      const retry = await supabase
        .from("screening_assessments")
        .select("id")
        .eq("id", parsed.data.id)
        .eq("child_id", childId)
        .maybeSingle();
      if (retry.data) return { ok: true };
    }
    return {
      ok: false,
      error: "Hasil belum tersimpan ke akun. Coba simpan lagi.",
    };
  }
  return { ok: true };
}
