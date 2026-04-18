import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-navy/10 bg-white shadow-panel">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-ember via-gold to-moss" />
      <div className="grid gap-4 px-6 py-6 lg:grid-cols-[minmax(0,1fr),280px] lg:px-8 lg:py-7">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-moss">{eyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-[2.25rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate">
            {description}
          </p>
        </div>
        {aside ? (
          <aside className="rounded-[24px] border border-navy/10 bg-gradient-to-br from-sand to-mist px-5 py-5 text-sm text-slate">
            {aside}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
