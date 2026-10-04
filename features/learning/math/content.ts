import { z } from "zod";

const fractionVisual = z
  .object({
    type: z.literal("fraction"),
    parts: z.number().int().min(1).max(12),
    selected: z.number().int().min(0).max(12),
    label: z.string().optional(),
  })
  .refine(
    (visual) => visual.selected <= visual.parts,
    "Bagian terpilih melebihi jumlah bagian",
  );

const groupedVisual = z.object({
  type: z.literal("grouped_objects"),
  groups: z.number().int().min(1).max(6),
  perGroup: z.number().int().min(1).max(8),
  emoji: z.string().max(4),
});

export const visualSchema = z.union([fractionVisual, groupedVisual]);
export const quizSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    answerIndex: z.number().int().min(0),
    explanation: z.string().min(1),
  })
  .refine(
    (quiz) => quiz.answerIndex < quiz.options.length,
    "Jawaban di luar pilihan",
  );
export const chunkSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["concept", "quiz"]),
    title: z.string().min(1),
    text: z.string().min(1),
    visual: visualSchema,
    readingTarget: z.string().optional(),
    quiz: quizSchema.optional(),
  })
  .refine(
    (chunk) => chunk.type !== "quiz" || !!chunk.quiz,
    "Langkah kuis memerlukan pertanyaan",
  );
export const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subject: z.literal("Matematika"),
  level: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  icon: z.enum(["fraction", "multiply"]),
  chunks: z.array(chunkSchema).min(2),
});

export type Visual = z.infer<typeof visualSchema>;
export type Chunk = z.infer<typeof chunkSchema>;
export type Lesson = z.infer<typeof lessonSchema>;

const rawLessons = [
  {
    id: "pecahan-dasar",
    title: "Mengenal Pecahan",
    subject: "Matematika",
    level: "Kelas 4–6",
    description: "Temukan arti satu bagian dari satu benda utuh.",
    durationMinutes: 6,
    icon: "fraction",
    chunks: [
      {
        id: "utuh",
        type: "concept",
        title: "Satu benda utuh",
        text: "Ini satu lingkaran utuh. Belum ada bagian yang dipisah.",
        visual: { type: "fraction", parts: 1, selected: 1, label: "1 utuh" },
        readingTarget: "utuh",
      },
      {
        id: "empat",
        type: "concept",
        title: "Empat bagian sama",
        text: "Sekarang lingkaran dibagi menjadi empat bagian sama besar.",
        visual: {
          type: "fraction",
          parts: 4,
          selected: 0,
          label: "4 bagian sama",
        },
        readingTarget: "bagian",
      },
      {
        id: "satu-bagian",
        type: "concept",
        title: "Pilih satu bagian",
        text: "Satu dari empat bagian diberi warna. Bagian itu disebut seperempat.",
        visual: {
          type: "fraction",
          parts: 4,
          selected: 1,
          label: "1 dari 4 bagian",
        },
        readingTarget: "seperempat",
      },
      {
        id: "simbol",
        type: "concept",
        title: "Ditulis ¼",
        text: "Seperempat ditulis ¼. Angka atas berarti bagian dipilih, angka bawah jumlah bagian.",
        visual: {
          type: "fraction",
          parts: 4,
          selected: 1,
          label: "¼ = satu dari empat",
        },
        readingTarget: "seperempat",
      },
      {
        id: "kuis",
        type: "quiz",
        title: "Yuk, coba!",
        text: "Perhatikan bagian yang berwarna. Berapa bagian yang dipilih?",
        visual: {
          type: "fraction",
          parts: 4,
          selected: 1,
          label: "Lihat bagian berwarna",
        },
        quiz: {
          question: "Pecahan mana yang sesuai dengan gambar?",
          options: ["¼", "½", "¾"],
          answerIndex: 0,
          explanation: "Betul! Satu dari empat bagian adalah ¼.",
        },
      },
    ],
  },
  {
    id: "perkalian-kelompok",
    title: "Perkalian dengan Kelompok",
    subject: "Matematika",
    level: "Kelas 4–6",
    description: "Hitung benda dengan kelompok yang sama banyak.",
    durationMinutes: 5,
    icon: "multiply",
    chunks: [
      {
        id: "kelompok",
        type: "concept",
        title: "Lihat kelompoknya",
        text: "Ada tiga kelompok bintang. Setiap kelompok berisi dua bintang.",
        visual: { type: "grouped_objects", groups: 3, perGroup: 2, emoji: "★" },
        readingTarget: "kelompok",
      },
      {
        id: "tambah",
        type: "concept",
        title: "Jumlahkan semuanya",
        text: "Dua ditambah dua ditambah dua sama dengan enam.",
        visual: { type: "grouped_objects", groups: 3, perGroup: 2, emoji: "★" },
      },
      {
        id: "kali",
        type: "concept",
        title: "Cara singkat",
        text: "Tiga kelompok berisi dua benda ditulis 3 × 2. Hasilnya enam.",
        visual: { type: "grouped_objects", groups: 3, perGroup: 2, emoji: "★" },
        readingTarget: "perkalian",
      },
      {
        id: "kuis",
        type: "quiz",
        title: "Giliranmu!",
        text: "Hitung semua bintang di dalam kelompok.",
        visual: { type: "grouped_objects", groups: 2, perGroup: 3, emoji: "★" },
        quiz: {
          question: "Dua kelompok berisi tiga bintang. Berapa semuanya?",
          options: ["5", "6", "8"],
          answerIndex: 1,
          explanation: "Ya! Tiga ditambah tiga sama dengan enam.",
        },
      },
    ],
  },
] as const;

export const lessons: Lesson[] = rawLessons.map((lesson) =>
  lessonSchema.parse(lesson),
);
export const lessonById = (id: string) =>
  lessons.find((lesson) => lesson.id === id);
