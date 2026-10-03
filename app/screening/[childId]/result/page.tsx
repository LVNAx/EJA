import { redirect } from "next/navigation";
import { ScreeningResult, type ResultData } from "@/components/screening/ScreeningResult";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { RiskLevel } from "@/lib/screening/scoring";

export default async function ResultPage({ params }: { params: { childId: string } }) {
  let childName = "Anak";
  let initial: ResultData | null = null;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login");

    const { data: child } = await supabase.from("children").select("name").eq("id", params.childId).maybeSingle();
    if (!child) redirect("/dashboard");
    childName = child.name;

    const { data: s } = await supabase
      .from("screening_sessions")
      .select("phonological_score, rapid_naming_score, spelling_score, digit_span_score, risk_score, risk_level")
      .eq("child_id", params.childId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (s) {
      initial = {
        scores: { phonological: s.phonological_score, rapidNaming: s.rapid_naming_score, spelling: s.spelling_score, digitSpan: s.digit_span_score },
        riskScore: s.risk_score,
        riskLevel: s.risk_level as RiskLevel,
      };
    }
  }

  return <ScreeningResult childId={params.childId} childName={childName} initial={initial} />;
}
