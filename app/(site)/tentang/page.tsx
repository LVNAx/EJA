import type { Metadata } from "next";
import { ArrowUpRight, ClipboardCheck, FlaskConical, GraduationCap, Stethoscope } from "lucide-react";
import { PageHeader, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { BASIS, LIMITATIONS, REFERENCES } from "@/lib/references";
import { TeamPhoto } from "@/components/site/TeamPhoto";

export const metadata: Metadata = { title: "Tentang — EJA", description: "Misi, landasan ilmiah, dan tim di balik EJA." };

const PRINCIPLES = [
  { title: "Structured Literacy", text: "Belajar bertahap, eksplisit, dan melibatkan lebih dari satu indra. Kami memecah materi menjadi unit kecil, satu konsep per langkah." },
  { title: "Dual Coding", text: "Informasi yang disimpan dalam bentuk kata dan gambar lebih mudah diingat. Setiap konsep disertai ilustrasi yang relevan." },
  { title: "Testing Effect", text: "Mengingat kembali lebih kuat daripada membaca ulang. Karena itu ada satu pertanyaan singkat setelah tiap potongan materi." },
];

const TEAM = [
  { name: "Arkan", role: "Full-stack Developer", photo: "/team/arkan.jpg" },
  { name: "Attar", role: "Full-stack Developer", photo: "/team/attar.jpg" },
  { name: "Alfredo", role: "Full-stack Developer", photo: "/team/alfredo.jpg" },
  { name: "Gagah", role: "Full-stack Developer", photo: "/team/gagah.jpg" },
];

const GROUP_ICON = { skrining: ClipboardCheck, rekomendasi: Stethoscope, belajar: GraduationCap } as const;

function Cite({ ids }: { ids: number[] }) {
  return (
    <span className="whitespace-nowrap">
      {ids.map((n, i) => (
        <a key={n} href={`#ref-${n}`} className="font-semibold text-brand-600 hover:underline" aria-label={`Pustaka ${n}`}>
          {i === 0 ? "[" : ""}{n}{i === ids.length - 1 ? "]" : ", "}
        </a>
      ))}
    </span>
  );
}

export default function TentangPage() {
  return (
    <>
      <PageHeader eyebrow="Tentang EJA" title="Dibangun di atas penelitian, bukan perkiraan" subtitle="EJA bukan chatbot baru. EJA adalah lapisan yang menjembatani konten belajar dengan cara otak anak disleksia bekerja. Di bawah ini kami jelaskan dasar dari setiap keputusan." />

      <Section title="Kenapa" highlight="Bahasa Indonesia?">
        <Reveal className="mx-auto max-w-3xl">
          <div className="card space-y-3 p-6 text-neutral-700 md:p-8">
            <p>Ejaan Bahasa Indonesia transparan: satu huruf, satu bunyi. Penelitian lintas bahasa menunjukkan bahwa pada ortografi seperti ini, disleksia lebih tampak sebagai membaca yang <strong>lambat dan terputus</strong> daripada huruf yang tertukar <Cite ids={[6, 7, 8]} />.</p>
            <p>Karena itu aplikasi berbahasa Inggris yang melatih ketidakkonsistenan huruf-bunyi kurang relevan. Skrining dan latihan untuk anak Indonesia perlu dirancang ulang.</p>
          </div>
        </Reveal>
      </Section>

      {/* LANDASAN ILMIAH */}
      <section id="landasan" className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-bold uppercase tracking-widest text-brand-600"><FlaskConical size={14} /> Landasan ilmiah</p>
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">Dasar dari skrining, rekomendasi, <span className="marker">dan cara belajar</span></h2>
          <p className="mt-4 text-lg text-neutral-600">Angka dalam tanda kurung siku merujuk ke <a href="#pustaka" className="font-semibold text-brand-600 underline">daftar pustaka</a> di bawah.</p>
        </Reveal>

        <div className="space-y-16">
          {BASIS.map((g) => {
            const Icon = GROUP_ICON[g.id as keyof typeof GROUP_ICON];
            return (
              <div key={g.id} id={g.id}>
                <Reveal className="mb-6 flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)]"><Icon size={24} /></span>
                  <div>
                    <h3 className="text-2xl font-bold">{g.title}</h3>
                    <p className="mt-1 text-neutral-600">{g.intro}</p>
                  </div>
                </Reveal>
                <div className="grid gap-5 md:grid-cols-2">
                  {g.items.map((it, i) => (
                    <Reveal key={it.title} delay={(i % 2) * 0.07}>
                      <article className="card h-full p-6">
                        <h4 className="text-lg font-bold">{it.title}</h4>
                        <dl className="mt-3 space-y-3 text-neutral-700">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Di EJA</dt>
                            <dd className="mt-0.5">{it.eja}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Dasar penelitian</dt>
                            <dd className="mt-0.5">{it.evidence} <Cite ids={it.refs} /></dd>
                          </div>
                        </dl>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Section title="Keterbatasan" highlight="yang kami akui" subtitle="Dasar ilmiah bukan berarti sudah tervalidasi. Ini yang belum kami lakukan.">
        <Reveal className="mx-auto max-w-3xl">
          <ul className="card space-y-3 p-6 text-neutral-700 md:p-8">
            {LIMITATIONS.map((l) => (
              <li key={l} className="flex gap-3"><span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />{l}</li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section title="Yang EJA" highlight="tidak lakukan">
        <Reveal className="mx-auto max-w-3xl">
          <ul className="card space-y-3 p-6 text-neutral-700 md:p-8">
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />EJA bukan terapi membaca. Latihan dekoding dan kelancaran yang terstruktur tetap perlu terapis bersertifikat.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />EJA bukan pengganti psikolog atau guru, dan hasil skrining bukan diagnosis.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />Yang EJA lakukan: membuat materi pelajaran SD lebih mudah diakses, supaya disleksia tidak menghalangi anak belajar Matematika, IPA, dan lainnya.</li>
          </ul>
        </Reveal>
      </Section>

      <section id="pustaka" className="mx-auto max-w-4xl scroll-mt-28 px-4 py-14 md:py-20">
        <Reveal className="mb-8 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Daftar <span className="marker">pustaka</span></h2>
        </Reveal>
        <Reveal>
          <ol className="card divide-y divide-neutral-200 p-2 md:p-4">
            {REFERENCES.map((r) => (
              <li key={r.id} id={`ref-${r.id}`} className="flex scroll-mt-28 gap-4 p-4">
                <span className="w-7 shrink-0 text-sm font-bold text-brand-600">[{r.id}]</span>
                <div className="min-w-0 text-sm leading-relaxed text-neutral-700 md:text-base">
                  <span>{r.authors} ({r.year}). </span>
                  <span className="font-semibold text-ink">{r.title}.</span>
                  <span> {r.source}. </span>
                  <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(`${r.title} ${r.authors.split(",")[0]}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-brand-600 hover:underline">
                    Cari di Google Scholar <ArrowUpRight size={14} />
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <Section title="Tim" highlight="EJA" subtitle="Empat developer yang membangun EJA dari nol.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((t) => (
            <div key={t.name} className="card overflow-hidden p-0 text-center">
              <TeamPhoto src={t.photo} name={t.name} />
              <div className="p-4">
                <h3 className="text-lg font-bold">{t.name}</h3>
                <p className="text-sm text-neutral-600">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
