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
    <section className="relative overflow-hidden rounded-[32px] border border-navy/10 bg-white shadow-panel">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-ember via-gold to-moss" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,47,107,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(168,131,55,0.12),transparent_32%)]" />
      <div className="relative grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr),320px] lg:px-8 lg:py-8">
        <div className="rounded-[28px] bg-gradient-to-br from-white via-white to-sand px-1 py-1">
          <div className="rounded-[26px] border border-white/70 bg-white/90 px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-xs uppercase tracking-[0.3em] text-moss">{eyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-[2.5rem]">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate sm:text-[15px]">
              {description}
            </p>
          </div>
        </div>
        {aside ? (
          <aside className="rounded-[28px] border border-navy/10 bg-gradient-to-br from-sand via-white to-mist px-5 py-5 text-sm text-slate shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            {aside}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
