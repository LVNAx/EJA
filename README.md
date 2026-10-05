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

1. **Skrining**: empat permainan pendek yang terasa seperti bermain, bukan ujian.
2. **Rekomendasi**: level risiko dengan bahasa awam, saran untuk orang tua dan guru, serta kapan perlu menemui profesional.
3. **Belajar** *(prototipe)*: latihan membaca dan menulis, serta dua materi matematika bertahap dengan suara, ilustrasi, dan kuis.

Hasil skrining tampil di **dasbor orang tua**. Progres modul belajar prototipe saat ini tersimpan per anak di browser dan belum tersambung ke dasbor. Anak tidak pernah melihat tingkat risikonya.

Proyek ini dibuat untuk **JOINTS UGM 2026**.

## Status

| Bagian | Status |
|---|---|
| Halaman publik (beranda, cara kerja, FAQ, dll.) | ✅ Selesai |
| Modul skrining (4 permainan, skor, mutu sesi) | ✅ Selesai |
| Rekomendasi klinis + laporan hasil + radar chart | ✅ Selesai, teks masih **draf belum ditinjau psikolog** |
| Dasbor orang tua | ✅ Selesai, diuji dalam **mode demo** |
| Auth orang tua, profil anak, kunci dasbor | ✅ Email + password, callback konfirmasi dan kunci parent; database/RLS diuji pada Supabase, email konfirmasi masih perlu uji manual |
| Email notifikasi (cron) | ⚠️ Ada, belum pernah mengirim; tanpa kunci hanya *dry-run* |
| Modul belajar | ✅ Prototipe membaca, menulis A–Z/a–z/0–9, dan 2 materi matematika; progres masih lokal per anak |
| Masuk anak dengan PIN | ✅ Avatar + PIN, cooldown 5 percobaan, sesi terikat profil dan reset PIN oleh orang tua |

## Fitur

### Skrining

| Permainan | Yang diukur | Bobot awal |
|---|---|:--:|
| Dengarkan & Pilih | Kesadaran bunyi (fonologis) | 35% |
| Sebutkan Cepat | Penamaan cepat huruf | 30% |
| Tulisan yang Benar | Ketepatan ejaan | 20% |
| Ingat Urutannya | Memori kerja (digit span) | 15% |

- **Skor gabungan** adalah rata-rata berbobot. Di atas 0,75 = Risiko Rendah, di atas 0,45 = Sedang, selain itu Tinggi.
- **Eskalasi**: bila satu dimensi di bawah 0,30, status dinaikkan satu tingkat agar kelemahan tajam tidak tertutup rata-rata.
- **Mutu sesi**: jawaban yang terlalu banyak dan terlalu cepat dianggap tebakan. Sesi ditandai tidak valid dan tidak menghasilkan status.
- **Batas ulang**: maksimal 3 sesi per hari per anak, ditegakkan di server.
- Skor dihitung ulang di server; klien hanya mengirim skor per tes dan waktu respons.

Seluruh bobot dan ambang ada di satu berkas: [`lib/screening/config.ts`](lib/screening/config.ts).

### Rekomendasi & laporan

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

- Dasbor anak menampilkan profil dan avatar, XP, streak aktif, sesi hari ini, lanjutkan aktivitas, lencana, riwayat sesi, pengaturan aksesibilitas, dan pintasan skrining. Matematika tersedia untuk kelas 4–6; IPA dan Pancasila ditandai segera hadir. Data risiko tidak dikirim ke dasbor anak.
- Beranda modul belajar membuka dua bagian: **Membaca & Menulis** dan **Matematika**.
- Contoh baca diucapkan per suku kata dengan jeda dan penyorotan; mikrofon opsional.
- Menulis memakai panduan goresan untuk huruf besar A–Z, huruf kecil a–z, dan angka 0–9. Skor mempertimbangkan jarak, cakupan, jumlah goresan, dan pengulangan garis.
- Matematika berisi dua materi uji: pecahan dan perkalian dengan kelompok, disajikan bertahap dengan kuis singkat.
- Font OpenDyslexic, ukuran teks, kecepatan suara, dan efek apresiasi dapat diatur. Progres, XP, dan sesi tersimpan di browser dengan kunci terpisah untuk tiap anak. Data ini belum ditulis ke tabel Supabase dan belum muncul di dasbor orang tua.

### Keamanan & privasi

| Hal | Cara |
|---|---|
| Data per akun | **Row Level Security** di semua tabel: orang tua hanya melihat data anaknya |
| Hash PIN anak | bcrypt, dan kolomnya **tidak dapat dibaca klien** (grant kolom) |
| Dasbor vs sesi anak | Cookie **buka-kunci** bertanda tangan HMAC. Bila dihapus, dasbor justru terkunci |
| Tujuan redirect | Hanya jalur di dalam situs (`safeNext`), mencegah *open redirect* |
| Kunci service | Hanya dipakai di cron server, tidak pernah di `NEXT_PUBLIC_*` |
| Audio | Tidak direkam atau disimpan |
| Email notifikasi | Tanpa level risiko atau skor; ada opsi mematikan |

## Tech Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Gaya & animasi | Tailwind CSS, Framer Motion, ikon lucide-react; gaya modul belajar diisolasi di `features/learning/styles` |
| Latar | Shader WebGL buatan sendiri |
| Backend & data | Supabase (PostgreSQL, Auth, RLS) lewat `@supabase/ssr` |
| Suara | Web Speech API bawaan peramban (`id-ID`) |
| Tes | Vitest, PGlite (Postgres in-process untuk menguji migrasi dan RLS) |
| Penerapan | Vercel (cron harian untuk email) |

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
│   ├── migrations/        # 0000–0003
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

| Alamat | Isi |
|---|---|
| `/` | Beranda |
| `/screening/demo` | Tes demo, hasilnya langsung tampil |
| `/dashboard` | Ringkasan tiga anak contoh |
| `/dashboard/child/demo-rizky` | Dasbor anak (kasus eskalasi ke Risiko Tinggi) |
| `/dashboard/child/demo-rizky/screening` | Laporan skrining lengkap |
| `/dashboard/child/demo-nadia` | Dasbor anak (Risiko Rendah, 6 hari tidak aktif) |
| `/dashboard/child/demo-bima` | Kondisi kosong (belum skrining) |
| `/dashboard/compare` | Perbandingan dua anak |
| `/child/demo-rizky` | Dasbor anak dengan progres lokal dan akses aktivitas |
| `/child/demo-rizky/belajar` | Beranda modul belajar |
| `/child/demo-rizky/belajar/latihan/menulis` | Latihan menulis |
| `/child/demo-rizky/belajar/latihan/membaca` | Latihan membaca |

> Tautan ke `/dashboard` belum ada di navbar. Buka lewat alamat di atas.

## Supabase project Eja

Schema, RPC PIN dan bucket ilustrasi privat sudah terpasang pada project `xnlnzdixcwuichejzgbg`. Jalankan `node scripts/setup-supabase.mjs` lalu `npm run dev` untuk konfigurasi lokal. Ikuti [panduan auth dan routing](docs/supabase-auth-setup.md) untuk pengaturan URL email, alur PIN, schema dan batasan progres lokal.

## Menyambungkan Supabase secara manual (opsional)

1. Salin `.env.example` menjadi `.env.local` lalu isi:

   | Variabel | Fungsi |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anon |
   | `PARENT_UNLOCK_SECRET` | **Wajib di produksi.** Menandatangani cookie buka-kunci (min. 16 karakter). Kosong di produksi = dasbor tidak terbuka |
   | `SUPABASE_SERVICE_ROLE_KEY` | Hanya untuk cron email. Melewati RLS, jangan di-commit |
   | `CRON_SECRET` | Melindungi `/api/cron/notifications` |
   | `RESEND_API_KEY`, `EMAIL_FROM` | Pengiriman email. Tanpa ini cron hanya *dry-run* |
   | `NEXT_PUBLIC_SITE_URL` | Tautan di dalam email |

   Buat secret acak dengan:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Jalankan migrasi di SQL Editor Supabase, **berurutan**:

   | Berkas | Isi |
   |---|---|
   | `0000_children.sql` | Profil anak. **Lewati bila tabel `children` sudah ada** |
   | `0001_screening_sessions.sql` | Sesi skrining |
   | `0002_learning_tracking.sql` | Riwayat belajar, kuis, latihan, validitas sesi |
   | `0003_notifications.sql` | Status baca notifikasi dan log email |
   | `20261004100821_parent_child_auth_curriculum.sql` | Parent profiles, RPC PIN, kurikulum, progres, cache dan bucket |
   | `20261004101050_optimize_family_rls.sql` | Optimasi policy RLS dan indeks relasi |

   Semuanya aman dijalankan ulang. Opsional untuk pengembangan: `supabase/seed/dev_learning_seed.sql` (jangan di produksi).

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build dan jalankan produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan tipe |
| `npm test` | Vitest: skor, rekomendasi, metrik, kunci dasbor, middleware, notifikasi, dan **migrasi + RLS di Postgres in-process** |
| `npm run export:review` | Ekspor teks rekomendasi untuk psikolog |

## Rute Utama

| Alamat | Pengguna | Keterangan |
|---|---|---|
| `/`, `/cara-kerja`, `/tentang`, `/faq`, `/kontak` | Publik | Halaman informasi |
| `/privasi`, `/syarat`, `/disclaimer` | Publik | Legal dan disclaimer medis |
| `/login`, `/daftar` | Orang tua | Masuk dan daftar (persetujuan wajib) |
| `/auth/callback` | Orang tua | Konfirmasi email PKCE/token hash |
| `/masuk-anak` | Anak | Pilih avatar dan verifikasi PIN |
| `/unlock` | Orang tua | Kata sandi ulang untuk membuka dasbor |
| `/dashboard` | Orang tua | Ringkasan dan notifikasi |
| `/dashboard/child/new` | Orang tua | Tambah profil anak |
| `/dashboard/child/[id]` | Orang tua | Dasbor anak |
| `/dashboard/child/[id]/screening` | Orang tua | Laporan skrining (`?s=<id>` untuk sesi lama) |
| `/dashboard/compare` | Orang tua | Perbandingan dua anak |
| `/screening/[childId]` | Anak | Empat permainan (tanpa menampilkan hasil) |
| `/child/[childId]` | Anak | Beranda anak |
| `/child/[childId]/belajar` | Anak | Modul belajar; latihan di bawah `/latihan/*` dan materi di bawah `/materi/*` |
| `GET /api/cron/notifications` | Cron | Butuh `Authorization: Bearer $CRON_SECRET` |

## Batasan yang Diakui

- Belum ada norma atau data berlabel untuk anak Indonesia. Bobot, ambang, dan akurasi deteksi baru dapat dilaporkan setelah pilot dengan psikolog.
- Teks rekomendasi belum ditinjau psikolog. Laporan menampilkan catatan itu selama statusnya `draft`.
- Daftar tenaga profesional sengaja kosong sampai diverifikasi; sementara itu laporan menampilkan panduan umum mencari bantuan.
- Database/RLS dan verifikasi PIN telah diuji pada project Supabase Eja dalam transaksi rollback. Pengiriman email konfirmasi belum diuji end-to-end.
- Versi pertama membutuhkan internet; ekspor/hapus data akun belum tersedia.
- Progres modul belajar masih di `localStorage` per anak dan browser. Tabel `learning_sessions`, `quiz_results`, dan `practice_results` belum diisi oleh modul ini; penyambungan ke dasbor orang tua adalah pekerjaan berikutnya.

## Tim

Dibuat untuk **JOINTS UGM 2026** oleh tim EJA. Daftar anggota ada di halaman [`/tentang`](app/(site)/tentang/page.tsx).

Repositori: <https://github.com/LVNAx/EJA>
