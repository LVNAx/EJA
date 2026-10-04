import { formatDateShort, pct } from "@/lib/format";
import type { QuizSessionPoint } from "@/lib/dashboard/metrics";

const W = 560;
const H = 190;
const PAD = { l: 40, r: 16, t: 14, b: 34 };

/** Akurasi kuis per sesi belajar (percobaan pertama), urut waktu. Garis target 65–85% dari PRD. */
export function QuizTrendChart({ points }: { points: QuizSessionPoint[] }) {
  if (points.length === 0) return null;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.t + (1 - v) * innerH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.accuracy).toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tren akurasi kuis dari ${pct(first.accuracy)} pada ${formatDateShort(first.startedAt)} sampai ${pct(last.accuracy)} pada ${formatDateShort(last.startedAt)}`} className="h-auto w-full">
        <rect x={PAD.l} y={y(0.85)} width={innerW} height={y(0.65) - y(0.85)} className="fill-success/15" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-neutral-200" />
            <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} className="fill-neutral-500">{Math.round(v * 100)}%</text>
          </g>
        ))}
        <path d={line} className="fill-none stroke-brand-600" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.sessionId} cx={x(i)} cy={y(p.accuracy)} r={4.5} className="fill-brand-600 stroke-white" strokeWidth={2}>
            <title>{`${formatDateShort(p.startedAt)}: ${pct(p.accuracy)} dari ${p.answered} soal`}</title>
          </circle>
        ))}
        <text x={x(0)} y={H - 10} textAnchor={points.length === 1 ? "middle" : "start"} fontSize={11} className="fill-neutral-500">{formatDateShort(first.startedAt)}</text>
        {points.length > 1 && <text x={x(points.length - 1)} y={H - 10} textAnchor="end" fontSize={11} className="fill-neutral-500">{formatDateShort(last.startedAt)}</text>}
      </svg>
      <figcaption className="mt-1 flex items-center justify-center gap-2 text-xs font-medium text-neutral-600">
        <span aria-hidden="true" className="h-3 w-5 rounded-sm bg-success/25" /> Rentang target 65–85%
      </figcaption>
      <table className="sr-only">
        <caption>Akurasi kuis per sesi</caption>
        <thead><tr><th>Tanggal</th><th>Pelajaran</th><th>Akurasi</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.sessionId}><td>{formatDateShort(p.startedAt)}</td><td>{p.title}</td><td>{pct(p.accuracy)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
