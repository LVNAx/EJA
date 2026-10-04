import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/auth/unlock";

export const metadata: Metadata = { title: "Masuk — EJA" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <AuthShell title="Masuk" subtitle="Masuk sebagai orang tua untuk melihat hasil dan kemajuan anak.">
      {searchParams.error === "confirmation" && <p role="alert" className="text-sm text-red-700">Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Buka tautan terbaru dari email Anda.</p>}
      <LoginForm next={safeNext(searchParams.next)} />
    </AuthShell>
  );
}
