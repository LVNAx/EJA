import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { PageHeader, Prose } from "@/components/site/Section";
import { DISCLAIMER } from "@/lib/screening/scoring";

export const metadata: Metadata = { title: "Disclaimer Medis" };

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader eyebrow="Penting" title="Disclaimer Medis" />
      <Prose>
        <p className="flex gap-3 rounded-2xl border border-accent-300 bg-accent-50 p-4 font-semibold text-ink"><TriangleAlert size={22} className="mt-0.5 shrink-0 text-accent-600" />{DISCLAIMER}</p>
        <p>Skrining EJA mengukur empat kemampuan yang berkaitan dengan membaca. Skor rendah tidak berarti anak pasti mengalami disleksia, dan skor tinggi tidak menjamin sebaliknya. Suasana hati, kelelahan, perangkat, dan lingkungan dapat memengaruhi hasil.</p>
        <p>Gunakan hasil sebagai bahan diskusi dengan psikolog klinis atau dokter anak tumbuh kembang. Lihat juga <Link href="/cara-kerja" className="font-semibold text-brand-600 underline">cara kerja skrining</Link>.</p>
      </Prose>
    </>
  );
}
