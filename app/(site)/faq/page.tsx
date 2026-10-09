import type { Metadata } from "next";
import { PageHeader } from "@/components/site/Section";

export const metadata: Metadata = { title: "FAQ", description: "Pertanyaan yang sering diajukan tentang EJA." };

const FAQ = [
  { q: "Apakah hasil EJA sama dengan diagnosis disleksia?", a: "Tidak. EJA adalah skrining awal. Hanya psikolog klinis atau dokter anak tumbuh kembang yang dapat menegakkan diagnosis. Gunakan hasilnya sebagai bahan diskusi dengan profesional." },
  { q: "Untuk anak usia berapa?", a: "Siswa SD kelas 1–6, sekitar usia 6–12 tahun." },
  { q: "Berapa lama tesnya?", a: "Sekitar 8 menit untuk 4 permainan singkat. Tesnya dikerjakan sekali duduk." },
  { q: "Kenapa ada suara? Apakah perlu headphone?", a: "Dua permainan meminta anak mendengarkan kata. Pastikan volume perangkat menyala. Kalau perangkat tidak mendukung suara, kata akan ditampilkan sebagai tulisan besar." },
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
