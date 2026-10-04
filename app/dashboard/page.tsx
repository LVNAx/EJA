import Link from "next/link";
import { Plus, Scale, UserRound } from "lucide-react";
import { ChildCard } from "@/components/dashboard/ChildCard";
import { NotificationList } from "@/components/dashboard/NotificationList";
import { DisclaimerNote } from "@/components/dashboard/DisclaimerNote";
import { loadDashboard } from "@/lib/dashboard/data";
import { buildNotifications, latestValidScreening } from "@/lib/dashboard/metrics";
import { ROUTES } from "@/lib/routes";

export default async function DashboardPage() {
  const { children, now, readIds, emailNotifications, demo } = await loadDashboard();
  const notifications = children.flatMap((c) => buildNotifications(c, now));
  const canCompare = children.filter((c) => latestValidScreening(c.screenings)).length >= 2;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Ringkasan</h1>
          <p className="mt-1 text-neutral-600">Hasil skrining dan kemajuan belajar semua anak Anda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCompare && <Link href="/dashboard/compare" className="btn-ghost"><Scale size={18} aria-hidden="true" /> Bandingkan</Link>}
          <Link href={ROUTES.addChild} className="btn-ghost"><Plus size={18} aria-hidden="true" /> Tambah anak</Link>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <UserRound size={48} className="text-brand-500" strokeWidth={1.6} aria-hidden="true" />
          <h2 className="text-2xl font-bold">Belum ada profil anak</h2>
          <p className="max-w-md text-neutral-600">Buat profil anak dulu agar anak bisa masuk dengan PIN dan mulai skrining.</p>
          <Link href={ROUTES.addChild} className="btn-primary">Buat profil anak</Link>
        </div>
      ) : (
        <>
          <NotificationList items={notifications} readIds={readIds} emailNotifications={demo ? undefined : emailNotifications} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {children.map((c) => <ChildCard key={c.profile.id} child={c} now={now} />)}
          </div>
        </>
      )}

      <DisclaimerNote />
    </div>
  );
}
