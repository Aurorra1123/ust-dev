import type { ReactNode } from "react";

export function PageSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-[30px] border border-navy/10 bg-white shadow-panel">
      <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-navy/10 px-6 py-5 lg:px-8">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-moss">
            Service Block
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{title}</h3>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="bg-[linear-gradient(180deg,rgba(247,248,251,0.42)_0%,rgba(255,255,255,0)_120px)] px-6 py-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
