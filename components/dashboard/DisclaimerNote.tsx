import { TriangleAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/screening/scoring";

/** Wajib tampil di semua halaman hasil (FR-20); sengaja tanpa tombol tutup. */
export function DisclaimerNote({ className = "" }: { className?: string }) {
  return (
    <p role="note" className={`flex gap-3 rounded-card border border-accent-300 bg-accent-50 p-4 text-sm font-medium ${className}`}>
      <TriangleAlert size={20} className="mt-0.5 shrink-0 text-accent-600" aria-hidden="true" />
      {DISCLAIMER}
    </p>
  );
}
