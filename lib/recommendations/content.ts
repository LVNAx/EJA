import type { DimensionKey, RiskLevel } from "@/lib/screening/scoring";

/**
 * Seluruh teks rekomendasi ada di berkas ini supaya psikolog mitra bisa meninjau satu tempat
 * (jalankan `npm run export:review` untuk berkas bacaan). Pedoman nada (Lampiran B.10): bahasa awam,
 * tidak menyalahkan, tidak membuat cemas, selalu tegas bahwa ini bukan diagnosis.
 *
 * Ubah `CONTENT_REVIEW` menjadi "reviewed" HANYA setelah psikolog benar-benar meninjau; catatan di laporan
 * orang tua mengikuti nilai ini.
 */
export const CONTENT_REVIEW: { status: "draft" | "reviewed"; reviewedBy?: string; reviewedAt?: string } = { status: "draft" };

export const DRAFT_NOTICE = "Saran di halaman ini disusun tim EJA dan belum ditinjau psikolog. Anggap sebagai panduan umum, bukan nasihat klinis.";

export type DimensionBand = "good" | "watch" | "attention";

export interface DimensionCopy {
  label: string;
  short: string;
  /** Apa yang diukur, dalam bahasa awam. */
  measures: string;
  /** Arti hasil per pita. */
  meaning: Record<DimensionBand, string>;
  /** Saran konkret bila dimensi ini perlu perhatian. */
  parentTips: string[];
  teacherTips: string[];
  /** Cara belajar yang sering membantu bila dimensi ini lemah. */
  helpfulApproach: string;
}

export const DIMENSION_COPY: Record<DimensionKey, DimensionCopy> = {
  phonological: {
    label: "Kesadaran Bunyi",
    short: "Bunyi",
    measures: "Kemampuan mendengar dan membedakan bunyi dalam kata, misalnya bunyi awal “b” pada “bola”. Ini dasar untuk mengubah huruf menjadi bunyi saat membaca.",
    meaning: {
      good: "Anak mengenali bunyi dalam kata dengan baik pada sesi ini.",
      watch: "Anak sudah mengenali sebagian besar bunyi, tetapi masih ada yang keliru. Layak dipantau.",
      attention: "Anak kesulitan mengenali bunyi dalam kata. Ini salah satu tanda yang paling sering dikaitkan dengan kesulitan membaca, jadi perlu diperhatikan.",
    },
    parentTips: [
      "Mainkan tebak bunyi awal di rumah: “Apa bunyi pertama dari kata meja?”",
      "Ajak anak memenggal kata menjadi suku kata sambil bertepuk, misalnya ma-kan.",
      "Bacakan buku bersajak atau lagu anak dengan suara jelas, lalu minta anak menebak kata yang berima.",
    ],
    teacherTips: ["Beri contoh bunyi secara lisan sebelum meminta anak menulis atau membaca.", "Pakai pemenggalan suku kata saat mengenalkan kata baru."],
    helpfulApproach: "Belajar dengan suara dan gambar bersamaan, dengan kata dipenggal menjadi suku kata.",
  },
  rapidNaming: {
    label: "Penamaan Cepat",
    short: "Cepat",
    measures: "Seberapa cepat dan otomatis anak mengenali huruf yang dilihatnya. Pada Bahasa Indonesia, kesulitan membaca sering tampak sebagai membaca yang lambat dan terputus-putus.",
    meaning: {
      good: "Anak mengenali huruf dengan cepat dan tepat pada sesi ini.",
      watch: "Anak cukup tepat, tetapi kecepatannya masih bisa meningkat. Layak dipantau.",
      attention: "Anak mengenali huruf dengan lambat atau kurang tepat. Di kelas ini bisa terlihat sebagai membaca yang pelan dan terputus-putus.",
    },
    parentTips: [
      "Latihan singkat dan rutin lebih efektif daripada latihan panjang, misalnya 5 menit setiap hari.",
      "Beri waktu cukup saat anak membaca. Hindari menyela atau menebak kata untuknya.",
      "Baca bergantian: orang tua satu kalimat, anak satu kalimat.",
    ],
    teacherTips: ["Hindari meminta anak membaca nyaring di depan kelas tanpa persiapan.", "Beri tambahan waktu pada tugas membaca dan ujian."],
    helpfulApproach: "Latihan pendek berulang tanpa tekanan waktu, dengan umpan balik yang lembut.",
  },
  spelling: {
    label: "Ketepatan Ejaan",
    short: "Ejaan",
    measures: "Kemampuan memilih tulisan yang tepat untuk bunyi yang didengar, yaitu mengubah bunyi menjadi huruf.",
    meaning: {
      good: "Anak memilih ejaan yang benar dengan baik pada sesi ini.",
      watch: "Anak sering tepat, tetapi masih ada ejaan yang keliru. Layak dipantau.",
      attention: "Anak sering keliru memilih ejaan. Tulisannya mungkin tampak salah huruf atau terbalik urutannya.",
    },
    parentTips: [
      "Tampilkan kata dalam suku kata berwarna, misalnya me-nu-lis, lalu minta anak menyusun ulang.",
      "Ajak anak menulis kata dengan jari di pasir, di meja, atau di udara sambil mengucapkannya.",
      "Koreksi satu kesalahan pada satu waktu dan puji bagian yang sudah benar.",
    ],
    teacherTips: ["Nilai isi jawaban terpisah dari ejaan bila tujuannya menguji pemahaman.", "Beri daftar kata kunci pada tugas menulis."],
    helpfulApproach: "Menulis sambil mengucapkan, dengan pemenggalan suku kata berwarna.",
  },
  digitSpan: {
    label: "Memori Kerja",
    short: "Memori",
    measures: "Kemampuan menyimpan beberapa informasi sesaat, misalnya mengingat urutan angka atau instruksi yang baru didengar.",
    meaning: {
      good: "Anak mampu mengingat urutan dengan baik pada sesi ini.",
      watch: "Anak mampu mengingat urutan pendek, tetapi urutan yang lebih panjang masih sulit. Layak dipantau.",
      attention: "Anak sulit mengingat urutan beberapa angka. Instruksi yang panjang mungkin mudah terlewat.",
    },
    parentTips: [
      "Beri instruksi satu per satu: “Ambil tasmu.” Setelah selesai, “Sekarang pakai sepatu.”",
      "Tulis atau gambar daftar tugas harian agar anak tidak perlu mengingat semuanya.",
      "Minta anak mengulang instruksi dengan kata-katanya sendiri.",
    ],
    teacherTips: ["Tulis instruksi di papan selain mengucapkannya.", "Pecah tugas panjang menjadi langkah kecil yang diberikan bertahap."],
    helpfulApproach: "Materi dipecah kecil, satu langkah satu waktu, dengan catatan visual.",
  },
};

export interface LevelCopy {
  label: string;
  /** Arti bagi orang tua (proposal Bab 4, Modul 2). */
  meaning: string;
  reassurance: string;
  consultUrgency: "monitor" | "consider" | "soon";
  consult: string;
  retest: string;
  parentActions: string[];
  teacherActions: string[];
}

export const LEVEL_COPY: Record<RiskLevel, LevelCopy> = {
  low: {
    label: "Risiko Rendah",
    meaning: "Tidak ada tanda yang menonjol pada sesi ini.",
    reassurance: "Kemampuan dasar membaca anak berada di rentang yang diharapkan. Hasil ini tidak menjamin bahwa kesulitan tidak akan muncul, jadi tetap perhatikan perkembangan anak.",
    consultUrgency: "monitor",
    consult: "Belum perlu konsultasi berdasarkan hasil ini. Bila Anda atau guru tetap khawatir tentang cara anak membaca, tetap boleh berkonsultasi.",
    retest: "Ulangi skrining setiap semester, atau lebih cepat bila kekhawatiran muncul.",
    parentActions: ["Lanjutkan belajar di EJA secara rutin.", "Tetap bacakan atau baca bersama anak beberapa menit setiap hari."],
    teacherActions: ["Tidak ada akomodasi khusus yang diperlukan berdasarkan hasil ini."],
  },
  moderate: {
    label: "Risiko Sedang",
    meaning: "Ada beberapa tanda kesulitan membaca.",
    reassurance: "Ini bukan diagnosis, dan banyak anak terbantu oleh dukungan yang tepat di rumah dan di kelas. Langkah terbaik adalah memantau dan mulai memberi dukungan sekarang.",
    consultUrgency: "consider",
    consult: "Pertimbangkan berkonsultasi dengan psikolog pendidikan, terutama bila tanda ini juga terlihat di sekolah atau tidak membaik setelah beberapa minggu latihan.",
    retest: "Ulangi skrining dalam 4 sampai 8 minggu setelah latihan rutin untuk melihat perubahannya.",
    parentActions: [
      "Ikut latihan rutin di EJA, singkat tetapi sering.",
      "Diskusikan hasil ini dengan wali kelas dan catat contoh kesulitan yang terlihat.",
      "Pantau perkembangan dari dasbor setiap minggu.",
    ],
    teacherActions: ["Beri waktu lebih panjang pada tugas dan ujian.", "Atur tempat duduk di depan agar mudah diberi arahan.", "Tambahkan instruksi lisan di samping instruksi tertulis."],
  },
  high: {
    label: "Risiko Tinggi",
    meaning: "Ada banyak tanda yang konsisten.",
    reassurance: "Ini bukan diagnosis dan bukan kesalahan siapa pun. Hasil ini adalah alasan yang baik untuk segera bertemu profesional, dan anak tetap bisa belajar dengan dukungan yang sesuai.",
    consultUrgency: "soon",
    consult: "Segera konsultasikan dengan psikolog klinis, dokter anak tumbuh kembang, atau terapis wicara agar anak mendapat pemeriksaan yang tepat.",
    retest: "Ulangi skrining bila diminta profesional, atau setelah beberapa minggu untuk melihat perkembangan. Hasil ulang tidak menggantikan pemeriksaan profesional.",
    parentActions: [
      "Buat janji konsultasi dan bawa laporan ini beserta contoh buku tulis anak.",
      "Tetap belajar dengan EJA dalam sesi singkat agar anak tidak kehilangan kepercayaan diri.",
      "Beri tahu wali kelas agar anak mendapat akomodasi sambil menunggu konsultasi.",
    ],
    teacherActions: [
      "Beri waktu lebih panjang pada tugas dan ujian.",
      "Izinkan jawaban lisan bila memungkinkan.",
      "Hindari membaca nyaring di depan kelas tanpa persiapan.",
      "Tambahkan instruksi lisan di samping instruksi tertulis.",
    ],
  },
};

/** Jenis profesional (bukan nama orang). Direktori terverifikasi adalah FR-22 (P2). */
export const PROFESSIONALS: { role: string; note: string; levels: RiskLevel[] }[] = [
  { role: "Psikolog klinis anak", note: "Melakukan asesmen menyeluruh dan dapat menegakkan diagnosis.", levels: ["moderate", "high"] },
  { role: "Dokter anak tumbuh kembang", note: "Memeriksa perkembangan anak dan menyingkirkan penyebab lain, seperti gangguan penglihatan atau pendengaran.", levels: ["high"] },
  { role: "Psikolog pendidikan", note: "Menilai kebutuhan belajar dan menyarankan akomodasi di sekolah.", levels: ["moderate", "high"] },
  { role: "Terapis wicara", note: "Membantu bila ada kesulitan bunyi bahasa atau ucapan.", levels: ["high"] },
];

export const BRING_TO_CONSULT = [
  "Laporan skrining ini (PDF) beserta tanggal tesnya.",
  "Contoh buku tulis atau tugas membaca anak.",
  "Catatan atau komentar dari wali kelas.",
  "Riwayat perkembangan bicara dan bahasa anak, serta riwayat pemeriksaan penglihatan dan pendengaran.",
];

export const FACTORS_AFFECTING_RESULT = ["Anak sedang lelah, lapar, atau kurang fokus.", "Perangkat atau suara yang kurang baik.", "Suasana di sekitar yang ramai.", "Anak belum terbiasa dengan format permainan."];

export const CAVEAT_APPROACH = "Banyak anak terbantu oleh pendekatan ini, tetapi tidak berlaku untuk semua anak. Sesuaikan dengan apa yang paling nyaman bagi anak Anda.";
