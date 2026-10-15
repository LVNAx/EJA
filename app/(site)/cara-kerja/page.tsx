import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Ear, Hash, PenLine } from "lucide-react";
import { PageHeader, Section } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Cara Kerja",
  description: "Empat kegiatan singkat dan catatan jawaban untuk pendamping.",
};
const TESTS = [
  {
    Icon: Ear,
    name: "Bunyi kata",
    text: "Dengar kata, lalu pilih gambar dengan bunyi awal yang sama.",
  },
  {
    Icon: BookOpen,
    name: "Membaca",
    text: "Baca kata dan kata rekaan, lalu jawab pertanyaan bacaan. Pendamping mencatat ucapan anak.",
  },
  {
    Icon: Hash,
    name: "Sebut angka",
    text: "Sebut angka berurutan. Pendamping mencatat waktu dan angka yang keliru atau terlewat.",
  },
  {
    Icon: PenLine,
    name: "Dikte",
    text: "Dengar kata, lalu ketik ejaannya tanpa pilihan jawaban.",
  },
];
export default function CaraKerjaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cara kerja"
        title="Empat kegiatan. Catatan yang jelas."
        subtitle="Kerjakan bersama pendamping, sesuai kecepatan anak."
      />
      <Section title="Coba satu" highlight="per satu">
        <div className="grid gap-5 md:grid-cols-2">
          {TESTS.map((t) => (
            <div key={t.name} className="card p-6">
              <t.Icon size={28} className="text-brand-700" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold">{t.name}</h2>
              <p className="mt-2 text-neutral-600">{t.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Lihat" highlight="catatannya">
        <div className="mx-auto max-w-2xl space-y-5">
          <p>
            Hasil menampilkan jawaban yang sesuai, bagian yang belum dinilai,
            waktu, dan bantuan yang digunakan. Bagian yang dilewati tidak
            dianggap salah.
          </p>
          <p className="text-neutral-600">
            Prototipe ini belum menghasilkan diagnosis atau tingkat risiko
            disleksia. Kesulitan yang berulang perlu dibahas dengan tenaga
            profesional.
          </p>
          <Link href="/screening/demo" className="btn-primary">
            Coba kegiatan
          </Link>
        </div>
      </Section>
    </>
  );
}
