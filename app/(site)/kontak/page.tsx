import type { Metadata } from "next";
import { Code2, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/site/Section";

export const metadata: Metadata = { title: "Kontak" };

export default function KontakPage() {
  return (
    <>
      <PageHeader eyebrow="Kontak" title="Punya pertanyaan atau masukan?" subtitle="Ada pertanyaan? Kami senang mendengar masukan kamu." />
      <div className="mx-auto mb-20 grid max-w-3xl gap-5 px-4 sm:grid-cols-2">
        <a href="https://github.com/LVNAx/EJA" target="_blank" rel="noopener noreferrer" className="card p-6 transition-transform hover:-translate-y-1">
          <Code2 size={32} className="text-brand-600" />
          <h2 className="mt-3 text-xl font-bold">GitHub</h2>
          <p className="mt-1 text-neutral-600">Lihat kode dan laporkan masalah lewat repositori proyek.</p>
        </a>
        <div className="card p-6">
          <Stethoscope size={32} className="text-brand-600" />
          <h2 className="mt-3 text-xl font-bold">Butuh bantuan profesional?</h2>
          <p className="mt-1 text-neutral-600">Untuk kekhawatiran tentang kemampuan membaca anak, hubungi psikolog klinis atau dokter anak tumbuh kembang. EJA tidak dapat menggantikannya.</p>
        </div>
      </div>
    </>
  );
}
