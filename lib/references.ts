export interface Reference {
  id: number;
  authors: string;
  year: string;
  title: string;
  source: string;
}

// Daftar pustaka landasan EJA. Nomor dipakai sebagai kutipan [n] di halaman Tentang.
export const REFERENCES: Reference[] = [
  { id: 1, authors: "Lyon, G. R., Shaywitz, S. E., & Shaywitz, B. A.", year: "2003", title: "A definition of dyslexia", source: "Annals of Dyslexia, 53, 1–14" },
  { id: 2, authors: "Peterson, R. L., & Pennington, B. F.", year: "2012", title: "Developmental dyslexia", source: "The Lancet, 379(9830), 1997–2007" },
  { id: 3, authors: "Melby-Lervåg, M., Lyster, S.-A. H., & Hulme, C.", year: "2012", title: "Phonological skills and their role in learning to read: A meta-analytic review", source: "Psychological Bulletin, 138(2), 322–352" },
  { id: 4, authors: "Denckla, M. B., & Rudel, R. G.", year: "1976", title: "Rapid “automatized” naming (R.A.N.): Dyslexia differentiated from other learning disabilities", source: "Neuropsychologia, 14(4), 471–479" },
  { id: 5, authors: "Wolf, M., & Bowers, P. G.", year: "1999", title: "The double-deficit hypothesis for the developmental dyslexias", source: "Journal of Educational Psychology, 91(3), 415–438" },
  { id: 6, authors: "Ziegler, J. C., & Goswami, U.", year: "2005", title: "Reading acquisition, developmental dyslexia, and skilled reading across languages: A psycholinguistic grain size theory", source: "Psychological Bulletin, 131(1), 3–29" },
  { id: 7, authors: "Landerl, K., et al.", year: "2013", title: "Predictors of developmental dyslexia in European orthographies with varying complexity", source: "Journal of Child Psychology and Psychiatry, 54(6), 686–694" },
  { id: 8, authors: "Seymour, P. H. K., Aro, M., & Erskine, J. M.", year: "2003", title: "Foundation literacy acquisition in European orthographies", source: "British Journal of Psychology, 94(2), 143–174" },
  { id: 9, authors: "Caravolas, M., et al.", year: "2012", title: "Common patterns of prediction of literacy development in different alphabetic orthographies", source: "Psychological Science, 23(6), 678–686" },
  { id: 10, authors: "Jeffries, S., & Everatt, J.", year: "2004", title: "Working memory: Its role in dyslexia and other specific learning difficulties", source: "Dyslexia, 10(3), 196–214" },
  { id: 11, authors: "American Psychiatric Association", year: "2013", title: "Diagnostic and Statistical Manual of Mental Disorders (5th ed.): Specific Learning Disorder", source: "American Psychiatric Publishing" },
  { id: 12, authors: "Snowling, M. J., Hulme, C., & Nation, K.", year: "2020", title: "Defining and understanding dyslexia: Past, present and future", source: "Oxford Review of Education, 46(4), 501–513" },
  { id: 13, authors: "Galuschka, K., Ise, E., Krick, K., & Schulte-Körne, G.", year: "2014", title: "Effectiveness of treatment approaches for children and adolescents with reading disabilities: A meta-analysis of randomized controlled trials", source: "PLoS ONE, 9(2), e89900" },
  { id: 14, authors: "Sweller, J.", year: "1988", title: "Cognitive load during problem solving: Effects on learning", source: "Cognitive Science, 12(2), 257–285" },
  { id: 15, authors: "Paivio, A.", year: "1971", title: "Imagery and verbal processes", source: "Holt, Rinehart & Winston" },
  { id: 16, authors: "Mayer, R. E.", year: "2009", title: "Multimedia learning (2nd ed.)", source: "Cambridge University Press" },
  { id: 17, authors: "Roediger, H. L., & Karpicke, J. D.", year: "2006", title: "Test-enhanced learning: Taking memory tests improves long-term retention", source: "Psychological Science, 17(3), 249–255" },
  { id: 18, authors: "Ehri, L. C., Nunes, S. R., Stahl, S. A., & Willows, D. M.", year: "2001", title: "Systematic phonics instruction helps students learn to read: Evidence from the National Reading Panel's meta-analysis", source: "Review of Educational Research, 71(3), 393–447" },
  { id: 19, authors: "National Institute of Child Health and Human Development", year: "2000", title: "Report of the National Reading Panel: Teaching children to read", source: "NIH Publication No. 00-4769" },
  { id: 20, authors: "Ritchey, K. D., & Goeken, D. L.", year: "2006", title: "Orton-Gillingham and Orton-Gillingham–based reading instruction: A review of the literature", source: "The Journal of Special Education, 40(3), 171–183" },
  { id: 21, authors: "Wood, S. G., Moxley, J. H., Tighe, E. L., & Wagner, R. K.", year: "2018", title: "Does use of text-to-speech and related read-aloud tools improve reading comprehension for students with reading disabilities? A meta-analysis", source: "Journal of Learning Disabilities, 51(1), 73–84" },
];

export interface BasisItem {
  title: string;
  eja: string;
  evidence: string;
  refs: number[];
}

export interface BasisGroup {
  id: string;
  title: string;
  intro: string;
  items: BasisItem[];
}

export const BASIS: BasisGroup[] = [
  {
    id: "skrining",
    title: "Landasan skrining",
    intro: "Empat tes dipilih karena masing-masing berkaitan dengan kemampuan yang konsisten ditemukan berbeda pada anak dengan disleksia.",
    items: [
      { title: "Kesadaran bunyi (bobot 35%)", eja: "Anak memilih gambar yang bunyi awalnya sama dengan kata yang didengar.", evidence: "Kemampuan fonologis merupakan salah satu prediktor terkuat keberhasilan belajar membaca, dan kesulitan fonologis adalah ciri inti disleksia.", refs: [1, 3] },
      { title: "Penamaan cepat (bobot 30%)", eja: "Anak mengenali huruf yang muncul secepat mungkin; skor memperhitungkan kecepatan dan ketepatan.", evidence: "Kecepatan penamaan membedakan anak disleksia dari anak lain, dan menjadi komponen kedua dalam hipotesis defisit ganda.", refs: [4, 5] },
      { title: "Ketepatan ejaan (bobot 20%)", eja: "Anak memilih ejaan yang benar dari kata yang didengar.", evidence: "Pada ortografi alfabetis, kemampuan menghubungkan bunyi dan huruf ikut memprediksi perkembangan literasi.", refs: [9, 8] },
      { title: "Memori kerja (bobot 15%)", eja: "Anak mengulang urutan angka yang bertambah panjang.", evidence: "Keterbatasan memori kerja verbal sering dilaporkan pada kesulitan membaca, walau lebih lemah dibanding prediktor fonologis.", refs: [10] },
      { title: "Fokus pada kelancaran, bukan huruf tertukar", eja: "Skrining memberi bobot pada kecepatan dan ketepatan, tidak pada pembalikan huruf (b/d).", evidence: "Pada ortografi yang transparan seperti Bahasa Indonesia, hambatan utama cenderung berupa membaca lambat dan terputus, bukan kesalahan pengenalan huruf.", refs: [6, 7, 8] },
    ],
  },
  {
    id: "rekomendasi",
    title: "Landasan rekomendasi",
    intro: "Rekomendasi disusun sebagai panduan komunikasi untuk orang tua, bukan hasil klinis.",
    items: [
      { title: "Tiga tingkat risiko", eja: "Risiko rendah, sedang, dan tinggi dipetakan secara longgar ke tingkat ringan, sedang, dan berat pada Specific Learning Disorder.", evidence: "Kerangka DSM-5 membedakan keparahan kesulitan belajar spesifik dalam tiga tingkat. Pemetaan EJA hanya analogi untuk menjelaskan hasil; penetapan tingkat keparahan sebenarnya memerlukan asesmen profesional.", refs: [11] },
      { title: "“Ini bukan soal kecerdasan”", eja: "Setiap hasil menekankan bahwa kesulitan membaca tidak menunjukkan rendahnya kecerdasan anak.", evidence: "Disleksia didefinisikan sebagai kesulitan belajar spesifik yang tidak sebanding dengan kemampuan kognitif lain.", refs: [1, 2] },
      { title: "Rujukan ke profesional", eja: "Level sedang dan tinggi selalu disertai saran konsultasi ke guru, psikolog klinis, atau dokter anak tumbuh kembang.", evidence: "Disleksia dipahami sebagai spektrum tanpa batas yang tegas, sehingga keputusan klinis memerlukan penilaian menyeluruh.", refs: [12] },
      { title: "Saran latihan rutin", eja: "Orang tua diarahkan pada latihan bunyi dan membaca yang terstruktur.", evidence: "Dalam meta-analisis uji acak terkontrol, pengajaran fonik adalah pendekatan dengan efek paling konsisten untuk kesulitan membaca.", refs: [13] },
    ],
  },
  {
    id: "belajar",
    title: "Landasan metode belajar",
    intro: "Cara materi disajikan di EJA mengikuti temuan tentang beban kognitif, memori, dan pengajaran membaca.",
    items: [
      { title: "Satu konsep per langkah", eja: "Materi dipecah menjadi potongan kecil dan ditampilkan satu per satu.", evidence: "Memori kerja terbatas; mengurangi beban yang tidak perlu membantu pembelajaran.", refs: [14] },
      { title: "Gambar dan kata bersama", eja: "Setiap konsep disertai ilustrasi yang relevan, bukan gambar hiasan.", evidence: "Informasi yang dikodekan secara verbal dan visual lebih mudah diingat, dan belajar dari kata plus gambar umumnya lebih baik daripada kata saja.", refs: [15, 16] },
      { title: "Kuis singkat setelah tiap potongan", eja: "Satu pertanyaan muncul setelah setiap potongan materi, bukan hanya di akhir.", evidence: "Mengingat kembali lewat tes memperkuat retensi jangka panjang lebih baik daripada membaca ulang.", refs: [17] },
      { title: "Bertahap, eksplisit, dan melatih bunyi", eja: "Urutan materi jelas, instruksi eksplisit, dan latihan mengucapkan suku kata.", evidence: "Pengajaran fonik sistematis efektif untuk pembaca pemula dan pembaca dengan kesulitan. Bukti untuk metode Orton-Gillingham secara khusus masih terbatas, sehingga EJA mengambil prinsip umumnya, bukan klaim program tertentu.", refs: [18, 19, 20] },
      { title: "Teks dibacakan dengan kata disorot", eja: "Kata disorot saat dibacakan supaya mata tidak kehilangan posisi baris.", evidence: "Alat baca-bersuara cenderung membantu pemahaman bacaan pada siswa dengan kesulitan membaca. Sorotan kata adalah rancangan EJA dan belum kami uji secara terpisah.", refs: [21] },
    ],
  },
];

export const LIMITATIONS = [
  "Bobot (35/30/20/15) mengikuti urutan kekuatan bukti dalam literatur, tetapi angkanya adalah keputusan rancangan tim dan belum dikalibrasi dengan data anak Indonesia.",
  "Batas skor 0,75 dan 0,45 bersifat heuristik. Belum ada data norma, sensitivitas, atau spesifisitas untuk menyatakan akurasi skrining ini.",
  "Soal dan stimulus dibuat oleh tim dan belum ditinjau psikolog atau ahli bahasa.",
  "Kondisi anak saat bermain, perangkat, dan suara sekitar dapat memengaruhi hasil.",
  "Langkah berikutnya: validasi bersama psikolog, uji pada sampel anak SD, dan penyesuaian bobot serta batas skor berdasarkan data.",
];
