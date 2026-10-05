import { TriangleAlert } from "lucide-react";

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="card flex items-start gap-4 p-4 md:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-ink"><TriangleAlert size={20} /></span>
      <p className="pt-1.5 text-sm font-medium leading-relaxed md:text-base">{children}</p>
    </div>
  );
}
