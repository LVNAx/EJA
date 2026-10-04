import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { DisclaimerNote } from "@/components/dashboard/DisclaimerNote";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { loadDashboard } from "@/lib/dashboard/data";
import { latestValidScreening } from "@/lib/dashboard/metrics";
import { formatDateLong } from "@/lib/format";
import { DIMENSION_COPY } from "@/lib/recommendations/content";
import { ROUTES } from "@/lib/routes";
import { DIMENSION_KEYS } from "@/lib/screening/scoring";

// FR-55 (P2): dua anak dalam satu akun dibandingkan per dimensi, memakai skrining valid terbaru masing-masing.
export default async function ComparePage({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  const { children } = await loadDashboard();
  const eligible = children.map((c) => ({ child: c, latest: latestValidScreening(c.screenings) })).filter((x) => x.latest !== null);

  const pick = (id: string | undefined, fallbackIndex: number) => eligible.find((x) => x.child.profile.id === id) ?? eligible[fallbackIndex];
  const A = pick(searchParams.a, 0);
  const B = (searchParams.b ? eligible.find((x) => x.child.profile.id === searchParams.b) : undefined) ?? eligible.find((x) => x !== A) ?? eligible[1];

  const back = <Link href={ROUTES.dashboard} className="inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-neutral-600 hover:text-ink"><ArrowLeft size={16} aria-hidden="true" /> Ringkasan</Link>;

  if (eligible.length < 2 || !A?.latest || !B?.latest) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <Scale size={44} className="text-brand-500" strokeWidth={1.6} aria-hidden="true" />
          <h1 className="text-2xl font-bold">Perbandingan butuh dua anak yang sudah skrining</h1>
          <p className="max-w-md text-neutral-600">Perbandingan memakai hasil skrining valid terbaru dari dua anak dalam satu akun.</p>
        </div>
        <DisclaimerNote />
      </div>
    );
  }

  const aName = A.child.profile.name;
  const bName = B.child.profile.name;
  const select = "rounded-2xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-base outline-none focus:border-brand-500";

  return (
    <div className="flex flex-col gap-6">
      {back}
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Bandingkan anak</h1>
        <p className="mt-1 text-neutral-600">Ini untuk melihat profil kemampuan masing-masing, bukan peringkat. Setiap anak berbeda usia, kelas, dan keadaan saat bermain.</p>
      </div>

      <form method="get" className="card flex flex-wrap items-end gap-4 p-5">
        <label className="flex flex-col gap-1.5 text-sm font-bold">Anak pertama
          <select name="a" defaultValue={A.child.profile.id} className={select}>{eligible.map((x) => <option key={x.child.profile.id} value={x.child.profile.id}>{x.child.profile.name}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">Anak kedua
          <select name="b" defaultValue={B.child.profile.id} className={select}>{eligible.map((x) => <option key={x.child.profile.id} value={x.child.profile.id}>{x.child.profile.name}</option>)}</select>
        </label>
        <button type="submit" className="btn-primary !px-6 !py-2.5 !text-base">Bandingkan</button>
      </form>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]" aria-label="Perbandingan">
        <div className="card p-6">
          <RadarChart scores={A.latest.scores} previous={B.latest.scores} currentLabel={`${aName} · ${formatDateLong(A.latest.completedAt)}`} previousLabel={`${bName} · ${formatDateLong(B.latest.completedAt)}`} />
        </div>
        <div className="card flex flex-col gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">{aName}</p><RiskBadge level={A.latest.riskLevel} size="sm" /></div>
            <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">{bName}</p><RiskBadge level={B.latest.riskLevel} size="sm" /></div>
          </div>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Skor per dimensi</caption>
            <thead><tr className="border-b border-neutral-200 text-neutral-500"><th className="py-2 pr-2 font-semibold">Dimensi</th><th className="py-2 pr-2 text-right font-semibold">{aName}</th><th className="py-2 text-right font-semibold">{bName}</th></tr></thead>
            <tbody>
              {DIMENSION_KEYS.map((k) => (
                <tr key={k} className="border-b border-neutral-100 last:border-0">
                  <th className="py-2.5 pr-2 font-semibold">{DIMENSION_COPY[k].label}</th>
                  <td className="py-2.5 pr-2 text-right font-bold">{Math.round(A.latest!.scores[k] * 100)}%</td>
                  <td className="py-2.5 text-right font-bold">{Math.round(B.latest!.scores[k] * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DisclaimerNote />
    </div>
  );
}
