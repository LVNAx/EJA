import { redirect } from "next/navigation";
import { requireParentUnlock } from "@/lib/auth/guard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";
import { buildDemoData } from "./fixtures";
import { CHILD_COLUMNS, fetchChildData, toProfile } from "./fetch";
import type { ChildData } from "./types";

export interface DashboardData {
  /** true = Supabase belum dikonfigurasi, data adalah contoh. */
  demo: boolean;
  now: number;
  children: ChildData[];
  /** Id notifikasi yang sudah dibuka orang tua. */
  readIds: string[];
  /** Orang tua menerima notifikasi lewat email (default aktif). */
  emailNotifications: boolean;
}

async function loadFromSupabase(now: number, onlyChildId?: string): Promise<Pick<DashboardData, "children" | "readIds" | "emailNotifications">> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(ROUTES.login);
  await requireParentUnlock(auth.user.id);

  // RLS membatasi ke anak milik orang tua yang login; .eq hanya mempersempit.
  let q = supabase.from("children").select(CHILD_COLUMNS).order("name");
  if (onlyChildId) q = q.eq("id", onlyChildId);
  const [{ data: kids }, { data: reads }] = await Promise.all([q, supabase.from("notification_reads").select("notification_id").limit(500)]);

  const children = await fetchChildData(supabase, (kids ?? []).map((k) => toProfile(k as Record<string, unknown>)), now);
  return {
    children,
    readIds: (reads ?? []).map((r) => String((r as { notification_id: unknown }).notification_id)),
    emailNotifications: auth.user.user_metadata?.email_notifications !== false,
  };
}

/** Semua anak milik orang tua yang login (atau data contoh bila Supabase belum dikonfigurasi). */
export async function loadDashboard(): Promise<DashboardData> {
  const now = Date.now();
  if (!isSupabaseConfigured()) return { demo: true, now, children: buildDemoData(now), readIds: [], emailNotifications: true };
  return { demo: false, now, ...(await loadFromSupabase(now)) };
}

/** Satu anak, atau null bila bukan milik orang tua ini. */
export async function loadChild(childId: string): Promise<{ demo: boolean; now: number; child: ChildData | null; readIds: string[] }> {
  const now = Date.now();
  if (!isSupabaseConfigured()) return { demo: true, now, child: buildDemoData(now).find((c) => c.profile.id === childId) ?? null, readIds: [] };
  const r = await loadFromSupabase(now, childId);
  return { demo: false, now, child: r.children[0] ?? null, readIds: r.readIds };
}
