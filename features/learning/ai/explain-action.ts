"use server";
import { headers } from "next/headers";
import { explainWithGroq, type ExplainResult } from "@/lib/ai/advice-explanation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEMO_CHILD_ID } from "@/lib/routes";

// Batas sederhana per alamat IP agar kuota API tidak habis oleh demo publik.
// Disimpan di memori instance server, jadi sifatnya usaha terbaik, bukan jaminan.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();
const cache = new Map<string, string>();

function allow(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return false;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 1000) hits.delete(hits.keys().next().value!);
  return true;
}

async function canExplain(childId: string): Promise<boolean> {
  if (childId === DEMO_CHILD_ID || !isSupabaseConfigured()) return true;
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  // RLS membatasi baris ke keluarga yang sedang masuk.
  const { data: child } = await supabase.from("children").select("id").eq("id", childId).eq("parent_id", data.user.id).maybeSingle();
  return Boolean(child);
}

export type ExplainResponse = ExplainResult | { ok: false; reason: "forbidden" | "limited" };

export async function explainAdvice(childId: string, input: unknown): Promise<ExplainResponse> {
  if (typeof childId !== "string" || childId.length > 64) return { ok: false, reason: "invalid" };
  if (!(await canExplain(childId))) return { ok: false, reason: "forbidden" };
  const key = JSON.stringify(input ?? null);
  if (key.length > 4000) return { ok: false, reason: "invalid" };
  const cached = cache.get(key);
  if (cached) return { ok: true, text: cached };
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "lokal";
  if (!allow(ip, Date.now())) return { ok: false, reason: "limited" };
  const result = await explainWithGroq(input, { apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL });
  if (result.ok) {
    cache.set(key, result.text);
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
  }
  return result;
}
