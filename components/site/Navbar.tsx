"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

export const NAV_LINKS = [
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/tentang", label: "Tentang" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontak", label: "Kontak" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex flex-col items-center px-3 pt-3">
      {/* Di atas halaman: selebar layar. Setelah scroll: memendek jadi pill kaca di tengah. */}
      <nav
        aria-label="Navigasi utama"
        style={{ maxWidth: scrolled ? 560 : 1536 }}
        className={`flex w-full items-center justify-between rounded-full py-2.5 transition-all duration-500 ease-out ${
          scrolled ? "glass px-4" : "border border-transparent bg-transparent px-2 md:px-6"
        }`}
      >
        <div className="flex items-center gap-6">
          <Logo />
          <ul className={`hidden items-center gap-1 overflow-hidden transition-all duration-500 md:flex ${scrolled ? "max-w-0 opacity-0" : "max-w-[640px] opacity-100"}`} aria-hidden={scrolled}>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} tabIndex={scrolled ? -1 : 0} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${pathname === l.href ? "text-ink" : "text-neutral-600 hover:text-ink"}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-ink">Masuk</Link>
          <Link href="/daftar" className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-accent-600 hover:shadow-[0_6px_20px_rgba(255,140,97,0.45)]">Daftar</Link>
        </div>

        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/70 md:hidden" aria-expanded={open} aria-label={open ? "Tutup menu" : "Buka menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass mt-2 w-full max-w-[560px] rounded-3xl p-3 md:hidden">
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="block rounded-2xl px-4 py-3 font-semibold hover:bg-white/70">{l.label}</Link></li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/70 pt-3">
              <Link href="/login" className="btn-ghost !py-3">Masuk</Link>
              <Link href="/daftar" className="btn-primary !px-4 !py-3 !text-base">Daftar</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
