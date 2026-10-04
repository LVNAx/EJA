import { redirect } from "next/navigation";
import { AppShell } from "@/features/learning/components/app-shell";
import { openDyslexic } from "@/features/learning/font";
import { learningHome } from "@/features/learning/paths";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import "@/features/learning/styles/base.css";
import "@/features/learning/styles/literacy.css";
import "@/features/learning/styles/brand.css";

export const metadata = { title: "Belajar — EJA", robots: { index: false } };

export default async function LearningLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { childId: string };
}) {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user)
      redirect(`/login?next=${encodeURIComponent(learningHome(params.childId))}`);
    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("id", params.childId)
      .maybeSingle();
    if (!child) redirect("/dashboard");
  }

  return (
    <div className={`learning-root ${openDyslexic.variable}`}>
      <AppShell childId={params.childId}>{children}</AppShell>
    </div>
  );
}
