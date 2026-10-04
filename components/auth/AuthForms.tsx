"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, signUp, unlockDashboard, type FormState } from "@/lib/auth/actions";

const initial: FormState = {};

export function Field({ label, name, type = "text", autoComplete, hint, required = true, minLength, maxLength, inputMode, pattern }: { label: string; name: string; type?: string; autoComplete?: string; hint?: string; required?: boolean; minLength?: number; maxLength?: number; inputMode?: "numeric" | "text"; pattern?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label}</span>
      <input name={name} type={type} autoComplete={autoComplete} required={required} minLength={minLength} maxLength={maxLength} inputMode={inputMode} pattern={pattern} className="rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-brand-500" />
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children, pending: label = "Memproses…" }: { children: React.ReactNode; pending?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary w-full !py-3.5 !text-base">{pending ? label : children}</button>;
}

export function Message({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{state.error}</p>;
  if (state.info) return <p role="status" className="rounded-2xl border border-success bg-success-50 p-3 text-sm font-medium text-success-700">{state.info}</p>;
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState(signIn, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Kata sandi" name="password" type="password" autoComplete="current-password" />
      <Message state={state} />
      <SubmitButton>Masuk</SubmitButton>
      <p className="text-center text-sm text-neutral-600">Belum punya akun? <Link href="/daftar" className="font-semibold text-brand-600 underline">Daftar</Link></p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useFormState(signUp, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nama Anda" name="name" autoComplete="name" minLength={2} maxLength={80} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Kata sandi" name="password" type="password" autoComplete="new-password" minLength={8} hint="Minimal 8 karakter." />
      <label className="flex gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-[#A855F7]" />
        <span>Saya orang tua atau wali anak, dan menyetujui <Link href="/privasi" target="_blank" className="font-semibold text-brand-600 underline">kebijakan privasi</Link> serta <Link href="/syarat" target="_blank" className="font-semibold text-brand-600 underline">syarat &amp; ketentuan</Link>, termasuk pemrosesan data anak untuk skrining dan belajar.</span>
      </label>
      <Message state={state} />
      <SubmitButton>Daftar</SubmitButton>
      <p className="text-center text-sm text-neutral-600">Sudah punya akun? <Link href="/login" className="font-semibold text-brand-600 underline">Masuk</Link></p>
    </form>
  );
}

export function UnlockForm({ next }: { next: string }) {
  const [state, action] = useFormState(unlockDashboard, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Kata sandi Anda" name="password" type="password" autoComplete="current-password" />
      <Message state={state} />
      <SubmitButton>Buka dasbor</SubmitButton>
    </form>
  );
}
