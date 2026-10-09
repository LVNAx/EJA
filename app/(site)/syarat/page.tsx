import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/site/Section";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

export default function SyaratPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Syarat & Ketentuan" subtitle="Draf untuk versi hackathon. Perlu ditinjau secara hukum sebelum rilis publik." />
      <Prose>
        <h2>Penggunaan</h2>
        <p>EJA ditujukan untuk orang tua dan anak siswa SD. Akun dibuat dan dikelola oleh orang tua atau wali.</p>
        <h2>Bukan layanan medis</h2>
        <p>Hasil skrining EJA bukan diagnosis dan bukan nasihat medis. Keputusan tentang kondisi anak harus melibatkan psikolog klinis atau dokter anak tumbuh kembang.</p>
        <h2>Tanggung jawab pengguna</h2>
        <p>Jaga kerahasiaan kata sandi dan PIN anak. Gunakan EJA hanya untuk tujuan belajar dan pemantauan anak Anda sendiri.</p>
        <h2>Perubahan</h2>
        <p>Layanan masih dalam pengembangan. Fitur dan ketentuan dapat berubah.</p>
      </Prose>
    </>
  );
}
