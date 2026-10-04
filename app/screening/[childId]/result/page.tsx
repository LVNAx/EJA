import { redirect } from "next/navigation";
import { DemoResult } from "@/components/screening/ScreeningResult";
import { DEMO_CHILD_ID, ROUTES } from "@/lib/routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

// Hasil anak sungguhan hanya untuk orang tua, di dasbor (FR-19, FR-20). Halaman ini hanya melayani tes demo publik.
export default function ResultPage({ params }: { params: { childId: string } }) {
  if (params.childId !== DEMO_CHILD_ID && isSupabaseConfigured()) redirect(ROUTES.childScreeningReport(params.childId));
  return <DemoResult childId={params.childId} />;
}
