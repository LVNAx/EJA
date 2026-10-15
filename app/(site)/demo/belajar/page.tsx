import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Calculator, Camera, ChartNoAxesColumn, PencilLine, ScanEye } from "lucide-react";
import { learningHref } from "@/features/learning/paths";
import { DEMO_CHILD_ID, ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Coba Belajar",
  description: "Coba latihan membaca, menulis, dan matematika EJA tanpa akun.",
};

const ACTIVITIES = [
  {
    title: "Membaca",
    group: "Membaca & Menulis",
    text: "Dengarkan kata per suku kata, lalu coba baca sendiri.",
    path: "/latihan/membaca",
    Icon: BookOpenText,
    color: "bg-brand-100 text-brand-700",
  },
  {
    title: "Menulis",
    group: "Membaca & Menulis",
    text: "Tebalkan huruf A–Z, a–z, atau angka 0–9 dengan jari atau tetikus.",
    path: "/latihan/menulis",
    Icon: PencilLine,
    color: "bg-accent-100 text-ink",
  },
  {
    title: "Matematika",
    group: "Matematika",
    text: "Coba pecahan atau perkalian lewat gambar dan kuis singkat.",
    path: "/matematika",
    Icon: Calculator,
    color: "bg-brand-100 text-brand-700",
  },
];

export default function LearningDemoPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-28 md:pt-36" aria-labelledby="demo-title">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700">
        <ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
      </Link>
      <p className="mt-6 text-sm font-semibold text-brand-700">DEMO BELAJAR · TANPA AKUN</p>
      <h1 id="demo-title" className="mt-2 text-3xl font-bold md:text-5xl">Mau mencoba apa?</h1>
      <p className="mt-4 max-w-xl text-lg text-neutral-600">Pilih satu kegiatan. Kamu boleh mengulang dan belajar pelan-pelan.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {ACTIVITIES.map(({ title, group, text, path, Icon, color }) => (
          <Link
            key={title}
            href={learningHref(DEMO_CHILD_ID, path)}
            aria-label={`Coba ${title}`}
            className="card group flex min-w-0 flex-col p-6 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}><Icon size={28} aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-semibold text-neutral-500">{group}</p>
            <h2 className="mt-1 text-2xl font-bold">{title}</h2>
            <p className="mt-3 flex-1 text-neutral-600">{text}</p>
            <span className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700">Coba {title} <ArrowRight size={18} aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-neutral-600">Catatan demo belajar hanya tersimpan di browser ini.</p>
      <nav aria-label="Fitur tambahan" className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/demo/wajah-mata", label: "Demo wajah & mata", Icon: Camera },
          { href: learningHref(DEMO_CHILD_ID, "/latihan/pola-membaca"), label: "Pola membaca", Icon: ScanEye },
          { href: learningHref(DEMO_CHILD_ID, "/perkembangan"), label: "Perkembangan belajar", Icon: ChartNoAxesColumn },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} prefetch={false} className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
            <Icon size={19} className="shrink-0 text-brand-700" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words">{label}</span>
            <ArrowRight size={16} className="shrink-0 text-neutral-500" aria-hidden="true" />
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-neutral-600">Ingin mencoba empat permainan skrining? <Link href={ROUTES.screening(DEMO_CHILD_ID)} className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline">Coba Skrining</Link></p>
    </section>
  );
}
