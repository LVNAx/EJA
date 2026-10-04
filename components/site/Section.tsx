import { Reveal } from "./Reveal";

export function Section({ title, highlight, subtitle, children, id }: { title: string; highlight?: string; subtitle?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      <Reveal className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-3xl font-bold leading-tight md:text-4xl">
          {title} {highlight && <span className="marker">{highlight}</span>}
        </h2>
        {subtitle && <p className="mt-4 text-lg text-neutral-600">{subtitle}</p>}
      </Reveal>
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="mx-auto max-w-3xl px-4 pb-6 pt-32 text-center">
      <p className="mb-3 inline-block rounded-full bg-white/70 px-4 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">{eyebrow}</p>
      <h1 className="text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-4 text-lg text-neutral-600">{subtitle}</p>}
    </header>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="card mx-auto mb-16 max-w-3xl space-y-4 p-6 leading-relaxed text-neutral-700 md:p-10 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:pl-6">{children}</div>;
}
