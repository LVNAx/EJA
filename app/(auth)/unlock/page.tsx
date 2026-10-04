import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { UnlockForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/auth/unlock";

export const metadata: Metadata = { title: "Buka dasbor — EJA", robots: { index: false } };

export default function UnlockPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell title="Dasbor terkunci" subtitle="Dasbor berisi hasil skrining dan hanya untuk orang tua. Masukkan kata sandi Anda untuk membukanya.">
      <LockKeyhole size={36} className="text-brand-500" strokeWidth={1.6} aria-hidden="true" />
      <UnlockForm next={safeNext(searchParams.next)} />
    </AuthShell>
  );
}
