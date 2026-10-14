import { ChildDashboard } from "@/components/child/ChildDashboard";
import { requireChild } from "@/lib/auth/child-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DEMO_CHILD_ID, ROUTES } from "@/lib/routes";
export const metadata = { title: "Dasbor Anak", robots: { index: false } };
export default async function ChildHomePage({ params }: { params: { childId: string } }) {
  if (params.childId === DEMO_CHILD_ID) redirect(ROUTES.learningDemo);
  const profile = await requireChild(params.childId);
  return <ChildDashboard profile={profile} demo={!isSupabaseConfigured()} />;
}
