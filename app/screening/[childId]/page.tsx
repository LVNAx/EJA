import { redirect } from "next/navigation";
import { ScreeningFlow } from "@/components/screening/ScreeningFlow";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function ScreeningPage({ params }: { params: { childId: string } }) {
  let childName = "Teman";

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login");
    // RLS: hanya anak milik parent yang login yang bisa terbaca.
    const { data: child } = await supabase.from("children").select("name").eq("id", params.childId).maybeSingle();
    if (!child) redirect("/dashboard");
    childName = child.name;
  }

  return <ScreeningFlow childId={params.childId} childName={childName} />;
}
