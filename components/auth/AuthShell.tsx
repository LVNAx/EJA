import { FlaskConical } from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { Logo } from "@/components/site/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <AuroraBackground />
      <div className="flex justify-center"><Logo /></div>
      <div className="card flex flex-col gap-5 p-7 md:p-8">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-neutral-600">{subtitle}</p>}
        </div>
        {!isSupabaseConfigured() && (
          <p role="status" className="flex gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm font-medium text-brand-700">
            <FlaskConical size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> Mode demo: Supabase belum dikonfigurasi, formulir ini belum aktif.
          </p>
        )}
        {children}
      </div>
    </main>
  );
}
