import Link from "next/link";
import { redirect } from "next/navigation";
import { Moon } from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { ScreeningFlow } from "@/components/screening/ScreeningFlow";
import { startOfDayIso } from "@/lib/dashboard/metrics";
import { MAX_SCREENINGS_PER_DAY } from "@/lib/screening/config";
import { ROUTES, DEMO_CHILD_ID } from "@/lib/routes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function ScreeningPage({ params }: { params: { childId: string } }) {
  // "demo" = tes dari halaman depan tanpa akun, tidak menyentuh database.
  const demo = params.childId === DEMO_CHILD_ID || !isSupabaseConfigured();
  let childName = "Teman";

  if (!demo) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.screening(params.childId))}`);
    // RLS: hanya anak milik parent yang login yang bisa terbaca.
    const { data: child } = await supabase.from("children").select("name").eq("id", params.childId).maybeSingle();
    if (!child) redirect(ROUTES.dashboard);
    childName = child.name;

    // BR-04: batas sesi per hari. Teks untuk anak tidak menyinggung hasil atau status.
    const { count } = await supabase.from("screening_sessions").select("id", { count: "exact", head: true }).eq("child_id", params.childId).gte("completed_at", startOfDayIso(Date.now()));
    if ((count ?? 0) >= MAX_SCREENINGS_PER_DAY) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-6">
          <AuroraBackground />
          <div className="card flex flex-col items-center gap-5 p-8 text-center">
            <Moon size={48} className="text-brand-500" strokeWidth={1.8} aria-hidden="true" />
            <h1 className="text-2xl font-bold">Cukup main hari ini, {childName}!</h1>
            <p className="text-neutral-600">Kita main lagi besok ya.</p>
            <Link href={ROUTES.childHome(params.childId)} className="btn-primary w-full">Kembali</Link>
          </div>
        </main>
      );
    }
  }

  return <ScreeningFlow childId={params.childId} childName={childName} demo={demo} />;
}
