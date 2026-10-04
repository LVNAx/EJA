import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/site/Section";

export const metadata: Metadata = { title: "Kebijakan Privasi — EJA" };

export default function PrivasiPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Kebijakan Privasi" subtitle="Draf untuk versi hackathon. Perlu ditinjau secara hukum sebelum rilis publik." />
      <Prose>
        <h2>Data yang kami simpan</h2>
        <ul>
          <li>Akun orang tua: nama dan email.</li>
          <li>Profil anak: nama, kelas, sekolah, avatar, dan PIN (disimpan dalam bentuk hash, bukan teks asli).</li>
          <li>Hasil skrining, riwayat belajar, dan hasil kuis anak.</li>
        </ul>
        <h2>Tujuan penggunaan</h2>
        <p>Data dipakai untuk menampilkan hasil skrining dan perkembangan belajar kepada orang tua. Kami tidak menjual data dan tidak menampilkannya kepada pengguna lain.</p>
        <h2>Akses</h2>
        <p>Hanya orang tua pemilik akun yang dapat melihat data anaknya. Akses dibatasi di tingkat basis data.</p>
        <h2>Suara dan audio</h2>
        <p>Pemutaran suara dan pengenalan suara berjalan di browser Anda. EJA tidak mengunggah rekaman suara.</p>
        <h2>Hak orang tua</h2>
        <p>Orang tua dapat meminta penghapusan profil anak beserta seluruh datanya.</p>
      </Prose>
    </>
  );
}
