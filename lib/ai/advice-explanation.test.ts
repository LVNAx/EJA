import { describe, expect, it, vi } from "vitest";
import {
  adviceInputSchema,
  buildRequest,
  cleanExplanation,
  describeInput,
  explainWithGroq,
  extractText,
  MAX_EXPLANATION_CHARS,
  GROQ_ENDPOINT,
  violatesGuardrail,
  type AdviceInput,
} from "./advice-explanation";

const input: AdviceInput = {
  focus: { label: "Pecahan", reason: "Target belum tercapai pada 3 dari 4 sesi terakhir.", support: "Ulangi gambar kue yang dibagi sama besar." },
  skills: [
    { label: "Membaca", sessions: 6, successes: 4, probability: 0.63, interval: [0.34, 0.87], trend: "Target lebih sering tercapai" },
    { label: "Pecahan", sessions: 2, successes: 0, probability: null, interval: null, trend: "Belum cukup sesi" },
  ],
};

const okResponse = (text: string) =>
  ({ ok: true, json: async () => ({ choices: [{ message: { role: "assistant", content: text } }] }) }) as Response;

describe("penjelasan saran dengan Groq", () => {
  it("hanya mengirim angka dan nama keterampilan, tanpa ID atau nama anak", () => {
    const body = JSON.stringify(buildRequest(adviceInputSchema.parse({ ...input, childId: "anak-123", name: "Rizky" })));
    expect(body).not.toContain("anak-123");
    expect(body).not.toContain("Rizky");
    expect(describeInput(input)).toContain("4 dari 6 sesi");
    expect(describeInput(input)).toContain("belum cukup data");
  });

  it("melarang model memberi diagnosis atau label risiko", () => {
    const system = buildRequest(input).messages[0].content;
    expect(system).toMatch(/diagnosis/);
    expect(system).toMatch(/tingkat risiko/);
  });

  it("menolak masukan berlebihan atau tidak valid", () => {
    expect(adviceInputSchema.safeParse({ ...input, focus: { ...input.focus, reason: "x".repeat(301) } }).success).toBe(false);
    expect(adviceInputSchema.safeParse({ ...input, skills: Array(7).fill(input.skills[0]) }).success).toBe(false);
    expect(adviceInputSchema.safeParse({ ...input, skills: [{ ...input.skills[0], probability: 1.5 }] }).success).toBe(false);
  });

  it("membaca teks dari choices[0].message.content", () => {
    expect(extractText({ choices: [{ message: { content: " Halo " } }] })).toBe("Halo");
    expect(extractText({ choices: [{ message: { content: "" } }] })).toBeNull();
    expect(extractText({ choices: [] })).toBeNull();
    expect(extractText(null)).toBeNull();
  });

  it("merapikan markdown dan membatasi panjang", () => {
    expect(cleanExplanation("## Judul\n**Tebal** — teks")).toBe("Judul\nTebal - teks");
    expect(cleanExplanation("Kalimat. ".repeat(400)).length).toBeLessThanOrEqual(MAX_EXPLANATION_CHARS);
  });

  it("tanpa API key tidak memanggil jaringan", async () => {
    const fetchImpl = vi.fn();
    expect(await explainWithGroq(input, { fetchImpl })).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("memanggil endpoint Groq dengan kunci di header dan mengembalikan teks", async () => {
    const fetchImpl = vi.fn(async () => okResponse("Anak sudah berusaha.\n- Ulangi bersama"));
    const result = await explainWithGroq(input, { apiKey: "kunci", fetchImpl });
    expect(result).toEqual({ ok: true, text: "Anak sudah berusaha.\n- Ulangi bersama" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(GROQ_ENDPOINT);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer kunci");
    expect(String(init.body)).not.toContain("kunci");
  });

  it("meminta ulang sekali bila jawaban menyebut istilah terlarang, lalu menolak", async () => {
    const retry = vi.fn().mockResolvedValueOnce(okResponse("Kemampuan pecahan masih rendah.")).mockResolvedValueOnce(okResponse("Ayo ulangi pecahan bersama."));
    expect(await explainWithGroq(input, { apiKey: "k", fetchImpl: retry })).toEqual({ ok: true, text: "Ayo ulangi pecahan bersama." });
    expect(retry).toHaveBeenCalledTimes(2);
    const always = vi.fn(async () => okResponse("Anak mungkin berisiko disleksia."));
    expect(await explainWithGroq(input, { apiKey: "k", fetchImpl: always })).toEqual({ ok: false, reason: "unavailable" });
    expect(always).toHaveBeenCalledTimes(2);
    expect(violatesGuardrail("Diskusikan dengan guru BK atau psikolog.")).toBe(false);
  });

  it("gagal dengan tenang bila API error, timeout, atau respons kosong", async () => {
    expect(await explainWithGroq(input, { apiKey: "k", fetchImpl: async () => ({ ok: false }) as Response })).toEqual({ ok: false, reason: "unavailable" });
    expect(await explainWithGroq(input, { apiKey: "k", fetchImpl: async () => { throw new Error("timeout"); } })).toEqual({ ok: false, reason: "unavailable" });
    expect(await explainWithGroq(input, { apiKey: "k", fetchImpl: async () => ({ ok: true, json: async () => ({}) }) as Response })).toEqual({ ok: false, reason: "unavailable" });
    expect(await explainWithGroq({ focus: {} }, { apiKey: "k", fetchImpl: vi.fn() })).toEqual({ ok: false, reason: "invalid" });
  });
});
