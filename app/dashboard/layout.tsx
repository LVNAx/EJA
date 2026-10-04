import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { Logo } from "@/components/site/Logo";
import { signOut } from "@/lib/auth/actions";
import { ROUTES } from "@/lib/routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dasbor Orang Tua — EJA", robots: { index: false } };

// Data pribadi anak dan bergantung pada sesi: jangan di-cache.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const demo = !isSupabaseConfigured();
  return (
    <>
      <AuroraBackground />
      <header className="no-print mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600 sm:inline">Dasbor orang tua</span>
        </div>
        <nav aria-label="Dasbor" className="flex items-center gap-1 text-sm font-semibold">
          <Link href={ROUTES.dashboard} className="rounded-full px-4 py-2 hover:bg-white/70">Ringkasan</Link>
          {!demo && <form action={signOut}><button type="submit" className="rounded-full px-4 py-2 text-neutral-600 hover:bg-white/70 hover:text-ink">Keluar</button></form>}
        </nav>
      </header>
      {demo && (
        <p role="status" className="no-print mx-auto mb-2 flex max-w-6xl items-center gap-2 px-4 text-sm font-medium text-brand-700">
          <FlaskConical size={16} aria-hidden="true" /> Mode demo: Supabase belum dikonfigurasi, data di bawah adalah contoh.
        </p>
      )}
      <main id="main" className="mx-auto max-w-6xl px-4 pb-20">{children}</main>
    </>
  );
}
