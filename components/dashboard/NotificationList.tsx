import { BellRing, Clock, FileText, Mail, MailX, RotateCcw, TrendingDown, type LucideIcon } from "lucide-react";
import { openNotification, setEmailNotifications } from "@/lib/notifications/actions";
import type { NotificationKind, ParentNotification } from "@/lib/dashboard/types";

const ICON: Record<NotificationKind, LucideIcon> = { "screening-complete": FileText, retest: RotateCcw, inactive: Clock, "quiz-drop": TrendingDown };

/** Notifikasi dasbor dengan status baca. `emailNotifications` undefined = pengaturan email tidak ditampilkan. */
export function NotificationList({ items, readIds, emailNotifications }: { items: ParentNotification[]; readIds: string[]; emailNotifications?: boolean }) {
  const read = new Set(readIds);
  const unread = items.filter((n) => !read.has(n.id)).length;

  return (
    <section className="card flex flex-col gap-3 p-6" aria-labelledby="notifikasi">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="notifikasi" className="flex items-center gap-2 text-xl font-bold">
          <BellRing size={22} className="text-accent-600" aria-hidden="true" /> Notifikasi
          {unread > 0 && <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-ink" aria-label={`${unread} belum dibaca`}>{unread}</span>}
        </h2>
        {emailNotifications !== undefined && (
          <form action={setEmailNotifications.bind(null, !emailNotifications)}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-white">
              {emailNotifications ? <Mail size={14} aria-hidden="true" /> : <MailX size={14} aria-hidden="true" />}
              {emailNotifications ? "Email aktif · matikan" : "Email mati · aktifkan"}
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-neutral-600">Tidak ada notifikasi baru.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const Icon = ICON[n.kind];
            const isRead = read.has(n.id);
            const body = (
              <>
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isRead ? "bg-neutral-100 text-neutral-500" : "bg-brand-100 text-brand-700"}`}><Icon size={18} aria-hidden="true" /></span>
                <span className="flex flex-1 flex-col">
                  <span className={isRead ? "font-medium text-neutral-600" : "font-bold"}>{n.title}{!isRead && <span className="sr-only"> (belum dibaca)</span>}</span>
                  {n.detail && <span className="text-sm text-neutral-600">{n.detail}</span>}
                </span>
                {!isRead && <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" />}
              </>
            );
            const cls = "flex w-full gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-3 text-left transition-colors hover:border-brand-400";
            return (
              <li key={n.id}>
                {n.href ? (
                  <form action={openNotification.bind(null, n.id, n.href)}><button type="submit" className={cls}>{body}</button></form>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
