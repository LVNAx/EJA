"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireParentUnlock } from "@/lib/auth/guard";
import { safeNext } from "@/lib/auth/unlock";
import { ROUTES } from "@/lib/routes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Menandai notifikasi sudah dibaca lalu membuka tujuannya. Berupa <form> server action, jadi bekerja tanpa JavaScript. */
export async function openNotification(notificationId: string, href: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect(ROUTES.login);
    await requireParentUnlock(auth.user.id);
    // Upsert: membuka dua kali tidak menimbulkan galat. RLS memastikan parent_id milik sendiri.
    await supabase.from("notification_reads").upsert({ parent_id: auth.user.id, notification_id: notificationId.slice(0, 200) }, { onConflict: "parent_id,notification_id", ignoreDuplicates: true });
    revalidatePath(ROUTES.dashboard, "layout");
  }
  redirect(safeNext(href, ROUTES.dashboard));
}

/** Menyalakan atau mematikan email notifikasi. Disimpan di metadata akun orang tua. */
export async function setEmailNotifications(enabled: boolean): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect(ROUTES.login);
    await requireParentUnlock(auth.user.id);
    await supabase.auth.updateUser({ data: { email_notifications: enabled } });
    revalidatePath(ROUTES.dashboard, "layout");
  }
}
