import type { LucideIcon } from "lucide-react";

export function StatTile({ Icon, label, value, hint }: { Icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="card flex flex-col gap-1 p-5">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
        <Icon size={16} aria-hidden="true" /> {label}
      </span>
      <span className="text-3xl font-bold">{value}</span>
      {hint && <span className="text-sm text-neutral-600">{hint}</span>}
    </div>
  );
}
