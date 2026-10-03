import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = { title: "Tentang — EJA", description: "Misi, dasar ilmiah, dan tim di balik EJA." };

const PRINCIPLES = [
  { title: "Structured Literacy", text: "Belajar bertahap, eksplisit, dan melibatkan lebih dari satu indra. Kami memecah materi menjadi unit kecil, satu konsep per langkah." },
  { title: "Dual Coding", text: "Informasi yang disimpan dalam bentuk kata dan gambar lebih mudah diingat. Setiap konsep disertai ilustrasi yang relevan." },
  { title: "Testing Effect", text: "Mengingat kembali lebih kuat daripada membaca ulang. Karena itu ada satu pertanyaan singkat setelah tiap potongan materi." },
];

const TEAM = [
  { name: "Acan", role: "Full-stack lead, modul skrining" },
  { name: "Attar", role: "Autentikasi dan infrastruktur" },
  { name: "Gagah", role: "Rekomendasi dan dashboard orang tua" },
  { name: "Alfred", role: "Modul belajar" },
];

export default function TentangPage() {
  return (
    <>
      <PageHeader eyebrow="Tentang EJA" title="Aksesibilitas untuk cara belajar yang berbeda" subtitle="EJA bukan chatbot baru. EJA adalah lapisan yang menjembatani konten belajar dengan cara otak anak disleksia bekerja." />

      <Section title="Kenapa" highlight="Bahasa Indonesia?">
        <Reveal className="mx-auto max-w-3xl">
          <div className="card space-y-3 p-6 text-neutral-700 md:p-8">
            <p>Ejaan Bahasa Indonesia transparan: satu huruf, satu bunyi. Karena itu disleksia pada anak Indonesia biasanya tampak sebagai membaca yang <strong>lambat dan terputus-putus</strong>, bukan huruf yang tertukar seperti pada bahasa Inggris.</p>
            <p>Aplikasi disleksia berbahasa Inggris melatih hal yang berbeda. Skrining dan latihan untuk anak Indonesia perlu dirancang ulang sejak awal.</p>
          </div>
        </Reveal>
      </Section>

      <Section title="Dasar" highlight="ilmiahnya">
        <div className="grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.07}>
              <div className="card h-full p-6">
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-neutral-700">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section title="Yang EJA" highlight="tidak lakukan" subtitle="Kami ingin jujur soal batasnya.">
        <Reveal className="mx-auto max-w-3xl">
          <ul className="card space-y-3 p-6 text-neutral-700 md:p-8">
            <li>• EJA bukan terapi membaca. Latihan dekoding dan fluency yang terstruktur tetap perlu terapis bersertifikat.</li>
            <li>• EJA bukan pengganti psikolog atau guru, dan hasil skrining bukan diagnosis.</li>
            <li>• Yang EJA lakukan: membuat materi pelajaran SD lebih mudah diakses, supaya disleksia tidak menghalangi anak belajar Matematika, IPA, dan lainnya.</li>
          </ul>
        </Reveal>
      </Section>

      <Section title="Tim" highlight="EJA" subtitle="Dibuat untuk JOINTS UGM 2026.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((t) => (
            <div key={t.name} className="card p-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">{t.name[0]}</span>
              <h3 className="mt-3 text-lg font-bold">{t.name}</h3>
              <p className="text-sm text-neutral-600">{t.role}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
