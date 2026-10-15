<div align="center">

# EJA

**Ekosistem belajar untuk anak disleksia usia SD di Indonesia:** skrining lewat permainan, rekomendasi yang mudah dipahami orang tua, dan dasbor untuk memantau perkembangan anak.

<br>

<img src="https://skillicons.dev/icons?i=nextjs,ts,react,tailwind,supabase,vercel,git,github,vscode&perline=9" alt="Tech Stack">

<br><br>

![Next.js](https://img.shields.io/badge/Next.js-14-1f2937?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-1f2937?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-RLS-1f2937?style=flat-square&logo=supabase&logoColor=white)
![Tes](https://img.shields.io/badge/Tes-vitest-1f2937?style=flat-square&logo=vitest&logoColor=white)
![JOINTS UGM 2026](https://img.shields.io/badge/JOINTS_UGM-2026-1f2937?style=flat-square)

</div>

---

> [!IMPORTANT]
> EJA adalah **alat bantu skrining, bukan alat diagnosis**. Hasilnya adalah bahan diskusi dengan psikolog klinis atau dokter anak tumbuh kembang. Bobot dan ambang skor masih **asumsi awal** yang belum divalidasi lewat pilot, jadi EJA tidak mengklaim akurasi deteksi.

## Tentang Proyek

Anak disleksia berbahasa Indonesia sering terlambat terdeteksi, sementara skrining profesional mahal dan sulit dijangkau. EJA menyatukan tiga hal dalam satu alur:

1. **Tes versi 2**: bunyi kata, membaca, menyebut angka berurutan, dan dikte, bersama pendamping.
2. **Catatan pendamping**: jawaban yang sesuai, bagian yang belum dinilai, waktu, dan bantuan yang digunakan. Belum menghasilkan tingkat risiko atau diagnosis.
3. **Belajar** _(prototipe)_: latihan membaca dan menulis, serta dua materi matematika bertahap dengan suara, ilustrasi, dan kuis.

Hasil skrining tampil di **dasbor orang tua**. Progres modul belajar tersimpan per anak di browser. Dasbor orang tua menampilkan catatan latihan nyata dari browser yang sama; sinkronisasi monitoring lintas perangkat belum tersedia. Tes versi 2 tidak menghitung tingkat risiko disleksia.

Proyek ini dibuat untuk **JOINTS UGM 2026**.

## Demo singkat

Dari beranda, pilih **Coba Belajar** untuk membuka pilihan membaca, menulis, atau matematika tanpa akun. Alamat langsung: `/demo/belajar`. **Coba Skrining** membuka empat kegiatan tes versi 2 di `/screening/demo`. Di dalam latihan demo, gunakan **Pilih kegiatan lain** untuk kembali. Catatan demo belajar tersimpan hanya di browser, terpisah dari profil anak.

## Status

| Bagian                                           | Status                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Halaman publik (beranda, cara kerja, FAQ, dll.)  | ✅ Selesai                                                                                                                           |
| Tes versi 2 (4 kegiatan, bukti per butir)       | ✅ Prototipe; belum tervalidasi klinis                                                                                                                           |
| Laporan versi 2                                 | ✅ Catatan per butir; laporan risiko dan radar lama hanya arsip                                                                              |
| Dasbor orang tua                                 | ✅ Selesai, diuji dalam **mode demo**                                                                                                |
| Auth orang tua, profil anak, kunci dasbor        | ✅ Email + password, callback konfirmasi dan kunci parent; database/RLS diuji pada Supabase, email konfirmasi masih perlu uji manual |
| Email notifikasi (cron)                          | ⚠️ Ada, belum pernah mengirim; tanpa kunci hanya _dry-run_                                                                           |
| Modul belajar                                    | ✅ Prototipe membaca, menulis A–Z/a–z/0–9, dan 2 materi matematika; progres masih lokal per anak                                     |
| Masuk anak dengan PIN                            | ✅ Avatar + PIN, cooldown 5 percobaan, sesi terikat profil dan reset PIN oleh orang tua                                              |

## Fitur

### Tes versi 2

Buka `/screening/demo`. Empat kegiatan, satu tugas per layar:

| Kegiatan | Catatan |
| --- | --- |
| Bunyi kata | 6 soal gambar dengan bunyi awal yang sama; waktu mulai setelah audio selesai |
| Membaca | Teks dan 2 soal pemahaman dalam 60 detik (boleh tambah 30 detik, maksimal 3 kali), dilanjutkan 4 kata dan 2 kata rekaan tanpa batas waktu; ucapan kata dicatat pendamping |
| Sebut angka | 12 angka berurutan, pemeriksaan pengenalan angka dahulu, waktu dan posisi kesalahan dicatat terpisah |
| Dikte | 4 kata dengan jawaban ketik, tanpa pilihan kata, koreksi otomatis dan pemeriksaan ejaan browser dimatikan |

- Tidak menghasilkan skor gabungan, diagnosis, atau tingkat risiko: belum ada norma usia/kelas maupun validasi klinis.
- Kecepatan tidak memberi poin untuk jawaban salah. Bagian dilewati, tidak terdengar, atau belum diperiksa dicatat sebagai belum dinilai, bukan kemampuan rendah.
- Halaman ditinggalkan saat menjawab: soal diulang dan interupsi dicatat. Bantuan dan pengulangan audio tercatat per butir.
- Pilihan kamera terlihat pada awal tes dan dapat dimatikan. Jika dipilih, kamera disiapkan otomatis ketika masuk kegiatan membaca, sebelum teks atau hitungan waktu tampil. Anak melihat titik diam 2 detik untuk mengambil referensi getaran iris; jika kamera atau referensi gagal, tugas tetap bisa dijalankan tanpa penilaian gerak. Waktu kamera/model menyiapkan diri tidak mengurangi 60 detik tugas.
- Teks dan dua pertanyaan memakai satu jam pengerjaan aktif. Waktu habis menonaktifkan jawaban sampai pengguna menambah waktu atau mengakhiri sesi. Soal tanpa jawaban tetap belum dinilai, tidak otomatis salah. Jeda setelah waktu habis tidak masuk durasi pengerjaan; interupsi tab memerlukan pengulangan percobaan. Tanda waktu setiap jawaban dan jumlah tambahan waktu ikut disimpan.
- Kamera menghasilkan **ringkasan pengamatan**, tidak merekam video atau audio. Perubahan iris relatif terhadap kontur mata dibandingkan dengan referensi diam anak. Pergeseran dihitung setelah posisi berbeda melebihi deadband `max(0.04, 4 × persentil-95 perubahan referensi)` dalam satuan lebar mata dan bertahan ≥200 ms / ≥3 frame. Lonjakan singkat, celah frame >250 ms, perubahan kepala besar, serta gerakan kedua mata yang berlawanan disisihkan. Jendela 5 detik memakai jam tes yang sama dengan jawaban. Angka ini bukan hitungan saccade, regresi bacaan, atau batas gerakan normal/berlebihan; parameter belum divalidasi pada pembaca manusia.
- Ringkasan gerak hanya ditampilkan jika pengamatan ≥5 detik, ≥20 frame, cakupan mata ≥65%, dan interval gerak yang bisa dipakai ≥50%. Kualitas buruk tidak menghasilkan kesimpulan tentang anak. Sesudah teks, anak boleh menjawab apakah tulisan terasa tetap, bergerak/bercampur, belum tahu, atau melewati pertanyaan. Pengalaman ini ditandai sebagai **laporan anak**, tidak disimpulkan dari kamera dan tidak mengurangi nilai. Pilihan laporan anak dapat menawarkan latihan dengan panduan bagian.
- Catatan versi 2 tersimpan maksimal 10 sesi per anak pada browser ini. Dalam mode akun, server memvalidasi jawaban per butir dan menyimpan ke tabel `screening_assessments` setelah migration **`20261015090000_screening_assessments_v2.sql`** diterapkan. Penyimpanan gagal ditampilkan secara eksplisit; catatan lokal dipertahankan.
- Laporan pendamping menampilkan jumlah jawaban sesuai, jumlah butir dinilai, durasi, bantuan, dan interupsi. Riwayat lama dipisahkan dan tidak dibandingkan dengan protokol baru.
- Penilaian lisan dilakukan pendamping; belum mengukur ucapan secara otomatis. Kata rekaan, bank soal, dan protokol masih perlu ditinjau serta diuji pada pembaca manusia.
- Laporan menampilkan nilai 0–100 **per kegiatan** (`jawaban sesuai / butir dinilai × 100`), dengan penanda sementara bila belum lengkap. Nilai bukan skor risiko. Saran latihan memilih bagian dengan proporsi kekeliruan terbesar, lalu kebutuhan bantuan atau bagian belum dinilai. Saran ini juga muncul di beranda belajar sampai tersedia hasil latihan berikutnya untuk keterampilan terkait; hasil tes tidak dicampur ke posterior Bayesian latihan yang memakai tugas berbeda.
- Catatan kamera dipasangkan dengan hasil pemahaman dan waktu jawaban pada sesi yang sama. Durasi sinyal hilang tidak disebut kehilangan fokus. Ringkasan pergeseran iris tidak digunakan untuk mendiagnosis disleksia atau memastikan sensasi huruf bergerak. Nilai jawaban dan prioritas latihan tidak diubah oleh banyaknya pergerakan iris; saran dapat memakai jawaban dan pengalaman yang dilaporkan anak.
- Hasil matematika menampilkan kuis selesai terbaru per materi pada browser anak yang sama: nilai tepat pada percobaan pertama, jumlah soal akhirnya selesai, percobaan, dan petunjuk. Ringkasan sesi juga menunjukkan nilai kuis sesi tersebut. Petunjuk tidak mengurangi nilai; hasil setelah mencoba ulang tetap dicatat sebagai keberhasilan menyelesaikan soal. Data matematika ini berasal dari modul belajar, bukan soal menyebut angka pada tes membaca.

### Laporan versi lama (arsip)

- Laporan berisi level risiko, penjelasan awam tiap dimensi, **radar chart** (SVG buatan sendiri, ada alternatif tabel untuk pembaca layar), saran orang tua dan guru, kapan konsultasi, serta disclaimer yang tidak bisa ditutup.
- Perbandingan dengan sesi sebelumnya langsung tampil di radar.
- **Unduh PDF** lewat dialog cetak peramban.
- Seluruh teks rekomendasi ada di [`lib/recommendations/content.ts`](lib/recommendations/content.ts). Jalankan `npm run export:review` untuk membuat [`docs/rekomendasi-untuk-ditinjau.md`](docs/rekomendasi-untuk-ditinjau.md) yang siap dikirim ke psikolog.

### Dasbor orang tua

- Ringkasan semua anak: level risiko terakhir, sesi minggu ini, akurasi kuis, hari beruntun.
- Per anak: profil skrining, riwayat tes, monitoring belajar, hasil kuis beserta topik yang sering salah, dan latihan menulis/berbicara.
- Notifikasi (hasil baru, sesi perlu diulang, 5 hari tidak aktif, akurasi kuis turun) dengan status dibaca.
- Perbandingan dua anak dalam satu akun.

### Belajar (prototipe)

- Beranda anak memprioritaskan dua modul: Membaca & Menulis dan Matematika. Ada pilihan melanjutkan aktivitas terakhir, bintang usaha, riwayat latihan, pengaturan aksesibilitas, dan pintasan permainan skrining. Matematika berisi dua materi untuk kelas 4–6. Data risiko tidak dikirim ke dasbor anak.
- Beranda modul belajar membuka dua bagian: **Membaca & Menulis** dan **Matematika**.
- Contoh baca diucapkan per suku kata dengan jeda dan penyorotan; mikrofon opsional. Ucapan seperti `pe ca han` diterima untuk `pecahan`.
- Menulis memakai panduan goresan untuk huruf besar A–Z, huruf kecil a–z, dan angka 0–9. Skor mempertimbangkan jarak, cakupan, jumlah goresan, dan pengulangan garis.
- Matematika berisi dua materi uji: pecahan dan perkalian dengan kelompok. Contoh sehari-hari dan dua tingkat petunjuk tersedia; jawaban belum tepat membuka bantuan bertahap. Kuis harus dijawab tepat sebelum materi dapat diselesaikan. Pengulangan materi tidak menghapus status pernah selesai.
- Catatan lokal mencakup percobaan kuis, jawaban belum tepat, petunjuk, pemutaran contoh, kecocokan bentuk tulisan, dan hasil pencocokan bacaan. Membaca mandiri dicatat sebagai laporan anak dan belum dinilai otomatis. Bintang usaha dan pencapaian diberikan terbatas per aktivitas per hari.
- Font biasa (Outfit) menjadi bawaan. Pilihan **Font biasa / OpenDyslexic** tersedia di kanan header situs, modul belajar, dasbor, dan demo wajah/mata. Pilihan berlaku di seluruh aplikasi dan tersimpan pada browser ini; pengaturan belajar menggunakan pilihan yang sama. Skala teks, kecepatan suara, gerakan, dan efek apresiasi juga dapat diatur. Dialog pengaturan mendukung keyboard dan Escape. Progres, XP, dan sesi tersimpan di browser dengan kunci terpisah untuk tiap anak. Data ini belum ditulis ke tabel Supabase. Dasbor orang tua pada halaman anak menampilkan catatan nyata dari browser yang sama dalam bagian **Catatan latihan dan bantuan**, terpisah dari grafik riwayat database.

### Model perkembangan belajar (demo)

- Model **Beta–Bernoulli** di [`features/learning/model/progress-model.ts`](features/learning/model/progress-model.ts) mempelajari hasil tersimpan secara terpisah untuk membaca, menulis, pecahan, dan perkalian. Ini model probabilistik sederhana dengan pembaruan Bayesian; tidak memakai LLM, layanan AI berbayar, atau model diagnosis disleksia.
- Setiap sesi selesai dengan hasil otomatis menjadi satu observasi berhasil/belum berhasil. Target membaca: ada hasil mikrofon yang cocok. Target menulis: skor bentuk terakhir ≥70%. Target matematika: kuis tepat pada percobaan pertama. Mendengarkan contoh, memakai petunjuk, dan jumlah bintang tidak digunakan sebagai penalti. Membaca mandiri, sesi lama tanpa bukti, serta sesi belum selesai tidak diperlakukan sebagai kegagalan.
- Prior `Beta(1,1)` diperbarui menjadi `Beta(1+sukses, 1+belum berhasil)`, menggunakan paling banyak **20 sesi terbaru per kegiatan**. Perkiraan sesi serupa adalah `alpha/(alpha+beta)`. Interval kredibel 90% dihitung dari distribusi Beta; angka ditampilkan setelah minimal 3 sesi. Arah perubahan membandingkan jumlah target tercapai pada 3 sesi terbaru dengan 3 sesi sebelumnya.
- Model dibangun ulang dari catatan per anak sehingga memuat ulang halaman tidak menggandakan observasi. Catatan tetap lokal di browser dan ikut terhapus ketika pengguna menghapus progres; belum ada sinkronisasi antarperangkat.
- Anak melihat satu saran latihan di beranda dan ringkasan sesi. Orang tua melihat perkiraan, ketidakpastian, riwayat, serta saran pendampingan pada dasbor anak. Laporan juga dapat dibuka di `/child/[childId]/belajar/perkembangan`.
- Untuk presentasi, buka `/child/demo/belajar/perkembangan` lalu **Lihat simulasi model**. Data contoh ditandai jelas, hanya berlaku pada profil demo publik, dan tidak ditulis ke penyimpanan atau dicampur dengan hasil anak.
- Ambang 70%, prior, batas sesi, dan aturan saran adalah pilihan awal prototipe, belum dikalibrasi pada data anak. Hasil mikrofon dan skor bentuk adalah indikator tugas yang terbatas. Pengulangan pertanyaan yang sama, perbedaan kesulitan huruf/kata, dan ketergantungan antarsesi membatasi interpretasi; persentase tidak boleh disebut penguasaan keterampilan, bukti efektivitas, atau risiko disleksia.
- Dasar matematis: [sequential updating model Bernoulli–Beta, UBC](https://www.cs.ubc.ca/~murphyk/pmtk/pmtk1/doc/examples/bernoulli_betaSequentialUpdate.html).

### Eksperimen Pola Membaca (opsional)

- Demo visual terpisah di **`/demo/wajah-mata`** menampilkan kamera besar, kontur wajah, kelopak mata, iris, seluruh titik opsional, dan pembesaran kedua mata. Halaman ini dapat dibuka tanpa akun dan tidak menjalankan kalibrasi atau tugas membaca. Video dan overlay memakai dimensi serta pencerminan yang sama. Tautannya tersedia pada demo belajar dan halaman eksperimen membaca.

- Buka `/child/demo/belajar/latihan/pola-membaca` dari halaman demo atau latihan membaca. Kamera tidak diminta atau dimuat sebelum pengguna memberi persetujuan dan menekan **Aktifkan kamera**. Membaca biasa tetap dapat digunakan tanpa kamera.
- Alur terarah memakai **dua bacaan berbeda**: bacaan biasa lalu bacaan dengan panduan satu bagian. Setiap bacaan memiliki **dua soal pemahaman** dan pemeriksaan lisan per bagian oleh pendamping (opsional). Nilai jawaban dihitung dari jawaban sesuai dibagi pertanyaan dinilai; pertanyaan dilewati tetap belum dinilai. **Latihan tanpa kamera** tetap menjalankan seluruh tugas.
- **MediaPipe Face Landmarker 0.10.32** mengekstrak titik mata/wajah secara lokal. Regresi ridge memetakan fitur mata/kepala ke layar dari **9 titik kalibrasi**. Setelah itu, **6 titik terpisah** memeriksa tiga persegi panjang bacaan yang benar-benar tampil, dua titik per bagian. Sampel pengecekan tidak melatih model. Sampel awal 400 ms dilewati dan setiap titik memerlukan minimal 6 frame. Kalibrasi gagal tetap mengizinkan latihan dan penilaian jawaban.
- Semua aset model dan WASM disajikan dari `public/models/face-landmarker` dengan sumber, versi, SHA-256, dan lisensi Apache-2.0. Aset sekitar 25 MB di repositori; browser memuat model dan satu varian WASM saat kamera diaktifkan. Untuk menyiapkannya ulang, jalankan `npm run gaze:assets`. Tidak ada video yang diunggah, direkam, atau disimpan. Kalibrasi, fitur, dan sampel pandangan hanya di memori sesi.
- Pengecekan bagian mensyaratkan ≥90% prediksi setiap titik berada di bagian yang benar; galat vertikal persentil-90 harus lebih kecil dari sepertiga tinggi bagian dan galat horizontal lebih kecil dari seperempat lebarnya. Posisi yang berada dekat batas dalam rentang galat tersebut tidak diberi label bagian. Hasil juga mensyaratkan ≥5 detik, mata terlacak ≥65% waktu, dan waktu terpetakan ≥40%. Jeda frame dibatasi 250 ms. Semua ambang ini adalah pilihan rekayasa prototipe, belum divalidasi pada anak.
- Perkiraan kunjungan bagian memerlukan ≥400 ms dan minimal 3 frame yang konsisten. Perpindahan ke bagian sebelumnya dihitung hanya di antara kunjungan stabil dengan jeda ≤500 ms. Ini **perpindahan antarbagian besar**, bukan saccade, fiksasi per kata, kesalahan bacaan, atau ukuran perhatian. Membaca ulang dapat menjadi strategi biasa dan tidak dijadikan penalti atau indikator diagnosis.
- Kamera dihentikan pada akhir sesi, pembatalan, komponen dilepas, atau tab disembunyikan. Ukuran layar berubah saat pemetaan membatalkan pengamatan aktif. Latihan yang terputus harus diulang. Permintaan izin/model yang selesai setelah pembatalan dibersihkan. MediaPipe CPU dibatasi sekitar 10 inferensi per detik. Titik dan video dibuang; hanya ringkasan waktu, jumlah perpindahan, jawaban, serta bantuan disimpan, maksimal 10 sesi per anak pada browser ini. Belum disinkronkan ke Supabase.
- Laporan memasangkan jawaban dengan waktu pada bagian yang terkait dan menyarankan bacaan pendek dengan panduan. Perbandingan dua bacaan tidak membuktikan efektivitas bantuan karena bacaan, soal, urutan, dan tingkat kesulitan belum dikendalikan. Tautan `?latihan=baris` langsung menawarkan latihan dengan panduan. Saran terbaru juga muncul di beranda dan laporan perkembangan; tugas eksperimen tidak dicampur ke posterior Bayesian latihan lain, bintang, atau hasil skrining.
- Pengujian otomatis memakai data sintetis untuk kalibrasi, getaran, sinyal hilang, dan urutan perpindahan, serta tracker simulasi untuk alur UI. Pengujian model nyata sebelumnya memeriksa pemuatan model dan penolakan video tanpa wajah. **Ketepatan pada webcam dan pembaca manusia belum divalidasi**; tidak ada skor risiko disleksia atau klaim ketepatan klinis. Dasar batas iris: [Google Research](https://research.google/blog/mediapipe-iris-real-time-iris-tracking-depth-estimation/); motivasi penelitian pola membaca: [RADAR](https://arxiv.org/abs/1611.05669).

### Keamanan & privasi

| Hal                 | Cara                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| Data per akun       | **Row Level Security** di semua tabel: orang tua hanya melihat data anaknya      |
| Hash PIN anak       | bcrypt, dan kolomnya **tidak dapat dibaca klien** (grant kolom)                  |
| Dasbor vs sesi anak | Cookie **buka-kunci** bertanda tangan HMAC. Bila dihapus, dasbor justru terkunci |
| Tujuan redirect     | Hanya jalur di dalam situs (`safeNext`), mencegah _open redirect_                |
| Kunci service       | Hanya dipakai di cron server, tidak pernah di `NEXT_PUBLIC_*`                    |
| Audio               | Tidak direkam atau disimpan                                                      |
| Email notifikasi    | Tanpa level risiko atau skor; ada opsi mematikan                                 |

## Tech Stack

| Bagian         | Teknologi                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework      | Next.js 14 (App Router), React 18, TypeScript                                                              |
| Gaya & animasi | Tailwind CSS, Framer Motion, ikon lucide-react; gaya modul belajar diisolasi di `features/learning/styles` |
| Latar          | Shader WebGL buatan sendiri                                                                                |
| Backend & data | Supabase (PostgreSQL, Auth, RLS) lewat `@supabase/ssr`                                                     |
| Suara          | Web Speech API bawaan peramban (`id-ID`)                                                                   |
| Tes            | Vitest, PGlite (Postgres in-process untuk menguji migrasi dan RLS)                                         |
| Penerapan      | Vercel (cron harian untuk email)                                                                           |

## Struktur Folder

```
.
├── app/
│   ├── (site)/            # halaman publik: beranda, cara kerja, FAQ, legal
│   ├── (auth)/            # /login, /daftar, /unlock
│   ├── dashboard/         # dasbor orang tua (ringkasan, anak, laporan, perbandingan)
│   ├── screening/         # permainan skrining + hasil demo
│   ├── child/             # beranda anak dan rute modul belajar
│   └── api/cron/          # pengiriman email notifikasi
├── components/            # auth, dashboard (radar, grafik), screening, site
├── features/learning/     # konten, komponen, penyimpanan lokal, font, dan CSS modul belajar
├── lib/
│   ├── screening/         # config, scoring, quality, soal
│   ├── recommendations/   # teks rekomendasi + penyusun laporan
│   ├── dashboard/         # tipe, metrik, pengambilan data, data contoh
│   ├── notifications/     # rencana email, pengirim
│   ├── auth/              # kunci dasbor, server action
│   └── supabase/          # klien browser, server, middleware, admin
├── supabase/
│   ├── migrations/        # skema, RLS, dan catatan tes versi 2
│   └── seed/              # data contoh untuk pengembangan
├── docs/                  # teks rekomendasi untuk ditinjau psikolog
├── middleware.ts          # sesi Supabase + penjaga /dashboard
└── scripts/
```

## Cara Menjalankan di Lokal

### 1. Prasyarat

- Node.js 18.18 atau lebih baru
- Git

### 2. Pasang dependensi

```bash
git clone https://github.com/LVNAx/EJA.git
cd EJA
npm install
```

### 3. Jalankan

```bash
npm run dev
```

Buka <http://localhost:3000>. Tanpa konfigurasi apa pun, EJA berjalan dalam **mode demo**: tidak butuh Supabase, dasbor memakai data contoh, dan formulir akun menampilkan pesan "belum aktif".

### Rute untuk dicoba (mode demo)

| Alamat                                      | Isi                                                  |
| ------------------------------------------- | ---------------------------------------------------- |
| `/`                                         | Beranda                                              |
| `/screening/demo`                           | Tes demo, hasilnya langsung tampil                   |
| `/dashboard`                                | Ringkasan tiga anak contoh                           |
| `/dashboard/child/demo-rizky`               | Dasbor anak (kasus eskalasi ke Risiko Tinggi)        |
| `/dashboard/child/demo-rizky/screening`     | Laporan skrining lengkap                             |
| `/dashboard/child/demo-nadia`               | Dasbor anak (Risiko Rendah, 6 hari tidak aktif)      |
| `/dashboard/child/demo-bima`                | Kondisi kosong (belum skrining)                      |
| `/dashboard/compare`                        | Perbandingan dua anak                                |
| `/child/demo-rizky`                         | Dasbor anak dengan progres lokal dan akses aktivitas |
| `/child/demo-rizky/belajar`                 | Beranda modul belajar                                |
| `/child/demo-rizky/belajar/latihan/menulis` | Latihan menulis                                      |
| `/child/demo-rizky/belajar/latihan/membaca` | Latihan membaca                                      |

> Tautan ke `/dashboard` belum ada di navbar. Buka lewat alamat di atas.

## Supabase project Eja

Schema, RPC PIN dan bucket ilustrasi privat sudah terpasang pada project `xnlnzdixcwuichejzgbg`. Jalankan `node scripts/setup-supabase.mjs` lalu `npm run dev` untuk konfigurasi lokal. Ikuti [panduan auth dan routing](docs/supabase-auth-setup.md) untuk pengaturan URL email, alur PIN, schema dan batasan progres lokal.

## Menyambungkan Supabase secara manual (opsional)

1. Salin `.env.example` menjadi `.env.local` lalu isi:

   | Variabel                        | Fungsi                                                                                                                |
   | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | URL project Supabase                                                                                                  |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anon                                                                                                            |
   | `PARENT_UNLOCK_SECRET`          | **Wajib di produksi.** Menandatangani cookie buka-kunci (min. 16 karakter). Kosong di produksi = dasbor tidak terbuka |
   | `SUPABASE_SERVICE_ROLE_KEY`     | Hanya untuk cron email. Melewati RLS, jangan di-commit                                                                |
   | `CRON_SECRET`                   | Melindungi `/api/cron/notifications`                                                                                  |
   | `RESEND_API_KEY`, `EMAIL_FROM`  | Pengiriman email. Tanpa ini cron hanya _dry-run_                                                                      |
   | `NEXT_PUBLIC_SITE_URL`          | Tautan di dalam email                                                                                                 |

   Buat secret acak dengan:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Jalankan migrasi di SQL Editor Supabase, **berurutan**:

   | Berkas                                            | Isi                                                            |
   | ------------------------------------------------- | -------------------------------------------------------------- |
   | `0000_children.sql`                               | Profil anak. **Lewati bila tabel `children` sudah ada**        |
   | `0001_screening_sessions.sql`                     | Sesi skrining                                                  |
   | `0002_learning_tracking.sql`                      | Riwayat belajar, kuis, latihan, validitas sesi                 |
   | `0003_notifications.sql`                          | Status baca notifikasi dan log email                           |
   | `20261004100821_parent_child_auth_curriculum.sql` | Parent profiles, RPC PIN, kurikulum, progres, cache dan bucket |
   | `20261004101050_optimize_family_rls.sql`          | Optimasi policy RLS dan indeks relasi                          |

   Semuanya aman dijalankan ulang. Opsional untuk pengembangan: `supabase/seed/dev_learning_seed.sql` (jangan di produksi).

## Audio Bahasa Indonesia

- Seluruh pembacaan memakai `lib/speech/indonesian.ts`, dengan pembatalan permintaan lama dan pemilihan suara Indonesia secara eksplisit.
- Enam belas kata tes mempunyai berkas WAV Indonesia di `public/audio/id`, sehingga stimulus tes tetap tersedia saat perangkat tidak mempunyai suara Indonesia. Berkas ini dibuat dengan suara Damayanti (`id_ID`), bukan rekaman manusia. Regenerasi pada macOS: `node scripts/generate-indonesian-audio.mjs`.
- Audio dinamis menunggu daftar suara browser dimuat. Bila suara Indonesia tidak tersedia, aplikasi memberi pesan dan tidak beralih ke suara bahasa lain.
- Pilihan pada tes bunyi awal dan ejaan dibuka setelah audio selesai diputar. Tes bunyi awal menyertakan contoh: susu dan sapu memiliki bunyi awal yang sama. Tes ejaan menyertakan tulisan yang sama dengan kata audio.
- Bank soal dan keberadaan berkas audio diuji otomatis. Pelafalan suara sintetis serta kesesuaian stimulus tetap perlu ditinjau bersama penutur Indonesia dan pendamping anak.

## Perintah

| Perintah                      | Fungsi                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Server pengembangan                                                                                                   |
| `npm run build` / `npm start` | Build dan jalankan produksi                                                                                           |
| `npm run lint`                | ESLint                                                                                                                |
| `npm run typecheck`           | Pemeriksaan tipe                                                                                                      |
| `npm test`                    | Vitest: skor, rekomendasi, metrik, kunci dasbor, middleware, notifikasi, dan **migrasi + RLS di Postgres in-process** |
| `npm run export:review`       | Ekspor teks rekomendasi untuk psikolog                                                                                |

## Rute Utama

| Alamat                                            | Pengguna  | Keterangan                                                                   |
| ------------------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `/`, `/cara-kerja`, `/tentang`, `/faq`, `/kontak` | Publik    | Halaman informasi                                                            |
| `/privasi`, `/syarat`, `/disclaimer`              | Publik    | Legal dan disclaimer medis                                                   |
| `/login`, `/daftar`                               | Orang tua | Masuk dan daftar (persetujuan wajib)                                         |
| `/auth/callback`                                  | Orang tua | Konfirmasi email PKCE/token hash                                             |
| `/masuk-anak`                                     | Anak      | Pilih avatar dan verifikasi PIN                                              |
| `/unlock`                                         | Orang tua | Kata sandi ulang untuk membuka dasbor                                        |
| `/dashboard`                                      | Orang tua | Ringkasan dan notifikasi                                                     |
| `/dashboard/child/new`                            | Orang tua | Tambah profil anak                                                           |
| `/dashboard/child/[id]`                           | Orang tua | Dasbor anak                                                                  |
| `/dashboard/child/[id]/screening`                 | Orang tua | Laporan skrining (`?s=<id>` untuk sesi lama)                                 |
| `/dashboard/compare`                              | Orang tua | Perbandingan dua anak                                                        |
| `/screening/[childId]`                            | Anak      | Empat permainan (tanpa menampilkan hasil)                                    |
| `/child/[childId]`                                | Anak      | Beranda anak                                                                 |
| `/child/[childId]/belajar`                        | Anak      | Modul belajar; latihan di bawah `/latihan/*` dan materi di bawah `/materi/*` |
| `GET /api/cron/notifications`                     | Cron      | Butuh `Authorization: Bearer $CRON_SECRET`                                   |

## Batasan yang Diakui

- Belum ada norma atau data berlabel untuk anak Indonesia. Bobot, ambang, dan akurasi deteksi baru dapat dilaporkan setelah pilot dengan psikolog.
- Teks rekomendasi belum ditinjau psikolog. Laporan menampilkan catatan itu selama statusnya `draft`.
- Daftar tenaga profesional sengaja kosong sampai diverifikasi; sementara itu laporan menampilkan panduan umum mencari bantuan.
- Database/RLS dan verifikasi PIN telah diuji pada project Supabase Eja dalam transaksi rollback. Pengiriman email konfirmasi belum diuji end-to-end.
- Versi pertama membutuhkan internet; ekspor/hapus data akun belum tersedia.
- Progres modul belajar dan catatan bantuan masih di `localStorage` per anak dan browser. Catatan bantuan dapat dibaca orang tua pada browser yang sama; belum tersedia lintas perangkat. Tabel `learning_sessions`, `quiz_results`, dan `practice_results` belum diisi oleh modul ini; sinkronisasi ke tabel monitoring Supabase adalah pekerjaan berikutnya.

## Tim

Dibuat untuk **JOINTS UGM 2026** oleh tim EJA. Daftar anggota ada di halaman [`/tentang`](<app/(site)/tentang/page.tsx>).

Repositori: <https://github.com/LVNAx/EJA>
