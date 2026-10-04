import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewChildForm } from "@/components/dashboard/NewChildForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

export default function NewChildPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 pt-2">
      <Link href={ROUTES.dashboard} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-ink"><ArrowLeft size={16} aria-hidden="true" /> Ringkasan</Link>
      <div className="card flex flex-col gap-5 p-7 md:p-8">
        <div>
          <h1 className="text-3xl font-bold">Tambah profil anak</h1>
          <p className="mt-2 text-neutral-600">Satu akun dapat memiliki beberapa anak. Skrining untuk siswa SD kelas 1–6.</p>
        </div>
        {!isSupabaseConfigured() && <p role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm font-medium text-brand-700">Mode demo: formulir ini belum menyimpan apa pun.</p>}
        <NewChildForm />
      </div>
    </div>
  );
}
