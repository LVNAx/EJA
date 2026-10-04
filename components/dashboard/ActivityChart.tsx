import { formatDateShort, formatWeekdayShort } from "@/lib/format";
import type { ActivityDay } from "@/lib/dashboard/metrics";

/** Frekuensi belajar per hari. Tinggi batang = jumlah sesi; angka ditulis di atas batang. */
export function ActivityChart({ days }: { days: ActivityDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.sessions));
  const total = days.reduce((s, d) => s + d.sessions, 0);
  const label = `Frekuensi belajar ${days.length} hari terakhir: ${total} sesi`;

  return (
    <figure>
      <div role="img" aria-label={label} className="flex h-40 items-end gap-1.5 sm:gap-2">
        {days.map((d) => (
          <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-bold text-neutral-700">{d.sessions > 0 ? d.sessions : ""}</span>
            <div
              className={`w-full rounded-t-lg ${d.sessions > 0 ? "bg-brand-500" : "bg-neutral-200"}`}
              style={{ height: d.sessions > 0 ? `${Math.max(12, (d.sessions / max) * 100)}%` : "4px" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2" aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.day} className="flex-1 text-center text-[10px] leading-tight text-neutral-500">
            {i % 2 === (days.length - 1) % 2 ? <>{formatWeekdayShort(`${d.day}T12:00:00+07:00`)}<br />{formatDateShort(`${d.day}T12:00:00+07:00`)}</> : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Sesi belajar per hari</caption>
        <thead><tr><th>Tanggal</th><th>Sesi</th><th>Menit</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.sessions}</td><td>{Math.round(d.minutes)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
