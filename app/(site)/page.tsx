import Link from "next/link";
import { ArrowRight, BookOpenText, ClipboardCheck, Languages, SearchX, Stethoscope, BookOpen, Check, X, Zap } from "lucide-react";
import { ProductPreview } from "@/components/site/ProductPreview";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Showcase } from "@/components/site/Showcase";

const MODULES = [
  { Icon: ClipboardCheck, tag: "Modul 1 · Orang tua & anak", title: "Skrining", text: "Empat permainan singkat yang mengukur kemampuan dasar membaca, dikerjakan anak dalam sekitar 8 menit.", href: "/cara-kerja" },
  { Icon: Stethoscope, tag: "Modul 2 · Orang tua", title: "Rekomendasi", text: "Level risiko dengan saran yang jelas: apa yang bisa dilakukan di rumah, di sekolah, dan kapan menemui profesional.", href: "/cara-kerja" },
  { Icon: BookOpen, tag: "Modul 3 · Anak", title: "Belajar", text: "Materi SD yang dipecah kecil, dengan gambar, suara, dan kuis singkat di setiap langkah.", href: "/tentang" },
];

const PAIN = [
  { Icon: BookOpenText, title: "Teks terlalu panjang", text: "Anak disleksia sudah kehabisan tenaga saat selesai membaca, sebelum sempat memahami isinya." },
  { Icon: SearchX, title: "Orang tua tidak punya data", text: "Skrining biasanya mahal dan harus ke psikolog. Tanda-tandanya sering baru disadari terlambat." },
  { Icon: Languages, title: "Bukan untuk Bahasa Indonesia", text: "Kebanyakan aplikasi disleksia dibuat untuk bahasa Inggris, padahal pola kesulitannya berbeda." },
];

const COMPARE = [
  ["Format materi", "Paragraf panjang", "Paragraf panjang", "Potongan kecil, satu konsep per langkah"],
  ["Gambar", "Generik atau tidak ada", "Tidak ada", "Ilustrasi khusus per konsep"],
  ["Suara", "Tidak ada", "Tidak ada", "Dibacakan, kata disorot"],
  ["Kecepatan", "Atur sendiri", "Atur sendiri", "Satu langkah, konfirmasi, lanjut"],
  ["Kuis", "Di akhir bab", "Tidak ada", "Setelah tiap potongan"],
];

const FAQ = [
  { q: "Apakah hasil EJA sama dengan diagnosis disleksia?", a: "Tidak. EJA adalah skrining awal. Hanya psikolog klinis atau dokter anak tumbuh kembang yang dapat menegakkan diagnosis." },
  { q: "Untuk anak usia berapa?", a: "Siswa SD kelas 1–6, sekitar usia 6–12 tahun." },
  { q: "Berapa lama tesnya?", a: "Sekitar 8 menit untuk 4 permainan singkat." },
  { q: "Apakah suara anak direkam?", a: "Tes skrining tidak merekam suara. EJA tidak mengunggah rekaman suara ke server." },
];

function Underline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span aria-hidden="true" className="absolute bottom-1 left-0 -z-0 h-3 w-full -rotate-1 rounded-full bg-brand-200" />
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-36 text-center md:pt-48">
        <h1 className="text-4xl font-bold leading-[1.15] md:text-6xl lg:text-7xl" style={{ textWrap: "balance" }}>
          Bantu Anak Disleksia Belajar dengan Cara yang
          <span className="mt-3 block">
            <span className="glass-word text-4xl md:text-6xl lg:text-7xl">Lebih Mudah</span>
          </span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-neutral-600 md:text-xl">
          EJA mengenali tanda awal lewat 4 permainan singkat, lalu menemani anak belajar dengan materi yang visual, bertahap, dan konkret. Untuk siswa SD, dalam Bahasa Indonesia.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <div className="group relative rounded-full p-[2px]">
            <div aria-hidden="true" className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_farthest-side_at_0_100%,#A855F7,transparent),radial-gradient(circle_farthest-side_at_100%_0,#FF8C61,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#A855F7,transparent),radial-gradient(circle_farthest-side_at_0_0,#FF8C61,transparent)] opacity-60 blur-xl transition duration-500 group-hover:opacity-100" />
            <Link href="/daftar" className="btn-primary relative z-10 !px-8 !py-4"><Zap size={20} className="fill-current" /> Mulai Tes Sekarang</Link>
          </div>
          <Link href="/screening/demo" className="btn-ghost !px-6 !py-4 !text-lg">Coba tes demo <ArrowRight size={18} /></Link>
        </div>
        <p className="mt-5 text-sm text-neutral-500">Hasil skrining bukan diagnosis medis.</p>

        <Reveal className="mt-16 w-full">
          <ProductPreview />
        </Reveal>
      </section>

      {/* MODUL */}
      <Section title="Satu alur," highlight="tiga modul" subtitle="Dari mengenali tanda awal sampai belajar sehari-hari.">
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {MODULES.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.08}>
              <Link href={m.href} className="card group flex h-full flex-col p-6 transition-all hover:-translate-y-1 md:p-7">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)]"><m.Icon size={28} strokeWidth={2} /></span>
                <p className="mt-5 text-xs font-medium uppercase tracking-widest text-neutral-500">{m.tag}</p>
                <h3 className="mt-1.5 text-xl font-bold md:text-2xl">{m.title}</h3>
                <p className="mt-2 flex-1 text-neutral-600">{m.text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">Pelajari <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* MASALAH */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold leading-tight md:text-5xl">Kenapa belajarnya masih <br className="hidden md:block" /><Underline>terasa berat?</Underline></h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3 md:gap-8">
          {PAIN.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="card h-full p-6 text-left md:p-8 md:text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm md:mx-auto"><p.Icon size={30} className="text-brand-600" /></span>
                <h3 className="mt-5 text-xl font-bold md:text-2xl">{p.title}</h3>
                <p className="mt-2 text-neutral-600">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SHOWCASE */}
      <Section title="Showcase" highlight="Fitur Utama" subtitle="Sekilas tampilan di dalam EJA.">
        <Showcase />
      </Section>

      {/* PERBANDINGAN */}
      <Section title="Masih mau belajar" highlight="cara lama?">
        <Reveal>
          <div className="card mx-auto max-w-5xl overflow-x-auto p-3 md:p-6">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="p-4 font-semibold">Fitur</th>
                  <th className="p-4 font-semibold">Buku / guru</th>
                  <th className="p-4 font-semibold">Chatbot AI</th>
                  <th className="p-4 font-bold text-ink">EJA</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r[0]} className="border-b border-neutral-200 last:border-0">
                    <th className="p-4 text-sm font-medium text-neutral-500">{r[0]}</th>
                    <td className="p-4 text-sm text-neutral-600"><span className="flex gap-2"><X size={18} className="mt-0.5 shrink-0 text-red-400" />{r[1]}</span></td>
                    <td className="p-4 text-sm text-neutral-600"><span className="flex gap-2"><X size={18} className="mt-0.5 shrink-0 text-red-400" />{r[2]}</span></td>
                    <td className="p-4 text-sm font-semibold"><span className="flex gap-2"><Check size={18} strokeWidth={3} className="mt-0.5 shrink-0 text-success-700" />{r[3]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      {/* STAT GELAP */}
      <section className="relative overflow-hidden bg-ink py-16 md:py-24">
        <div aria-hidden="true" className="absolute left-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-brand-500/25 blur-[120px]" />
        <div aria-hidden="true" className="absolute right-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accent-500/15 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-white md:text-5xl">Masalahnya nyata. <span className="text-accent-500">Dan sering terlambat disadari.</span></h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              { n: "10–15%", t: "anak usia sekolah diperkirakan mengalami disleksia" },
              { n: "±20 juta", t: "anak SD di Indonesia, perkiraan jumlah yang mungkin terdampak" },
              { n: "8 menit", t: "waktu yang dibutuhkan untuk satu kali skrining EJA" },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <p className="text-5xl font-bold text-white md:text-6xl">{s.n}</p>
                <p className="mx-auto mt-3 max-w-[16rem] text-white/60">{s.t}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-xs text-white/40">Angka prevalensi adalah perkiraan umum dan bukan hasil riset EJA.</p>
        </div>
      </section>

      {/* FAQ */}
      <Section title="Pertanyaan yang" highlight="sering ditanya">
        <div className="mx-auto max-w-2xl space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card-solid group overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-left font-semibold">
                {f.q}
                <span className="text-xl text-neutral-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="px-4 pb-4 text-neutral-600">{f.a}</p>
            </details>
          ))}
          <p className="pt-2 text-center"><Link href="/faq" className="font-semibold text-brand-600 underline">Lihat semua pertanyaan</Link></p>
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-28 pt-8 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold leading-tight md:text-5xl">Jangan menunggu. <br className="hidden md:block" />Mulai dari satu tes.</h2>
          <div className="mt-8 flex justify-center">
            <Link href="/daftar" className="btn-primary shadow-lg"><Zap size={20} className="fill-current" /> Mulai Tes Sekarang</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
