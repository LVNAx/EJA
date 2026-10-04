import { requireChild } from "@/lib/auth/child-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { openDyslexic } from "@/features/learning/font";

export async function ChildAreaLayout({ childId, allowPublicDemo = false, children }: { childId: string; allowPublicDemo?: boolean; children: React.ReactNode }) {
  if (!(allowPublicDemo && childId === "demo") && isSupabaseConfigured()) await requireChild(childId);
  return <div className={openDyslexic.variable}>{children}</div>;
}
