"use client";

import { Download } from "lucide-react";

// PDF lewat dialog cetak peramban ("Simpan sebagai PDF"): isi halaman hasil dan tanggal tes ikut tercetak (FR-21).
export function PrintButton({ label = "Unduh PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-ghost no-print">
      <Download size={18} aria-hidden="true" /> {label}
    </button>
  );
}
