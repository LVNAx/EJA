import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/site/Section";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivasiPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Kebijakan Privasi"
        subtitle="Draf untuk versi hackathon. Perlu ditinjau secara hukum sebelum rilis publik."
      />
      <Prose>
        <h2>Data yang kami simpan</h2>
        <ul>
          <li>Akun orang tua: nama dan email.</li>
          <li>
            Profil anak: nama, kelas, sekolah, avatar, dan PIN (disimpan dalam
            bentuk hash, bukan teks asli).
          </li>
          <li>Hasil skrining, riwayat belajar, dan hasil kuis anak.</li>
        </ul>
        <h2>Tujuan penggunaan</h2>
        <p>
          Data dipakai untuk menampilkan hasil skrining dan perkembangan belajar
          kepada orang tua. Kami tidak menjual data dan tidak menampilkannya
          kepada pengguna lain.
        </p>
        <h2>Akses</h2>
        <p>
          Hanya orang tua pemilik akun yang dapat melihat data anaknya. Akses
          dibatasi di tingkat basis data.
        </p>
        <h2>Suara dan audio</h2>
        <p>
          EJA menggunakan layanan suara pada browser dan tidak menyimpan rekaman
          suara anak. Pada sebagian browser, pengenalan suara mengirim audio ke
          layanan penyedia browser untuk diubah menjadi teks. Fitur mikrofon
          bersifat pilihan; anak tetap dapat membaca tanpa mikrofon.
        </p>
        <h2>Kamera opsional</h2>
        <p>
          Eksperimen Pola Membaca meminta izin kamera saat pengguna memilih
          mengaktifkannya. Gambar diproses di browser; EJA tidak merekam,
          menyimpan, atau mengunggah video. Kalibrasi, titik wajah, dan sampel
          posisi pandangan hanya berada di memori selama sesi, lalu dibuang.
          Ringkasan waktu per bagian, jumlah perpindahan, jawaban pemahaman, dan
          bantuan pendamping disimpan paling banyak 10 sesi per anak pada
          browser yang sama. Ringkasan ini dapat dilihat oleh pengguna perangkat
          tersebut, belum disinkronkan ke akun, dan ikut terhapus jika data
          situs pada browser dihapus. Pada tes membaca berwaktu, catatan juga
          memuat jawaban, waktu pengerjaan, tambahan waktu, pengalaman tulisan
          yang disampaikan anak, dan ringkasan perubahan posisi iris. Data tes
          disimpan pada browser; dalam mode akun dapat disimpan bersama hasil
          tes jika penyimpanan akun tersedia. Video, audio, dan rangkaian posisi
          iris mentah tidak disimpan. Ringkasan dipakai untuk saran latihan,
          tidak digunakan untuk menilai risiko disleksia. Kamera dimatikan saat
          dihentikan, sesi selesai, atau halaman ditinggalkan.
        </p>
        <h2>Hak orang tua</h2>
        <p>
          Orang tua dapat meminta penghapusan profil anak beserta seluruh
          datanya.
        </p>
      </Prose>
    </>
  );
}
