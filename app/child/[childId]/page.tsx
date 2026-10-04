import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ClipboardList, Lock } from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { buildDemoData } from "@/lib/dashboard/fixtures";
import { ROUTES } from "@/lib/routes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Beranda — EJA", robots: { index: false } };
export const dynamic = "force-dynamic";

// Beranda anak. Modul Belajar (Alfred) akan mengisi kartu "Belajar"; sampai itu siap, kartunya ditandai segera hadir.
// Halaman ini tidak pernah menampilkan tingkat risiko (FR-19).
export default async function ChildHomePage({ params }: { params: { childId: string } }) {
  let name = "Teman";

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.childHome(params.childId))}`);
    const { data: child } = await supabase.from("children").select("name").eq("id", params.childId).maybeSingle();
    if (!child) redirect(ROUTES.dashboard);
    name = child.name;
  } else {
    name = buildDemoData(Date.now()).find((c) => c.profile.id === params.childId)?.profile.name ?? name;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-8">
      <AuroraBackground />
      <h1 className="text-center text-3xl font-bold">Halo, <span className="marker">{name}</span>!</h1>

      <Link href={ROUTES.screening(params.childId)} className="card flex items-center gap-4 p-6 transition-transform hover:-translate-y-1">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white"><ClipboardList size={30} aria-hidden="true" /></span>
        <span><span className="block text-xl font-bold">Main permainan</span><span className="text-neutral-600">4 permainan seru</span></span>
      </Link>

      <div className="card flex items-center gap-4 p-6 opacity-70" aria-disabled="true">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-300 text-white"><BookOpen size={30} aria-hidden="true" /></span>
        <span><span className="block text-xl font-bold">Belajar</span><span className="text-neutral-600">Segera hadir</span></span>
      </div>

      <Link href="/unlock" className="mx-auto mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-ink"><Lock size={14} aria-hidden="true" /> Untuk orang tua</Link>
    </main>
  );
}
