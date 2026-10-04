import Link from "next/link";
import { Compass } from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AuroraBackground />
      <Compass size={64} className="text-brand-500" strokeWidth={1.6} />
      <h1 className="text-4xl font-bold">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-neutral-600">Sepertinya halaman ini belum ada atau sudah pindah.</p>
      <Link href="/" className="btn-primary">Kembali ke beranda</Link>
    </main>
  );
}
