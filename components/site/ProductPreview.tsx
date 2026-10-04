import { Volume2 } from "lucide-react";
import { Illustration, type IllustrationName } from "@/components/screening/Illustration";

const OPTIONS: { art: IllustrationName; label: string }[] = [
  { art: "balon", label: "BALON" },
  { art: "ikan", label: "IKAN" },
  { art: "apel", label: "APEL" },
  { art: "kucing", label: "KUCING" },
];

/** Cuplikan statis dari layar Tes 1, dibuat dengan komponen yang sama dengan aplikasinya. */
export function ProductPreview() {
  return (
    <div className="glass mx-auto w-full max-w-4xl rounded-[28px] p-3 md:p-4">
      <div className="overflow-hidden rounded-[20px] bg-white/95">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="ml-3 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500">eja.id/screening</span>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-10 rounded-full bg-ink" />
              <span className="h-2.5 w-6 rounded-full bg-accent-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Tes 1 dari 4</span>
            </div>
            <p className="text-2xl font-bold leading-snug md:text-3xl">Gambar mana yang bunyi awalnya sama?</p>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500 text-ink shadow-[0_8px_24px_rgba(255,140,97,0.45)]">
              <Volume2 size={28} strokeWidth={2.4} />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {OPTIONS.map((o, i) => (
              <div key={o.label} className={`flex flex-col items-center gap-1 rounded-[20px] border-2 bg-white p-4 shadow-sm ${i === 0 ? "border-brand-400" : "border-neutral-200"}`}>
                <Illustration name={o.art} size={84} />
                <span className="text-sm font-semibold text-neutral-600">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
