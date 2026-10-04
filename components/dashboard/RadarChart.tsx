"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DIMENSION_KEYS, type DimensionKey, type ScreeningScores } from "@/lib/screening/scoring";
import { SCREENING_CONFIG } from "@/lib/screening/config";
import { DIMENSION_COPY } from "@/lib/recommendations/content";

interface Props {
  scores: ScreeningScores;
  /** Sesi sebelumnya untuk perbandingan (garis putus-putus). */
  previous?: ScreeningScores | null;
  currentLabel?: string;
  previousLabel?: string;
  /** Tampilan ringkas untuk kartu kecil: tanpa legenda. */
  compact?: boolean;
  className?: string;
}

const W = 548;
const H = 350;
const CX = W / 2;
const CY = 172;
const R = 118;
const RINGS = [0.25, 0.5, 0.75, 1];

// Urutan sumbu searah jarum jam dari atas.
const AXES: { key: DimensionKey; angle: number }[] = [
  { key: "phonological", angle: -90 },
  { key: "rapidNaming", angle: 0 },
  { key: "spelling", angle: 90 },
  { key: "digitSpan", angle: 180 },
];

const point = (angle: number, radius: number) => {
  const a = (angle * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
};

const polygon = (scores: ScreeningScores) =>
  AXES.map((a) => {
    const p = point(a.angle, R * Math.max(0, Math.min(1, scores[a.key])));
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

export function RadarChart({ scores, previous, currentLabel = "Hasil ini", previousLabel = "Sebelumnya", compact = false, className }: Props) {
  const reduce = useReducedMotion();
  const summary = DIMENSION_KEYS.map((k) => `${DIMENSION_COPY[k].label} ${Math.round(scores[k] * 100)} persen`).join(", ");

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Grafik radar empat dimensi: ${summary}`} className="h-auto w-full">
        {/* Cincin skala */}
        {RINGS.map((r) => (
          <polygon key={r} points={AXES.map((a) => { const p = point(a.angle, R * r); return `${p.x},${p.y}`; }).join(" ")} className="fill-none stroke-neutral-300" strokeWidth={r === 1 ? 1.5 : 1} />
        ))}
        {/* Garis batas "sangat rendah" (pemicu eskalasi) */}
        <polygon points={AXES.map((a) => { const p = point(a.angle, R * SCREENING_CONFIG.escalationBelow); return `${p.x},${p.y}`; }).join(" ")} className="fill-none stroke-red-400" strokeWidth={1.2} strokeDasharray="4 4" />
        {AXES.map((a) => {
          const end = point(a.angle, R);
          return <line key={a.key} x1={CX} y1={CY} x2={end.x} y2={end.y} className="stroke-neutral-300" strokeWidth={1} />;
        })}
        {!compact &&
          RINGS.map((r) => (
            <text key={r} x={CX + 4} y={CY - R * r + 12} className="fill-neutral-500" fontSize={10}>
              {Math.round(r * 100)}%
            </text>
          ))}

        {previous && <polygon points={polygon(previous)} className="fill-none stroke-neutral-500" strokeWidth={2} strokeDasharray="6 5" strokeLinejoin="round" />}

        <motion.g initial={reduce ? false : { opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <polygon points={polygon(scores)} className="fill-brand-500/25 stroke-brand-600" strokeWidth={3} strokeLinejoin="round" />
          {AXES.map((a) => {
            const p = point(a.angle, R * Math.max(0, Math.min(1, scores[a.key])));
            const sharp = scores[a.key] < SCREENING_CONFIG.escalationBelow;
            return <circle key={a.key} cx={p.x} cy={p.y} r={5.5} className={sharp ? "fill-red-500 stroke-white" : "fill-brand-600 stroke-white"} strokeWidth={2} />;
          })}
        </motion.g>

        {/* Label sumbu: nama dimensi + persen; catatan teks "sangat rendah" agar tidak bergantung pada warna */}
        {AXES.map((a) => {
          const sharp = scores[a.key] < SCREENING_CONFIG.escalationBelow;
          const pctText = `${Math.round(scores[a.key] * 100)}%`;
          const label = DIMENSION_COPY[a.key].label;
          const horizontal = a.angle === 0 || a.angle === 180;
          const anchor = a.angle === 0 ? "start" : a.angle === 180 ? "end" : "middle";
          const x = a.angle === 0 ? CX + R + 14 : a.angle === 180 ? CX - R - 14 : CX;
          // Kiri/kanan: catatan di baris ketiga (ruang sempit). Atas/bawah: satu baris dengan persen.
          const lines = horizontal ? [label, pctText, ...(sharp ? ["sangat rendah"] : [])] : [label, sharp ? `${pctText} · sangat rendah` : pctText];
          const LH = compact ? 17 : 19;
          const y0 = a.angle === -90 ? CY - R - 14 - (lines.length - 1) * LH : a.angle === 90 ? CY + R + 28 : CY - ((lines.length - 1) * LH) / 2 + 4;
          return (
            <text key={a.key} x={x} y={y0} textAnchor={anchor}>
              {lines.map((t, i) => (
                <tspan key={i} x={x} dy={i === 0 ? 0 : LH} fontSize={i === 0 ? (compact ? 15 : 17) : compact ? 13 : 15} fontWeight={i === 0 ? 700 : 600} className={i === 0 ? "fill-ink" : sharp && i > 0 && t.includes("sangat") ? "fill-red-600" : "fill-neutral-600"}>{t}</tspan>
              ))}
            </text>
          );
        })}
      </svg>

      {!compact && (
        <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs font-medium text-neutral-600">
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-0.5 w-6 rounded bg-brand-600" />{currentLabel}</span>
          {previous && <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="w-6 border-t-2 border-dashed border-neutral-500" />{previousLabel}</span>}
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="w-6 border-t-2 border-dashed border-red-400" />Di bawah garis ini = sangat rendah (&lt; {SCREENING_CONFIG.escalationBelow.toString().replace(".", ",")})</span>
        </figcaption>
      )}

      {/* Alternatif teks untuk pembaca layar */}
      <table className="sr-only">
        <caption>Skor empat dimensi</caption>
        <thead><tr><th>Dimensi</th><th>Skor</th>{previous && <th>{previousLabel}</th>}</tr></thead>
        <tbody>
          {DIMENSION_KEYS.map((k) => (
            <tr key={k}><td>{DIMENSION_COPY[k].label}</td><td>{Math.round(scores[k] * 100)}%</td>{previous && <td>{Math.round(previous[k] * 100)}%</td>}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
