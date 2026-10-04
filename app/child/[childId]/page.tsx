import { notFound, redirect } from "next/navigation";
import { ChildDashboard } from "@/components/child/ChildDashboard";
import { buildDemoData } from "@/lib/dashboard/fixtures";
import { ROUTES } from "@/lib/routes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { openDyslexic } from "@/features/learning/font";
import type { ChildProfile } from "@/lib/dashboard/types";

export const metadata = { title: "Dasbor Anak — EJA", robots: { index: false } };
export const dynamic = "force-dynamic";

// Hanya profil dikirim ke klien. Skor dan tingkat risiko milik orang tua.
export default async function ChildHomePage({ params }: { params: { childId: string } }) {
  const demo = !isSupabaseConfigured();
  let profile: ChildProfile | undefined;
  if (!demo) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.childHome(params.childId))}`);
    const { data: child, error } = await supabase.from("children").select("id,name,grade,school,avatar").eq("id", params.childId).maybeSingle();
    if (error) throw new Error("Profil anak belum dapat dimuat. Coba lagi.");
    if (!child) notFound();
    profile = child as ChildProfile;
  } else {
    profile = buildDemoData(Date.now()).find((c) => c.profile.id === params.childId)?.profile;
    if (!profile) notFound();
  }
  return <div className={openDyslexic.variable}><ChildDashboard profile={profile} demo={demo} /></div>;
}
