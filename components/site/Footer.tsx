import Link from "next/link";
import { Logo } from "./Logo";

const COLS = [
  { title: "EJA", links: [{ href: "/cara-kerja", label: "Cara Kerja" }, { href: "/tentang", label: "Tentang Kami" }, { href: "/faq", label: "FAQ" }, { href: "/kontak", label: "Kontak" }] },
  { title: "Coba", links: [{ href: "/screening/demo", label: "Tes demo" }, { href: "/login", label: "Masuk" }, { href: "/daftar", label: "Daftar orang tua" }] },
  { title: "Legal", links: [{ href: "/disclaimer", label: "Disclaimer medis" }, { href: "/privasi", label: "Kebijakan privasi" }, { href: "/syarat", label: "Syarat & ketentuan" }] },
];

export function Footer() {
  return (
    <footer className="bg-ink py-14 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:justify-between">
        <div className="max-w-xs space-y-4">
          <Logo light />
          <p className="text-sm text-white/70">Ekosistem belajar untuk anak disleksia usia SD di Indonesia: skrining, rekomendasi, dan belajar dalam satu tempat.</p>
          <p className="rounded-2xl bg-white/10 p-3 text-xs text-white/80">EJA bukan alat diagnosis. Hasil skrining adalah bahan diskusi dengan psikolog atau dokter anak tumbuh kembang.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 font-semibold">{c.title}</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {c.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-4 pt-6 text-sm text-white/50">© 2026 EJA · All rights reserved by EJA Team</p>
    </footer>
  );
}
