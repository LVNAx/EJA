import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { buildDemoData } from "@/lib/dashboard/fixtures";
import type { ChildProfile } from "@/lib/dashboard/types";
import { CHILD_COOKIE, childLoginHref, isChildId, verifyChildSession } from "./child-session";

// Layout dan server actions sama-sama mengecek cookie; layout saja tidak melindungi actions.
export const requireChild = cache(async (childId: string): Promise<ChildProfile> => {
  if (!isSupabaseConfigured()) {
    const profile = buildDemoData(Date.now()).find((c) => c.profile.id === childId)?.profile;
    if (!profile) notFound();
    return profile;
  }
  if (!isChildId(childId)) notFound();
  const supabase = createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect(`/login?next=${encodeURIComponent(childLoginHref(childId))}`);
  if (!(await verifyChildSession(cookies().get(CHILD_COOKIE)?.value, auth.user.id, childId))) redirect(childLoginHref(childId));
  const { data, error } = await supabase.from("children").select("id,name,grade,school,avatar").eq("id", childId).eq("parent_id", auth.user.id).maybeSingle();
  if (error) throw new Error("Profil anak belum dapat dimuat. Coba lagi.");
  if (!data) notFound();
  return data as ChildProfile;
});
