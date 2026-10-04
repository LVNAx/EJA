"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { calculateRiskScore, clamp01, type RiskLevel, type ScreeningScores } from "@/lib/screening/scoring";

export interface SaveResult {
  ok: boolean;
  error?: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

// Skor dihitung ulang di server — klien hanya mengirim skor per tes.
export async function saveScreening(childId: string, raw: ScreeningScores): Promise<SaveResult> {
  const scores: ScreeningScores = {
    phonological: clamp01(raw.phonological),
    rapidNaming: clamp01(raw.rapidNaming),
    spelling: clamp01(raw.spelling),
    digitSpan: clamp01(raw.digitSpan),
  };
  const { riskScore, riskLevel } = calculateRiskScore(scores);

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase belum dikonfigurasi", riskScore, riskLevel };
  }

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Belum login", riskScore, riskLevel };

  // RLS memastikan hanya anak milik parent ini yang bisa terbaca.
  const { data: child } = await supabase.from("children").select("id").eq("id", childId).maybeSingle();
  if (!child) return { ok: false, error: "Profil anak tidak ditemukan", riskScore, riskLevel };

  const { error } = await supabase.from("screening_sessions").insert({
    child_id: childId,
    phonological_score: scores.phonological,
    rapid_naming_score: scores.rapidNaming,
    spelling_score: scores.spelling,
    digit_span_score: scores.digitSpan,
    risk_score: riskScore,
    risk_level: riskLevel,
    completed_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message, riskScore, riskLevel };
  return { ok: true, riskScore, riskLevel };
}
