import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ChildLoginForm } from "@/components/auth/ChildLoginForm";
import { buildDemoData } from "@/lib/dashboard/fixtures";
import type { ChildProfile } from "@/lib/dashboard/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk Anak", robots: { index: false } };
export default async function ChildLoginPage({ searchParams }: { searchParams: { child?: string; next?: string } }) {
  const demo = !isSupabaseConfigured();
  let children: ChildProfile[];
  if (demo) children = buildDemoData(Date.now()).map((child) => child.profile);
  else {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login?next=%2Fmasuk-anak");
    const { data, error } = await supabase.from("children").select("id,name,grade,school,avatar").eq("parent_id", auth.user.id).order("name");
    if (error) throw new Error("Profil anak belum dapat dimuat. Coba lagi.");
    children = (data ?? []) as ChildProfile[];
  }
  return <AuthShell title="Ayo masuk!" subtitle="Pilih avatarmu, lalu isi PIN."><ChildLoginForm profiles={children} selectedId={searchParams.child} next={searchParams.next} demo={demo} /></AuthShell>;
}
