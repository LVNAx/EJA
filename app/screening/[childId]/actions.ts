"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { requireChild } from "@/lib/auth/child-guard";
import { MAX_SCREENINGS_PER_DAY } from "@/lib/screening/config";
import { evaluateSessionQuality, sanitizeTimings, type ResponseTimings } from "@/lib/screening/quality";
import { calculateRiskScore, clamp01, type RiskLevel, type ScreeningScores } from "@/lib/screening/scoring";
import { startOfDayIso } from "@/lib/dashboard/metrics";

export interface SaveResult {
  ok: boolean;
  error?: string;
  /** false = sesi ditandai tidak valid (tetap tersimpan; orang tua melihat alasannya). Tidak pernah ditampilkan ke anak. */
  valid?: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
}

// Skor dan mutu sesi dihitung ulang di server — klien hanya mengirim skor per tes dan waktu respons.
export async function saveScreening(childId: string, raw: ScreeningScores, rawTimings?: Partial<ResponseTimings>): Promise<SaveResult> {
  const scores: ScreeningScores = {
    phonological: clamp01(raw.phonological),
    rapidNaming: clamp01(raw.rapidNaming),
    spelling: clamp01(raw.spelling),
    digitSpan: clamp01(raw.digitSpan),
  };
  const { riskScore, riskLevel } = calculateRiskScore(scores);
  const quality = evaluateSessionQuality(sanitizeTimings(rawTimings));

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase belum dikonfigurasi", valid: quality.valid, riskScore, riskLevel };
  }

  await requireChild(childId);
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Belum login", riskScore, riskLevel };

  // RLS memastikan hanya anak milik parent ini yang bisa terbaca.
  const { data: child } = await supabase.from("children").select("id").eq("id", childId).maybeSingle();
  if (!child) return { ok: false, error: "Profil anak tidak ditemukan", riskScore, riskLevel };

  // BR-04: ulang sesi dibatasi per hari per anak. Diperiksa di server, bukan hanya di halaman.
  const { count } = await supabase.from("screening_sessions").select("id", { count: "exact", head: true }).eq("child_id", childId).gte("completed_at", startOfDayIso(Date.now()));
  if ((count ?? 0) >= MAX_SCREENINGS_PER_DAY) return { ok: false, error: "Batas sesi skrining hari ini sudah tercapai. Coba lagi besok", riskScore, riskLevel };

  const { error } = await supabase.from("screening_sessions").insert({
    child_id: childId,
    phonological_score: scores.phonological,
    rapid_naming_score: scores.rapidNaming,
    spelling_score: scores.spelling,
    digit_span_score: scores.digitSpan,
    risk_score: riskScore,
    risk_level: riskLevel,
    is_valid: quality.valid,
    invalid_reason: quality.reason,
    completed_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message, valid: quality.valid, riskScore, riskLevel };
  return { ok: true, valid: quality.valid, riskScore, riskLevel };
}
