"use client";

import { motion } from "framer-motion";

export function StepProgress({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`Tes ${current} dari ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <motion.span
            key={n}
            layout
            className={`h-2.5 rounded-full ${active ? "w-10 bg-ink" : done ? "w-6 bg-accent-500" : "w-2.5 bg-neutral-300"}`}
          />
        );
      })}
      <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Tes {current} dari {total}</span>
    </div>
  );
}
