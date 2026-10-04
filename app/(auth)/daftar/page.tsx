import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Daftar — EJA" };

export default function SignupPage() {
  return (
    <AuthShell title="Daftar orang tua" subtitle="Satu akun dapat memiliki beberapa profil anak.">
      <SignupForm />
    </AuthShell>
  );
}
