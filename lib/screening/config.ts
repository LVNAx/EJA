// Semua angka di sini adalah ASUMSI AWAL (proposal Bab 4, BR-01 s.d. BR-04).
// Dikalibrasi lewat pilot dengan psikolog; jangan tersebar di komponen.
export const SCREENING_CONFIG = {
  weights: { phonological: 0.35, rapidNaming: 0.3, spelling: 0.2, digitSpan: 0.15 },
  // Skor gabungan > low = Risiko Rendah, > moderate = Risiko Sedang, selain itu Risiko Tinggi.
  levelThresholds: { low: 0.75, moderate: 0.45 },
  // Satu dimensi di bawah angka ini menaikkan status satu tingkat (BR-02).
  escalationBelow: 0.3,
  // Pita per dimensi untuk penjelasan di laporan. Memakai ambang yang sama dengan tingkat risiko.
  dimensionBands: { good: 0.75, watch: 0.45 },

  // Skor per butir penamaan cepat = speedWeight * kecepatan + (1 - speedWeight) * ketepatan.
  rapidNaming: { maxMs: 3000, speedWeight: 0.5 },
  // Skor memori kerja = (rentang tertinggi - floor) / range, dibatasi 0..1.
  // Dengan floor 2 dan range 5, rentang 3 angka (level terendah tes) bernilai 0,2 dan memicu eskalasi.
  // Belum ada norma per kelas; ini yang paling perlu dikalibrasi pilot.
  digitSpan: { floor: 2, range: 5 },

  // Mutu sesi (FR-18). Butir yang dijawab lebih cepat dari batas dianggap tebakan.
  // Penamaan cepat memang menuntut kecepatan, jadi batasnya jauh lebih rendah.
  quality: {
    fastAnswerMs: { phonological: 1000, spelling: 1000, rapidNaming: 400 },
    // Sesi tidak valid bila porsi jawaban terlalu cepat melebihi angka ini.
    maxFastShare: 0.5,
  },

  // BR-04: ulang sesi dibatasi 2 kali per hari per anak (tidak termasuk sesi pertama hari itu).
  maxRetestsPerDay: 2,
} as const;

/** Sesi per hari yang diizinkan: satu sesi awal ditambah ulang. */
export const MAX_SCREENINGS_PER_DAY = 1 + SCREENING_CONFIG.maxRetestsPerDay;
