"use client";

import { AnimatePresence, motion } from "framer-motion";

interface Props {
  questionKey: string | number;
  index: number;
  total: number;
  label: string;
  children: React.ReactNode;
}

export function QuestionFrame({ questionKey, index, total, label, children }: Props) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-neutral-600">
        <span>{label}</span>
        <span>Soal {index + 1} dari {total}</span>
      </div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-neutral-200">
        <motion.div className="h-full rounded-full bg-accent-500" animate={{ width: `${(index / total) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={questionKey} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.25 }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
