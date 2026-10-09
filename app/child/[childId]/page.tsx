import { ChildDashboard } from "@/components/child/ChildDashboard";
import { requireChild } from "@/lib/auth/child-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
export const metadata = { title: "Dasbor Anak", robots: { index: false } };
export default async function ChildHomePage({ params }: { params: { childId: string } }) {
  const profile = await requireChild(params.childId);
  return <ChildDashboard profile={profile} demo={!isSupabaseConfigured()} />;
}
