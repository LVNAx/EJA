# Supabase auth dan routing EJA

Project: `xnlnzdixcwuichejzgbg` (Eja). Schema dan bucket gambar privat sudah diterapkan pada project tersebut. Migrasi baru ada di `supabase/migrations/20261004100821_parent_child_auth_curriculum.sql` dan `20261004101050_optimize_family_rls.sql`. Jangan jalankan seed demo di project ini.

## Menjalankan lokal

Jalankan di folder proyek yang memiliki `package.json`, setelah perubahan kode diterapkan:

```powershell
npm install
node scripts/setup-supabase.mjs
npm run dev
```

Setup membuat `.env.local` yang terhubung ke project Eja dengan publishable key dan secret sesi acak lokal. Tidak membutuhkan service-role key untuk daftar, login, membuat profil atau memeriksa PIN. Berkas `.env.local` dan cadangannya diabaikan Git; jangan bagikan. Kalau env sudah menunjuk project berbeda, setup berhenti. Port lokal yang dikonfigurasi adalah 3000.

## Konfirmasi email

Project mengaktifkan email dan konfirmasi email. Buka Authentication → URL Configuration pada dashboard Supabase:

- Site URL untuk pengembangan: `http://localhost:3000`
- Tambahkan Redirect URL: `http://localhost:3000/auth/callback`
- Saat deploy, tambahkan URL callback domain produksi dan isi `NEXT_PUBLIC_SITE_URL` dengan domain tersebut pada hosting.

Pengaturan URL tidak dapat diubah melalui koneksi Supabase yang tersedia dalam sesi ini. Endpoint callback aplikasi mendukung kode PKCE dan token hash. Untuk konfirmasi lintas browser, template Confirm signup dapat menggunakan tautan:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Konfirmasi email</a>
```

Jika memakai template standar PKCE, buka tautan konfirmasi pada browser tempat mendaftar agar cookie verifier tersedia. Callback mengarahkan orang tua ke `/unlock` untuk memasukkan kata sandi sebelum membuka data anak. Email konfirmasi aktual belum dikirim atau diuji oleh Codex; verifikasi pertama dilakukan saat Anda mendaftar.

## Alur penggunaan

1. Buka `http://localhost:3000/daftar`, isi akun orang tua dan persetujuan.
2. Konfirmasi email lalu masuk dengan kata sandi.
3. Di `/dashboard`, buat profil anak dengan avatar dan PIN empat angka.
4. Pilih mode anak: dashboard ortu terkunci, `/masuk-anak` meminta avatar dan PIN.
5. PIN sukses membuka `/child/<id>`; rute belajar dan skrining hanya menerima sesi untuk ID anak tersebut.
6. Tombol Ganti anak mencabut sesi anak. Pilih profil dan masukkan PIN lagi.
7. Tombol Orang tua membuka `/unlock`; kata sandi benar mencabut sesi anak dan membuka dasbor orang tua.
8. Orang tua bisa mengganti PIN pada dasbor per anak. Lima PIN salah mengunci percobaan selama 15 menit; penggantian PIN menghapus penguncian tersebut.

Anak tetap berada di bawah sesi Supabase orang tua, sesuai rancangan dokumen ide. Cookie HttpOnly bertanda tangan membatasi profil pada routing dan server actions EJA. Ini bukan identitas JWT anak terpisah: RLS Data API mengisolasi keluarga berdasarkan akun orang tua. PIN diperlukan kembali ketika cookie anak habis (8 jam). Buka-kunci dashboard ortu berlaku 30 menit dan diperpanjang saat aktif.

## Schema

| Tabel | Isi dan akses |
|---|---|
| `auth.users` | Identitas dan kredensial orang tua dikelola Supabase Auth |
| `parent_profiles` | Nama dan catatan persetujuan; dibuat otomatis saat signup |
| `children` | Profil, avatar, kelas, hash PIN, counter dan cooldown; kolom PIN tidak terbaca klien |
| `screening_sessions` | Empat skor, status validitas dan hasil; keluarga masing-masing |
| `units` → `lessons` → `lesson_chunks` | Kurikulum, prasyarat dan konten bertahap; hanya konten approved dapat dibaca |
| `learning_sessions` → `chunks_completed`, `quiz_results` | Sesi dan hasil per langkah; constraint memastikan ID sesi sesuai ID anak |
| `practice_results` | Akurasi menulis/berbicara dan hitungan pengulangan |
| `child_learning_progress` | Tempat penyimpanan progres per anak di server; belum ditulis oleh modul belajar lokal |
| `image_cache` | Cache ilustrasi approved, bucket privat `eja-learning-images` |
| `notification_reads`, `notification_log` | Status baca dan log cron; log hanya untuk server service-role |

Fungsi publik `verify_child_pin` dan `set_child_pin` adalah pembungkus security-invoker. Operasi hash dan row-lock berada dalam schema `private`, dengan pemeriksaan `auth.uid()`, search_path kosong dan izin execute terbatas. Tidak ada akun Supabase terpisah untuk anak.

## Validasi dan batasan

- PIN bcrypt, salah PIN, cooldown, reset, privasi hash, kepemilikan dan akses tanpa autentikasi diuji langsung di Supabase dalam transaksi rollback.
- API publik menolak pembacaan profil dan pemanggilan PIN tanpa autentikasi (HTTP 401).
- Tes lokal meliputi migrasi PostgreSQL/PGlite, isolasi RLS, keterkaitan hasil/sesi, tanda tangan cookie, redirect, dan server actions PIN.
- Log email tetap RLS aktif tanpa policy: disengaja karena seluruh akses anon/authenticated dicabut; hanya cron memakai service-role.
- Progres belajar prototipe masih tersimpan di browser. Tabel progres tersedia, tetapi sinkronisasi latihan ke dashboard ortu bukan bagian integrasi auth ini.
- Pengiriman email konfirmasi dan UI mikrofon membutuhkan verifikasi manual di browser pengguna.
