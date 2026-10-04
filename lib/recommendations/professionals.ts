// FR-22 (P2): daftar tenaga profesional. Daftar awal HARUS diverifikasi psikolog mitra sebelum diisi.
// Sengaja KOSONG: nama, kontak, atau klaim kredensial yang tidak terverifikasi bisa menyesatkan orang tua.
// Tambahkan entri hanya setelah diverifikasi, dengan `verifiedBy` dan `verifiedAt` terisi. Entri tanpa keduanya tidak ditampilkan.

export interface VerifiedProfessional {
  name: string;
  role: string;
  city: string;
  /** Telepon, situs, atau alamat praktik yang sudah diperiksa. */
  contact: string;
  verifiedBy: string;
  /** ISO date, mis. "2026-11-01". */
  verifiedAt: string;
}

export const VERIFIED_PROFESSIONALS: VerifiedProfessional[] = [];

export const verifiedProfessionals = (): VerifiedProfessional[] => VERIFIED_PROFESSIONALS.filter((p) => p.verifiedBy.trim() !== "" && p.verifiedAt.trim() !== "");

/** Panduan umum mencari bantuan selama direktori terverifikasi belum ada. Tidak menyebut nama atau kontak orang tertentu. */
export const REFERRAL_GUIDANCE = [
  "Tanyakan ke puskesmas atau rumah sakit terdekat untuk rujukan ke dokter anak tumbuh kembang atau psikolog klinis.",
  "Sekolah mungkin memiliki guru bimbingan konseling atau psikolog sekolah yang dapat membantu merujuk.",
  "Organisasi profesi seperti Ikatan Dokter Anak Indonesia (IDAI) dan Himpunan Psikologi Indonesia (HIMPSI) dapat menjadi rujukan untuk mencari tenaga yang terdaftar.",
];
