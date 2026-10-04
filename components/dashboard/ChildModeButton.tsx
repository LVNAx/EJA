import { lockForChild } from "@/lib/auth/actions";

/**
 * Menyerahkan perangkat ke anak: mencabut buka-kunci dasbor lalu membuka area anak.
 * Berupa <form> server action, jadi tetap bekerja tanpa JavaScript.
 */
export function ChildModeButton({ childId, kind, className, children, limitReached = false }: { childId: string; kind: "screening" | "home"; className?: string; children: React.ReactNode; limitReached?: boolean }) {
  // BR-04: batas sesi skrining per hari. Server juga menolak; ini hanya mencegah tombol yang pasti gagal.
  if (kind === "screening" && limitReached) return <p className="rounded-2xl bg-white/70 px-4 py-2 text-sm font-medium text-neutral-600">Batas sesi skrining hari ini sudah tercapai. Coba lagi besok.</p>;
  return (
    <form action={lockForChild.bind(null, childId, kind)}>
      <button type="submit" className={className}>{children}</button>
    </form>
  );
}
