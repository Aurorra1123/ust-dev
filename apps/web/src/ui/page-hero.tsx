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
    <section className="grid gap-4 rounded-[28px] bg-white px-6 py-6 shadow-panel lg:grid-cols-[minmax(0,1fr),260px] lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-moss">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/75">
          {description}
        </p>
      </div>
      {aside ? (
        <aside className="rounded-3xl bg-mist px-5 py-5 text-sm text-ink/80">
          {aside}
        </aside>
      ) : null}
    </section>
  );
}
