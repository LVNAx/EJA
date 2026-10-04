import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { buildNotifications } from "@/lib/dashboard/metrics";
import { fetchChildData, toProfile } from "@/lib/dashboard/fetch";
import { emailConfigured, sendEmail } from "@/lib/notifications/email";
import { composeEmail, planEmails, type SentRecord } from "@/lib/notifications/plan";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * Pekerjaan harian (vercel.json): mengirim email ringkasan notifikasi (FR-56). Vercel mengirim
 * "Authorization: Bearer $CRON_SECRET" otomatis. Tanpa kunci email, hanya dry-run: tidak ada yang dikirim atau dicatat.
 */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET belum diatur" }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY belum diatur" }, { status: 503 });

  const now = Date.now();
  const dryRun = !emailConfigured();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const { data: kids, error } = await admin.from("children").select("id, parent_id, name, grade, school, avatar");
  if (error) return NextResponse.json({ error: "Gagal membaca data anak" }, { status: 500 });

  const byParent = new Map<string, Record<string, unknown>[]>();
  for (const k of (kids ?? []) as Record<string, unknown>[]) byParent.set(String(k.parent_id), [...(byParent.get(String(k.parent_id)) ?? []), k]);

  const summary = { parents: byParent.size, emails: 0, skipped: 0, failed: 0, dryRun };

  for (const [parentId, rows] of Array.from(byParent)) {
    const { data: u } = await admin.auth.admin.getUserById(parentId);
    const email = u.user?.email;
    // Orang tua yang mematikan email di dasbor tidak dikirimi apa pun.
    if (!email || u.user?.user_metadata?.email_notifications === false) {
      summary.skipped += 1;
      continue;
    }

    const data = await fetchChildData(admin, rows.map(toProfile), now);
    const notifications = data.flatMap((c) => buildNotifications(c, now));

    const since = new Date(now - 60 * 86_400_000).toISOString();
    const { data: log } = await admin.from("notification_log").select("child_id, kind, notification_id, sent_at").eq("parent_id", parentId).gte("sent_at", since);
    const sent: SentRecord[] = ((log ?? []) as Record<string, string>[]).map((l) => ({ childId: l.child_id, kind: l.kind as SentRecord["kind"], notificationId: l.notification_id, sentAt: l.sent_at }));

    const toSend = planEmails(notifications, sent, now);
    if (toSend.length === 0) {
      summary.skipped += 1;
      continue;
    }
    if (dryRun) {
      summary.emails += 1;
      continue;
    }

    const { subject, text } = composeEmail(toSend, `${siteUrl}/dashboard`);
    const result = await sendEmail(email, subject, text);
    if (!result.ok) {
      summary.failed += 1;
      continue;
    }
    summary.emails += 1;
    // Dicatat hanya setelah terkirim, supaya kegagalan dicoba lagi pada pekerjaan berikutnya.
    await admin.from("notification_log").insert(toSend.map((n) => ({ parent_id: parentId, child_id: n.childId, kind: n.kind, notification_id: n.id })));
  }

  return NextResponse.json(summary);
}
