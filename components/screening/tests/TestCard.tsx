"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function TestCard({
  title,
  instruction,
  index,
  total,
  children,
}: {
  title: string;
  instruction: string;
  index: number;
  total: number;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [index, title]);
  return (
    <section className="assessment-card" aria-labelledby="task-title">
      <div className="assessment-card-heading">
        <span className="assessment-kicker">
          {index + 1} / {total}
        </span>
        <h1 id="task-title" ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>{instruction}</p>
      </div>
      {children}
    </section>
  );
}
export function Interrupted({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="assessment-notice" role="alert">
      <p>Halaman tadi ditinggalkan. Ulangi soal ini.</p>
      <button className="assessment-secondary" onClick={onRetry}>
        Ulangi soal
      </button>
    </div>
  );
}
