"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ClipboardCheck, LayoutDashboard, Mic, Stethoscope, type LucideIcon } from "lucide-react";
import { Illustration, type IllustrationName } from "@/components/screening/Illustration";

const ART: IllustrationName[] = ["balon", "ikan", "apel", "kucing"];

function SkriningMock() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ART.map((a) => (
        <div key={a} className="flex items-center justify-center rounded-2xl border-2 border-neutral-200 bg-white p-3"><Illustration name={a} size={70} /></div>
      ))}
    </div>
  );
}

function RekomendasiMock() {
  const rows = [
    { label: "Risiko rendah", note: "Pantau berkala", w: "85%", c: "bg-success" },
    { label: "Risiko sedang", note: "Latihan rutin + konsultasi guru", w: "58%", c: "bg-accent-500" },
    { label: "Risiko tinggi", note: "Konsultasi psikolog klinis", w: "30%", c: "bg-red-400" },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex justify-between text-sm font-semibold"><span>{r.label}</span><span className="text-neutral-500">{r.note}</span></div>
          <div className="mt-2 h-2.5 rounded-full bg-neutral-100"><div className={`h-full rounded-full ${r.c}`} style={{ width: r.w }} /></div>
        </div>
      ))}
    </div>
  );
}

function BelajarMock() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-neutral-500"><span>Langkah 2 dari 5</span><span>Pecahan</span></div>
      <div className="mt-2 h-2 rounded-full bg-neutral-100"><div className="h-full w-2/5 rounded-full bg-brand-500" /></div>
      <p className="mt-5 text-2xl font-bold leading-snug">Satu pizza dibagi <span className="rounded-md bg-brand-100 px-1">dua</span> sama besar.</p>
      <p className="mt-2 text-lg text-neutral-600">Setiap bagian disebut <span className="rounded-md bg-brand-100 px-1">setengah</span>.</p>
      <div className="mt-5 flex gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-bold"><Mic size={16} /> Ucapkan</span>
        <span className="inline-flex items-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold">Lanjut</span>
      </div>
    </div>
  );
}

function DashboardMock() {
  const bars = [{ l: "Bunyi", v: 78 }, { l: "Cepat", v: 62 }, { l: "Ejaan", v: 70 }, { l: "Memori", v: 48 }];
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-semibold text-neutral-500">Skor per dimensi</p>
      <div className="mt-4 flex h-36 items-end gap-4">
        {bars.map((b) => (
          <div key={b.l} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end rounded-xl bg-neutral-100"><div className="w-full rounded-xl bg-brand-500" style={{ height: `${b.v}%` }} /></div>
            <span className="text-xs font-semibold text-neutral-600">{b.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS: { id: string; label: string; Icon: LucideIcon; title: string; text: string; Mock: () => JSX.Element }[] = [
  { id: "skrining", label: "Skrining", Icon: ClipboardCheck, title: "Skrining yang terasa seperti bermain.", text: "Empat permainan singkat mengukur bunyi, kecepatan, ejaan, dan memori kerja. Tanpa tekanan, tanpa istilah klinis.", Mock: SkriningMock },
  { id: "rekomendasi", label: "Rekomendasi", Icon: Stethoscope, title: "Hasil yang bisa langsung ditindaklanjuti.", text: "Level risiko disertai saran konkret untuk orang tua dan guru, serta kapan perlu menemui profesional.", Mock: RekomendasiMock },
  { id: "belajar", label: "Belajar", Icon: BookOpen, title: "Materi dipecah, satu konsep per langkah.", text: "Kalimat pendek, gambar yang relevan, suara dengan kata yang disorot, dan latihan mengucapkan suku kata.", Mock: BelajarMock },
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard, title: "Orang tua melihat perkembangannya.", text: "Skor skrining, riwayat belajar, dan hasil kuis terkumpul di satu tempat, siap dibawa ke konsultasi.", Mock: DashboardMock },
];

export function Showcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div>
      <div role="tablist" aria-label="Fitur utama" className="mb-10 flex flex-wrap justify-center gap-2">
        {TABS.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={i === active} onClick={() => setActive(i)} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all md:text-base ${i === active ? "bg-ink text-white shadow-lg" : "glass text-neutral-600 hover:text-ink"}`}>
            <t.Icon size={18} /> {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab.id} role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-semibold leading-tight md:text-3xl">{tab.title}</h3>
            <p className="mt-4 text-lg text-neutral-600">{tab.text}</p>
          </div>
          <div className="glass rounded-[24px] p-4 md:p-5"><tab.Mock /></div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
