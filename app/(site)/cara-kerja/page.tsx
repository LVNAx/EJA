import type { Metadata } from "next";
import Link from "next/link";
import { Brain, Ear, PenLine, Zap } from "lucide-react";
import { PageHeader, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Notice } from "@/components/site/Notice";

export const metadata: Metadata = { title: "Cara Kerja — EJA", description: "Bagaimana skrining EJA bekerja, dan bagaimana hasilnya dibaca." };

const TESTS = [
  { Icon: Ear, name: "Dengarkan & Pilih", skill: "Kesadaran bunyi (35%)", text: "Anak mendengar sebuah kata, lalu memilih gambar yang bunyi awalnya sama. Ini mengukur kemampuan memproses bunyi bahasa, prediktor terkuat kesulitan membaca." },
  { Icon: Zap, name: "Sebutkan Cepat", skill: "Penamaan cepat (30%)", text: "Huruf besar muncul, anak mengetuk huruf yang sama secepat mungkin. Skor memperhitungkan kecepatan dan ketepatan." },
  { Icon: PenLine, name: "Tulisan yang Benar", skill: "Ketepatan ejaan (20%)", text: "Anak mendengar kata, lalu memilih ejaan yang benar dari empat pilihan." },
  { Icon: Brain, name: "Ingat Urutannya", skill: "Memori kerja (15%)", text: "Angka muncul satu per satu, anak mengulang urutannya. Panjang urutan bertambah selama anak masih berhasil." },
];

const LEVELS = [
  { range: "Skor di atas 0,75", label: "Risiko rendah", text: "Kemampuan di rentang yang diharapkan. Pantau secara berkala.", from: 75, to: 100, dot: "bg-success", bar: "bg-success" },
  { range: "Skor 0,46 – 0,75", label: "Risiko sedang", text: "Ada indikasi kesulitan. Disarankan latihan rutin dan konsultasi ke guru.", from: 45, to: 75, dot: "bg-accent-500", bar: "bg-accent-500" },
  { range: "Skor 0,45 ke bawah", label: "Risiko tinggi", text: "Indikasi kuat. Sangat disarankan konsultasi dengan psikolog klinis atau dokter anak tumbuh kembang.", from: 0, to: 45, dot: "bg-red-400", bar: "bg-red-400" },
];

export default function CaraKerjaPage() {
  return (
    <>
      <PageHeader eyebrow="Cara kerja" title="Dari 4 permainan menjadi satu gambaran" subtitle="Skor tiap permainan digabung dengan bobot tertentu menjadi satu level risiko." />

      <Section title="Empat" highlight="permainan">
        <div className="grid gap-5 md:grid-cols-2">
          {TESTS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <div className="card h-full p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white"><t.Icon size={24} /></span>
                  <div>
                    <h3 className="text-lg font-bold">{t.name}</h3>
                    <p className="text-sm font-semibold text-brand-600">{t.skill}</p>
                  </div>
                </div>
                <p className="mt-3 text-neutral-700">{t.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section title="Membaca" highlight="hasilnya" subtitle="Semakin tinggi skor, semakin baik kemampuannya.">
        <div className="grid gap-5 md:grid-cols-3">
          {LEVELS.map((l, i) => (
            <Reveal key={l.label} delay={i * 0.07}>
              <div className="card flex h-full flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{l.range}</p>
                </div>
                <h3 className="mt-3 text-xl font-bold">{l.label}</h3>
                <p className="mb-5 mt-2 text-neutral-700">{l.text}</p>
                <div className="relative mt-auto h-2 rounded-full bg-neutral-100" aria-hidden="true">
                  <span className={`absolute inset-y-0 rounded-full ${l.bar}`} style={{ left: `${l.from}%`, width: `${l.to - l.from}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-neutral-400" aria-hidden="true"><span>0</span><span>1</span></div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-neutral-700">Bila satu dimensi sangat rendah (di bawah 0,30), status dinaikkan satu tingkat supaya kelemahan yang tajam tidak tertutup oleh rata-rata. Orang tua juga mendapat radar empat dimensi, penjelasan, dan saran tindak lanjut di dasbor.</p>
        <div className="mx-auto mt-8 max-w-2xl"><Notice>Hasil ini bukan diagnosis medis. Hanya psikolog klinis atau dokter anak tumbuh kembang yang dapat menegakkan diagnosis disleksia.</Notice></div>
        <div className="mt-8 text-center"><Link href="/screening/demo" className="btn-primary">Coba tes demo</Link></div>
      </Section>
    </>
  );
}
