"use client";

import { useState } from "react";
import type { AdviceInput } from "@/lib/ai/advice-explanation";
import { explainAdvice, type ExplainResponse } from "../ai/explain-action";

const MESSAGES: Record<Exclude<ExplainResponse, { ok: true }>["reason"], string> = {
  unconfigured: "Penjelasan AI belum diaktifkan di server ini. Saran di atas tetap berlaku.",
  invalid: "Data latihan belum bisa dijelaskan. Saran di atas tetap berlaku.",
  unavailable: "Penjelasan AI sedang tidak tersedia. Coba lagi nanti; saran di atas tetap berlaku.",
  forbidden: "Masuk sebagai orang tua untuk memakai penjelasan AI.",
  limited: "Terlalu banyak permintaan. Tunggu beberapa menit, lalu coba lagi.",
};

/** Tombol untuk meminta AI menjelaskan saran dengan bahasa yang lebih sederhana. */
export function AdviceExplainer({ childId, input }: { childId: string; input: AdviceInput }) {
  const [state, setState] = useState<{ status: "idle" | "loading" } | { status: "done"; result: ExplainResponse }>({ status: "idle" });
  const ask = async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "done", result: await explainAdvice(childId, input) });
    } catch {
      setState({ status: "done", result: { ok: false, reason: "unavailable" } });
    }
  };
  const result = state.status === "done" ? state.result : null;
  return (
    <div className="advice-ai">
      {!result?.ok && (
        <button className="progress-link" onClick={ask} disabled={state.status === "loading"} aria-busy={state.status === "loading"}>
          {state.status === "loading" ? "Menyusun penjelasan..." : "Jelaskan dengan bahasa sederhana"}
        </button>
      )}
      {result?.ok && (
        <div className="advice-ai-text" role="status">
          <p className="progress-kicker">PENJELASAN AI</p>
          <p>{result.text}</p>
          <p className="progress-caption">
            Disusun oleh AI (GPT-OSS melalui Groq) dari angka latihan di atas, tanpa nama atau data pribadi anak. Ini bukan diagnosis; diskusikan dengan guru BK atau psikolog bila ragu.
          </p>
        </div>
      )}
      {result && !result.ok && (
        <p className="progress-caption" role="status">
          {MESSAGES[result.reason]}
        </p>
      )}
    </div>
  );
}
