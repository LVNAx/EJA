import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";
import { LEVEL_COPY } from "@/lib/recommendations/content";
import type { RiskLevel } from "@/lib/screening/scoring";

// Ikon + teks, bukan warna saja (WCAG: tidak bergantung pada warna).
const STYLE: Record<RiskLevel, { cls: string; Icon: typeof CheckCircle2 }> = {
  low: { cls: "border-success bg-success-50 text-success-700", Icon: CheckCircle2 },
  moderate: { cls: "border-accent-300 bg-accent-100 text-ink", Icon: AlertCircle },
  high: { cls: "border-red-300 bg-red-50 text-red-700", Icon: TriangleAlert },
};

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" | "lg" }) {
  const { cls, Icon } = STYLE[level];
  const sizing = size === "lg" ? "gap-2.5 px-6 py-2.5 text-xl" : size === "sm" ? "gap-1.5 px-3 py-1 text-xs" : "gap-2 px-4 py-1.5 text-sm";
  return (
    <span className={`inline-flex items-center rounded-full border-2 font-bold ${sizing} ${cls}`}>
      <Icon size={size === "lg" ? 22 : size === "sm" ? 14 : 18} aria-hidden="true" />
      {LEVEL_COPY[level].label}
    </span>
  );
}
