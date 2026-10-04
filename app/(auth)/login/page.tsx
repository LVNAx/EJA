import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/auth/unlock";

export const metadata: Metadata = { title: "Masuk — EJA" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell title="Masuk" subtitle="Masuk sebagai orang tua untuk melihat hasil dan kemajuan anak.">
      <LoginForm next={safeNext(searchParams.next)} />
    </AuthShell>
  );
}
