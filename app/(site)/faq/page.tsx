import type { Metadata } from "next";
import { PageHeader } from "@/components/site/Section";

export const metadata: Metadata = { title: "FAQ", description: "Pertanyaan yang sering diajukan tentang EJA." };

const FAQ = [
  { q: "Apakah hasil EJA sama dengan diagnosis disleksia?", a: "Tidak. Tes versi baru mencatat jawaban dan bantuan, tanpa menghasilkan diagnosis atau tingkat risiko disleksia. Gunakan hasilnya sebagai bahan diskusi dengan profesional." },
  { q: "Untuk anak usia berapa?", a: "Siswa SD kelas 1–6, sekitar usia 6–12 tahun." },
  { q: "Berapa lama tesnya?", a: "Empat kegiatan singkat. Waktunya mengikuti kecepatan anak; bagian yang belum bisa dilakukan boleh dilewati." },
  { q: "Kenapa ada suara? Apakah perlu headphone?", a: "Bunyi kata dan dikte memakai suara Bahasa Indonesia. Pastikan volume menyala. Jika suara tidak tersedia, lewati bagian itu; jawaban tidak dianggap salah." },
  { q: "Apakah suara anak direkam?", a: "Tes skrining tidak merekam suara. Fitur latihan berbicara memakai pengenalan suara di browser; EJA tidak mengunggah rekaman suara ke server." },
  { q: "Bisa untuk lebih dari satu anak?", a: "Bisa. Satu akun orang tua dapat memiliki beberapa profil anak." },
  { q: "Bagaimana anak masuk ke akunnya?", a: "Anak masuk dengan PIN 4 digit atau memilih avatar, di bawah akun orang tua. Orang tua masuk dengan email dan kata sandi." },
  { q: "Perangkat apa yang disarankan?", a: "Tablet atau ponsel dengan Chrome (Android) memberi pengalaman terbaik, terutama untuk suara. Layar sentuh membuat tombol besar lebih mudah ditekan." },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
      <div className="mx-auto mb-20 max-w-3xl space-y-3 px-4">
        {FAQ.map((f) => (
          <details key={f.q} className="card group p-5 md:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
              {f.q}
              <span className="text-2xl text-brand-500 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-neutral-700">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
