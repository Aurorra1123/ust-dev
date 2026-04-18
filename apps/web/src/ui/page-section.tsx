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
    <section className="mt-6 overflow-hidden rounded-[28px] border border-navy/10 bg-white shadow-panel">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/10 px-6 py-5 lg:px-8">
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
      <div className="px-6 py-6 lg:px-8">{children}</div>
    </section>
  );
}
