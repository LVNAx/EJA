import { z } from "zod";

// Penjelasan saran pendampingan dengan Groq (API chat completions yang kompatibel OpenAI).
// Hanya angka dan nama keterampilan yang dikirim: tidak ada nama, ID, atau rekaman anak.
// AI menyusun ulang kalimat untuk orang tua; ia tidak membuat penilaian baru.

export const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const MAX_EXPLANATION_CHARS = 1200;

const text = (max: number) => z.string().trim().min(1).max(max);
const count = z.number().int().min(0).max(20);
const ratio = z.number().min(0).max(1);

export const adviceInputSchema = z.object({
  focus: z.object({ label: text(60), reason: text(300), support: text(300) }),
  skills: z
    .array(
      z.object({
        label: text(40),
        sessions: count,
        successes: count,
        probability: ratio.nullable(),
        interval: z.tuple([ratio, ratio]).nullable(),
        trend: text(80),
      }),
    )
    .max(6),
});

export type AdviceInput = z.infer<typeof adviceInputSchema>;

const SYSTEM_PROMPT = [
  "Kamu membantu orang tua anak SD memahami catatan latihan dari aplikasi belajar EJA.",
  "Tulis dalam Bahasa Indonesia yang sederhana dan hangat: paling banyak 3 kalimat pendek, lalu 2 sampai 3 langkah konkret, masing-masing diawali tanda '- '.",
  "Aturan yang wajib diikuti:",
  "1. Jangan menyebut, menebak, atau menyiratkan diagnosis, disleksia, tingkat risiko, atau label apa pun tentang anak.",
  "2. Jangan menambahkan angka, persentase, atau fakta yang tidak ada di data.",
  "3. Jangan menyalahkan anak atau orang tua, dan hindari kata seperti rendah, buruk, lemah, atau gagal. Bantuan dan percobaan ulang itu wajar.",
  "4. Jika data masih sedikit atau rentangnya lebar, katakan bahwa perkiraan belum pasti.",
  "5. Jika orang tua khawatir, sarankan berdiskusi dengan guru BK atau psikolog.",
  "6. Tanpa judul, tanpa huruf tebal, tanpa emoji.",
].join("\n");

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Data yang dikirim ke model, dalam bentuk teks yang mudah dibaca. */
export function describeInput(input: AdviceInput): string {
  const lines = input.skills.map((s) => {
    const estimate =
      s.probability === null || !s.interval
        ? "belum cukup data untuk perkiraan"
        : `perkiraan ${pct(s.probability)} (rentang ${pct(s.interval[0])}-${pct(s.interval[1])})`;
    return `- ${s.label}: ${s.successes} dari ${s.sessions} sesi mencapai target; ${estimate}; ${s.trend}`;
  });
  return [
    `Saran yang perlu dijelaskan: ${input.focus.label}.`,
    `Alasan dari aplikasi: ${input.focus.reason}`,
    `Cara mendampingi dari aplikasi: ${input.focus.support}`,
    "Catatan latihan:",
    ...(lines.length ? lines : ["- belum ada latihan yang dinilai"]),
  ].join("\n");
}

export function buildRequest(input: AdviceInput, model = DEFAULT_GROQ_MODEL) {
  return {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: describeInput(input) },
    ],
    temperature: 0.3,
    // gpt-oss memakai token penalaran; jawaban akhirnya tetap pendek.
    max_tokens: 1200,
    reasoning_effort: "low",
    include_reasoning: false,
  };
}

/** Ambil teks dari respons chat completions (choices[0].message.content). */
export function extractText(body: unknown): string | null {
  const content = (body as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

/** Rapikan keluaran: buang markdown tebal/judul dan batasi panjang. */
export function cleanExplanation(raw: string): string {
  const cleaned = raw
    .replace(/\*\*|__/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/[—–]/g, "-")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length <= MAX_EXPLANATION_CHARS) return cleaned;
  const cut = cleaned.slice(0, MAX_EXPLANATION_CHARS);
  return cut.slice(0, Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". ") + 1)).trim() || cut.trim();
}

export type ExplainResult = { ok: true; text: string } | { ok: false; reason: "unconfigured" | "invalid" | "unavailable" };

export async function explainWithGroq(
  raw: unknown,
  opts: { apiKey?: string; model?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<ExplainResult> {
  if (!opts.apiKey) return { ok: false, reason: "unconfigured" };
  const parsed = adviceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const doFetch = opts.fetchImpl ?? fetch;
  // Prompt saja tidak cukup: jawaban yang tetap menyebut istilah terlarang diminta ulang sekali, lalu ditolak.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await doFetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}` },
        body: JSON.stringify(buildRequest(parsed.data, opts.model || DEFAULT_GROQ_MODEL)),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
        cache: "no-store",
      });
      if (!res.ok) return { ok: false, reason: "unavailable" };
      const out = extractText(await res.json());
      if (!out) return { ok: false, reason: "unavailable" };
      const text = cleanExplanation(out);
      if (!violatesGuardrail(text)) return { ok: true, text };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }
  return { ok: false, reason: "unavailable" };
}

/** Istilah yang tidak boleh muncul di penjelasan untuk orang tua. */
export const FORBIDDEN_TERMS = /diagnos|disleksia|dyslexi|\brisiko\b|\bberisiko\b|\brendah\b|\bbodoh\b|\blambat belajar\b|\bgagal\b/i;
export const violatesGuardrail = (text: string) => FORBIDDEN_TERMS.test(text);
